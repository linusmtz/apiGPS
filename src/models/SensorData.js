// models/SensorData.js
import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema({
  greenhouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Greenhouse", required: true },
  temperature: Number,
  humidity_soil: Number,
  humidity_air: Number,
  light: Number,
  ph: Number,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("SensorData", sensorDataSchema);

