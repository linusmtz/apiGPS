import mqtt from "mqtt";
import mongoose from "mongoose";
import { runAI } from "../services/aiService.js";
import { moveServoAuto } from "../services/servoAutoService.js";

// ALERTAS
import {
  sendStrongAnomalyAlert,
  sendSensorFailureAlert,
  sendGeneralAlert,
} from "../services/emailService.js";

const greenhouseID = "691b6b683711f95800de6f1a";
const greenhouseObjectId = new mongoose.Types.ObjectId(greenhouseID);
const OWNER_EMAIL = "danielaaldaco9@gmail.com";

// ===============================
// 🛑 GLOBAL ANTI-SPAM + ESTADOS
// ===============================
if (!global.lastAnomalyEmail) global.lastAnomalyEmail = 0;
if (!global.lastSensorFailEmail) global.lastSensorFailEmail = 0;
if (!global.lastHeatEmail) global.lastHeatEmail = 0;
if (!global.roofState) global.roofState = "UNKNOWN"; // "OPEN" | "CLOSED"

const EMAIL_COOLDOWN = 5 * 60 * 1000; // 5 minutos

export default function startMqttConsumer() {
  const client = mqtt.connect("mqtt://150.136.81.124:1883");
  const topicMQTT = `greenhouse/${greenhouseID}/sensorData`;

  const sensorCollection = mongoose.connection.collection("sensor_data");

  client.on("connect", () => {
    console.log("⚡ MQTT conectado");

    client.subscribe(topicMQTT, (err) => {
      if (!err) {
        console.log(`📡 Suscrito al tópico: ${topicMQTT}`);
      } else {
        console.log("❌ Error al suscribirse:", err.message);
      }
    });
  });

  client.on("message", async (topic, message) => {
    if (topic !== topicMQTT) return;

    console.log("\n────────────────────────────────────────");
    console.log(`📥 Mensaje recibido en ${topic}`);
    console.log("Payload bruto:", message.toString());

    let data;
    try {
      data = JSON.parse(message.toString());
      console.log("✔ JSON parseado:", data);
    } catch (error) {
      console.log("❌ Error al parsear JSON:", error.message);
      return;
    }

    // ===============================
    // VALIDACIÓN DE CAMPOS
    // ===============================
    const camposOk =
      data.temperatura != null &&
      data.humedad_aire != null &&
      data.humedad_suelo_raw != null &&
      data.luz_lux != null;

    if (!camposOk) {
      console.log("⚠ Datos incompletos → NO se guarda");
      return;
    }

    // ===============================
    // GUARDAR EN MONGO (en prod lo activas)
    // ===============================
    const doc = {
      greenhouseId: greenhouseObjectId,
      temperature: data.temperatura,
      humidity_air: data.humedad_aire,
      humidity_soil: data.humedad_suelo_raw,
      light: data.luz_lux,
      timestamp: new Date(),
    };

    try {
      await sensorCollection.insertOne(doc);
      console.log("🟩 Documento guardado:", doc);
    } catch (error) {
      console.log("❌ Error guardando en Mongo:", error.message);
    }

    // ===============================
    // IA
    // ===============================
    const now = new Date();
    const hour = now.getHours();
    const minute_of_day = hour * 60 + now.getMinutes();
    const nowMs = Date.now();

    const aiInput = {
      temperature: doc.temperature,
      humidity_air: doc.humidity_air,
      humidity_soil: doc.humidity_soil,
      light: doc.light,
      hour,
      minute_of_day,
    };

    let aiResult;
    try {
      aiResult = await runAI(aiInput);
      console.log("🤖 Resultado IA:", aiResult);
    } catch (err) {
      console.log("❌ Error ejecutando IA:", err.message);
      return;
    }

    // ===============================
    // 🚨 1) ANOMALÍA IA
    // ===============================
    if (aiResult.anomaly) {
      console.log("⚠ Anomalía detectada — IA NO actuará.");

      if (nowMs - global.lastAnomalyEmail > EMAIL_COOLDOWN) {
        await sendStrongAnomalyAlert(OWNER_EMAIL, "Lectura anómala", aiInput);
        console.log("📧 Enviado (anomaly)");
        global.lastAnomalyEmail = nowMs;
      } else {
        console.log("⏳ No enviado (cooldown)");
      }
      return;
    }

    // ===============================
    // ⚠ 2) FALLA DE SENSOR
    // ===============================
    if (doc.humidity_soil > 500 || doc.humidity_soil < 0) {
      console.log("⚠ Falla del sensor de suelo.");

      if (nowMs - global.lastSensorFailEmail > EMAIL_COOLDOWN) {
        await sendSensorFailureAlert(OWNER_EMAIL, "Humedad del suelo");
        global.lastSensorFailEmail = nowMs;
      } else {
        console.log("⏳ No enviado (cooldown)");
      }
      return;
    }

    // ===============================
    // 🌡 3) TEMPERATURA ALTA
    // ===============================
    if (aiResult.prediction_temp > 35) {
      if (global.roofState !== "OPEN") {
        console.log("🔥 Techo ABIERTO automáticamente.");

        moveServoAuto(greenhouseID, "ABRIR");
        global.roofState = "OPEN";
      } else {
        console.log("⬆ Ya está abierto, no mando comando.");
      }

      if (nowMs - global.lastHeatEmail > EMAIL_COOLDOWN) {
        await sendGeneralAlert(
          OWNER_EMAIL,
          "Calor extremo predicho",
          `Se predicen ${aiResult.prediction_temp.toFixed(2)}°C.`
        );
        global.lastHeatEmail = nowMs;
      }

      return;
    }

    // ===============================
    // 🧊 4) TEMPERATURA BAJA
    // ===============================
    if (aiResult.prediction_temp < 10) {
      if (global.roofState !== "CLOSED") {
        console.log("❄ Cerrando techo automáticamente.");
        moveServoAuto(greenhouseID, "CERRAR");
        global.roofState = "CLOSED";
      } else {
        console.log("⬇ Ya está cerrado, no mando comando.");
      }

      if (nowMs - global.lastHeatEmail > EMAIL_COOLDOWN) {
        await sendGeneralAlert(
          OWNER_EMAIL,
          "Frío extremo predicho",
          `Se predicen ${aiResult.prediction_temp.toFixed(2)}°C.`
        );
        global.lastHeatEmail = nowMs;
      }

      return;
    }

    console.log("────────────────────────────────────────\n");
  });

  client.on("error", (err) => {
    console.log("❌ Error MQTT:", err.message);
  });
}
