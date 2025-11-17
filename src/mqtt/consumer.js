import mqtt from "mqtt";
import mongoose from "mongoose";

const greenhouseId = new mongoose.Types.ObjectId("691b6b683711f95800de6f1a");

export default function startMqttConsumer() {
  const client = mqtt.connect("mqtt://143.47.110.219:1883");

  const sensorCollection = mongoose.connection.collection("sensor_data");

  client.on("connect", () => {
    console.log("⚡ MQTT conectado");
    client.subscribe("greenhouse/test", (err) => {
      if (!err) console.log("📡 Suscrito al tópico: greenhouse/test");
    });
  });

  client.on("message", async (topic, message) => {
    if (topic !== "greenhouse/test") return;

    console.log("\n────────────────────────────────────────");
    console.log("📥 Mensaje recibido en greenhouse/test");
    console.log("Payload bruto:", message.toString());

    let data;
    try {
      data = JSON.parse(message.toString());
      console.log("✔ JSON parseado:", data);
    } catch (error) {
      console.log("❌ Error al parsear JSON:", error.message);
      return;
    }

    // Validación estricta para los campos reales
    const camposOk =
      data.temperatura != null &&
      data.humedad_aire != null &&
      data.humedad_suelo_raw != null &&
      data.luz_lux != null &&
      data.timestamp;

    if (!camposOk) {
      console.log("⚠ Datos incompletos → NO se guarda");
      return;
    }


    const doc = {
      greenhouseId,
      temperature: data.temperatura,        
      humidity_air: data.humedad_aire,      
      humidity_soil: data.humedad_suelo_raw, 
      light: data.luz_lux,                 
      timestamp: data.timestamp             
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
