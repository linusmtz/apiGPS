import mongoose from "mongoose";

const greenhouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  device_code: { type: String, required: true, unique: true },
  registered_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sensors: {
    temperature: Number,
    humidity: Number,
    soil_moisture: Number,
    light_intensity: Number
  },
  thresholds: {
    temperature: { min: Number, max: Number },
    humidity: { min: Number, max: Number },
  },
  created_at: { type: Date, default: Date.now }
});

const Greenhouse = mongoose.model("Greenhouse", greenhouseSchema, "greenhouses");
export default Greenhouse;
