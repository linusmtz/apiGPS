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
