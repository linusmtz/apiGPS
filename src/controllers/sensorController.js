// controllers/sensorController.js
import SensorData from "../models/SensorData.js";

export const addSensorData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { temperature, humidity_soil, humidity_air, light, ph } = req.body;

    const data = new SensorData({
      greenhouseId,
      temperature,
      humidity_soil,
      humidity_air,
      light,
      ph,
    });

    await data.save();
    res.status(201).json({ message: "Sensor data saved", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLatestData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const latest = await SensorData.findOne({ greenhouseId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest) return res.status(404).json({ message: "No data found" });

    res.json(latest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSensorType = async (req, res) => {
  try {
    const { greenhouseId, type } = req.params;
    const latest = await SensorData.findOne({ greenhouseId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latest) return res.status(404).json({ message: "No data found" });

    res.json({
      greenhouseId,
      type,
      value: latest[type],
      timestamp: latest.timestamp,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const data = await SensorData.find({ greenhouseId })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

