import mongoose from "mongoose";
import SensorData from "../models/SensorData.js";

// ------------------------------------------------------
// Función para downsamplear los datos (para gráficas bonitas)
// ------------------------------------------------------
function downsample(data, maxPoints = 200) {
  if (data.length <= maxPoints) return data;

  const step = data.length / maxPoints;
  const sampled = [];

  for (let i = 0; i < maxPoints; i++) {
    sampled.push(data[Math.floor(i * step)]);
  }

  return sampled;
}

// ------------------------------------------------------
// 📤 POST /api/sensors/:greenhouseId
// Guarda nueva lectura
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
// Devuelve la lectura más reciente
// ------------------------------------------------------
export const getLatestData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const latest = await SensorData.findOne({ greenhouseId: objectId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest)
      return res.status(404).json({ message: "No data found" });

    res.json(latest);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// 📊 GET /api/sensors/:greenhouseId/:type
// Devuelve el último valor de un sensor
// ------------------------------------------------------
export const getSensorType = async (req, res) => {
  try {
    const { greenhouseId, type } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const latest = await SensorData.findOne({ greenhouseId: objectId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest)
      return res.status(404).json({ message: "No data found" });

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
    console.error("Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// 📜 GET /api/sensors/:greenhouseId/history
// Últimas 20 lecturas
// ------------------------------------------------------
export const getHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const data = await SensorData.find({ greenhouseId: objectId })
      .sort({ timestamp: -1 })
      .limit(20);

    if (!data.length)
      return res.status(404).json({ message: "No history data found" });

    res.json(data);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// 📈 GET /api/sensors/:greenhouseId/history?type=&range=
// Filtra por rango y devuelve máximo 200 puntos
// ------------------------------------------------------
export const getSensorHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { type = "temperature", range = "1d" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(greenhouseId)) {
      return res.status(400).json({ message: "Invalid greenhouseId" });
    }

    // Rango → horas
    const hoursMap = {
      "1h": 1,
      "3h": 3,
      "6h": 6,
      "12h": 12,
      "1d": 24,
      "3d": 72,
      "7d": 168,
      "30d": 720
    };

    const hours = hoursMap[range] || 24;

    // Convertimos timestamp string ISO a comparación válida
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const filter = {
      greenhouseId: new mongoose.Types.ObjectId(greenhouseId),
      timestamp: { $gte: since }, // funciona porque timestamp es string ISO
    };

    const projection = {
      _id: 0,
      timestamp: 1,
      [type]: 1,
    };

    const data = await SensorData.find(filter, projection).sort({ timestamp: 1 });

    if (!data.length) {
      return res.json({
        greenhouseId,
        type,
        range,
        count: 0,
        data: [],
      });
    }

    // Downsample para no saturar la gráfica
    const sampled = downsample(data, 200);

    const formatted = sampled
      .filter(d => d[type] !== undefined)
      .map(d => ({
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
    console.error("❌ Error getSensorHistory:", err);
    res.status(500).json({ message: err.message });
  }
};
