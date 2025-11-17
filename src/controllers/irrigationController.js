import mqtt from "mqtt";
import mongoose from "mongoose";
import Greenhouse from "../models/Greenhouse.js";
import IrrigationLog from "../models/IrrigationLog.js";

const client = mqtt.connect("mqtt://143.47.110.219:1883");

export const startIrrigation = async (req, res) => {
  try {
    const { greenhouseId, duration } = req.body;

    if (!mongoose.Types.ObjectId.isValid(greenhouseId)) {
      return res.status(400).json({ message: "Invalid greenhouseId" });
    }

    const exists = await Greenhouse.findById(greenhouseId);
    if (!exists) {
      return res.status(404).json({ message: "Greenhouse not found" });
    }

    if (!duration || duration <= 0 || duration > 30000) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    const topic = `greenhouse/${greenhouseId}/riego`;

    const payload = JSON.stringify({
      duracion: duration
    });

    client.publish(topic, payload);

    // ---- guardar log ----
    await IrrigationLog.create({
      greenhouseId,
      duration
    });

    return res.json({
      message: "Irrigation started",
      greenhouseId,
      duration
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLatestIrrigation = async (req, res) => {
  try {
    const { greenhouseId } = req.params;

    // Validar formato del ID
    if (!mongoose.Types.ObjectId.isValid(greenhouseId)) {
      return res.status(400).json({ message: "Invalid greenhouseId" });
    }

    // Buscar el último registro de riego
    const lastLog = await IrrigationLog
      .findOne({ greenhouseId })
      .sort({ started_at: -1 });

    // Si nunca se ha regado
    if (!lastLog) {
      return res.json({
        exists: false,
        message: "No irrigation logs found for this greenhouse"
      });
    }

    // Respuesta normal
    return res.json({
      exists: true,
      greenhouseId,
      duration: lastLog.duration,
      started_at: lastLog.started_at
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};