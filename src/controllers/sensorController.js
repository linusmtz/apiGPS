// controllers/sensorController.js
import mongoose from "mongoose";
import SensorData from "../models/SensorData.js";

// ------------------------------------------------------
// Downsample a máximo N puntos para graficar
// ------------------------------------------------------
function downsample(data, maxPoints = 200) {
  if (data.length <= maxPoints) return data;

  const step = data.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, i) => data[Math.floor(i * step)]);
}

// ------------------------------------------------------
// POST /api/sensors/:greenhouseId
// Guarda una lectura desde Flutter o ESP
// ------------------------------------------------------
export const addSensorData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    const { temperature, humidity_soil, humidity_air, light } = req.body;

    const data = new SensorData({
      greenhouseId: objectId,
      temperature,
      humidity_soil,
      humidity_air,
      light,
      timestamp: new Date()
    });

    await data.save();
    res.status(201).json({ message: "Sensor data saved", data });

  } catch (err) {
    console.error("❌ Error saving sensor data:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// GET /api/sensors/:greenhouseId/latest
// Última lectura
// ------------------------------------------------------
export const getLatestData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;

    const latest = await SensorData.findOne({
      greenhouseId: new mongoose.Types.ObjectId(greenhouseId)
    })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest) return res.status(404).json({ message: "No data found" });

    res.json(latest);

  } catch (err) {
    console.error("❌ Error getLatestData:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// GET /api/sensors/:greenhouseId/:type
// Último valor de cada sensor
// ------------------------------------------------------
export const getSensorType = async (req, res) => {
  try {
    const { greenhouseId, type } = req.params;

    const latest = await SensorData.findOne({
      greenhouseId: new mongoose.Types.ObjectId(greenhouseId)
    })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest) {
      return res.status(404).json({ message: "No data found" });
    }

    if (latest[type] === undefined) {
      return res.status(400).json({ message: `Invalid sensor type: ${type}` });
    }

    res.json({
      greenhouseId,
      type,
      value: latest[type],
      timestamp: latest.timestamp
    });

  } catch (err) {
    console.error("❌ Error getSensorType:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// GET /api/sensors/:greenhouseId/history (últimos 20)
// ------------------------------------------------------
export const getHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;

    const data = await SensorData.find({
      greenhouseId: new mongoose.Types.ObjectId(greenhouseId)
    })
      .sort({ timestamp: -1 })
      .limit(20);

    if (!data.length) {
      return res.status(404).json({ message: "No history found" });
    }

    res.json(data);

  } catch (err) {
    console.error("❌ Error getHistory:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------
// GET /api/sensors/:greenhouseId/history?type=&range=
// CONVERSIÓN FORZOSA A DATE → YA NO FALLA NUNCA
// ------------------------------------------------------
export const getSensorHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { type = "temperature", range = "1d" } = req.query;

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

    const now = new Date();
    const since = new Date(now.getTime() - hours * 3600 * 1000);

    const objectId = new mongoose.Types.ObjectId(greenhouseId);

    // 🔥 PIPELINE QUE FUNCIONA CON TIMESTAMP STRING O DATE
    const pipeline = [
      { $match: { greenhouseId: objectId } },

      // 1️⃣ Forzar timestamp → Date SIEMPRE
      {
        $addFields: {
          parsedTimestamp: {
            $cond: [
              { $eq: [{ $type: "$timestamp" }, "date"] },
              "$timestamp",
              { $toDate: "$timestamp" }
            ]
          }
        }
      },

      // 2️⃣ Filtrar por rango
      {
        $match: { parsedTimestamp: { $gte: since } }
      },

      // 3️⃣ Ordenar
      {
        $sort: { parsedTimestamp: 1 }
      },

      // 4️⃣ Regresar campos finales
      {
        $project: {
          _id: 0,
          timestamp: "$parsedTimestamp",
          value: `$${type}`
        }
      }
    ];

    let raw = await mongoose.connection
      .collection("sensor_data")
      .aggregate(pipeline)
      .toArray();

    if (!raw.length) {
      return res.json({
        greenhouseId,
        type,
        range,
        count: 0,
        data: []
      });
    }

    // Downsample a 200 puntos
    raw = downsample(raw, 200);

    res.json({
      greenhouseId,
      type,
      range,
      count: raw.length,
      data: raw
    });

  } catch (err) {
    console.error("❌ Error getSensorHistory:", err);
    res.status(500).json({ message: err.message });
  }
};
