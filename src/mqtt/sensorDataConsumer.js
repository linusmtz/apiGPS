import mqtt from "mqtt";
import mongoose from "mongoose";

const greenhouseID = "691b6b683711f95800de6f1a";
const greenhouseObjectId = new mongoose.Types.ObjectId(greenhouseID);

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

    const camposOk =
      data.temperatura != null &&
      data.humedad_aire != null &&
      data.humedad_suelo_raw != null &&
      data.luz_lux != null;

    if (!camposOk) {
      console.log("⚠ Datos incompletos → NO se guarda");
      return;
    }

    const doc = {
      greenhouseId: greenhouseObjectId,
      temperature: data.temperatura,
      humidity_air: data.humedad_aire,
      humidity_soil: data.humedad_suelo_raw,
      light: data.luz_lux,
      timestamp: new Date(),  // ← único cambio REAL
    };

    try {
      await sensorCollection.insertOne(doc);
      console.log("✅ Documento guardado:", doc);
    } catch (error) {
      console.log("❌ Error guardando en Mongo:", error.message);
    }

    console.log("────────────────────────────────────────\n");
  });

  client.on("error", (err) => {
    console.log("❌ Error MQTT:", err.message);
  });
}
