import mongoose from "mongoose";
import SensorData from "../models/SensorData.js";

// ------------------------------------------------------
// 📤 POST /api/sensors/:greenhouseId
// Guarda una nueva lectura de sensores (desde ESP32)
// ------------------------------------------------------
export const addSensorData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const { temperature, humidity_soil, humidity_air, light, ph } = req.body;

    const data = new SensorData({
      greenhouseId: objectId,
      temperature,
      humidity_soil,
      humidity_air,
      light,
      ph,
    });

    await data.save();
    res.status(201).json({ message: "✅ Sensor data saved", data });
  } catch (err) {
    console.error("Error saving sensor data:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// 📥 GET /api/sensors/:greenhouseId/latest
// Devuelve la lectura más reciente del invernadero
// ------------------------------------------------------
export const getLatestData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    console.log("🧠 Recibido greenhouseId:", greenhouseId);

    const objectId = new mongoose.Types.ObjectId(greenhouseId);
    console.log("🔍 Convertido a ObjectId:", objectId);

    const latest = await SensorData.findOne({ greenhouseId: objectId })
      .sort({ timestamp: -1 })
      .limit(1);

    console.log("📦 Resultado de consulta:", latest);

    if (!latest) {
      return res.status(404).json({ message: "No data found" });
    }

    res.json(latest);
  } catch (err) {
    console.error("💥 Error en getLatestData:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// 📊 GET /api/sensors/:greenhouseId/:type
// Devuelve el valor más reciente de un tipo específico
// ------------------------------------------------------
export const getSensorType = async (req, res) => {
  try {
    const { greenhouseId, type } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const latest = await SensorData.findOne({ greenhouseId: objectId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest) return res.status(404).json({ message: "No data found" });

    // Si el tipo no existe en el documento
    if (latest[type] === undefined) {
      return res.status(400).json({ message: `Invalid sensor type: ${type}` });
    }

    res.json({
      greenhouseId,
      type,
      value: latest[type],
      timestamp: latest.timestamp,
    });
  } catch (err) {
    console.error("Error fetching sensor type:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// 📜 GET /api/sensors/:greenhouseId/history
// Devuelve las últimas 20 lecturas del invernadero
// ------------------------------------------------------
export const getHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const data = await SensorData.find({ greenhouseId: objectId })
      .sort({ timestamp: -1 })
      .limit(20);

    if (!data.length) {
      return res.status(404).json({ message: "No history data found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: err.message });
  }
};

