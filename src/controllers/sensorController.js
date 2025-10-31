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

export const getSensorHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { type = "temperature", range = "1d" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(greenhouseId)) {
      return res.status(400).json({ message: "Invalid greenhouseId" });
    }

    // 🔹 Convertir rango a milisegundos
    const now = new Date();
    const since = new Date(now);
    const rangeMap = {
      "1h": 1 / 24,
      "3h": 3 / 24,
      "6h": 6 / 24,
      "12h": 12 / 24,
      "1d": 1,
      "3d": 3,
      "7d": 7,
      "30d": 30,
    };

    const days = rangeMap[range] || 1;
    since.setDate(now.getDate() - days);

    // 🔹 Filtro base
    const filter = {
      greenhouseId: new mongoose.Types.ObjectId(greenhouseId),
      timestamp: { $gte: since },
    };

    // 🔹 Campos específicos
    const projection = {
      _id: 0,
      timestamp: 1,
      [type]: 1,
    };

    // 🔹 Consulta MongoDB
    const data = await SensorData.find(filter, projection)
      .sort({ timestamp: 1 })
      .limit(500);

    if (!data.length) {
      return res.status(404).json({ message: "No data found in range" });
    }

    // 🔹 Formato uniforme
    const formatted = data
      .filter((d) => d[type] !== undefined)
      .map((d) => ({
        timestamp: d.timestamp,
        value: d[type],
      }));

    res.json({
      greenhouseId,
      type,
      range,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Error en getSensorHistory:", err);
    res.status(500).json({ message: err.message });
  }
};
