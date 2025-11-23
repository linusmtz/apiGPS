import mqtt from "mqtt";
import mongoose from "mongoose";
import Greenhouse from "../models/Greenhouse.js";

const client = mqtt.connect("mqtt://150.136.81.124:1883");

export const moveServo = async (req, res) => {
  try {
    const { greenhouseId, command } = req.body;

    if (!mongoose.Types.ObjectId.isValid(greenhouseId)) {
      return res.status(400).json({ message: "Invalid greenhouseId" });
    }

    const exists = await Greenhouse.findById(greenhouseId);
    if (!exists) {
      return res.status(404).json({ message: "Greenhouse not found" });
    }

    const valid = ["ABRIR", "CERRAR"];
    if (!valid.includes(command)) {
      return res.status(400).json({ message: "Invalid command" });
    }

    const topic = `greenhouse/${greenhouseId}/servo`;
    client.publish(topic, command);

    return res.json({
      message: "Servo command sent",
      greenhouseId,
      command
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
