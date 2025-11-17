import mongoose from "mongoose";

const IrrigationLogSchema = new mongoose.Schema({
  greenhouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Greenhouse", required: true },
  duration: { type: Number, required: true },
  started_at: { type: Date, default: Date.now },
});

export default mongoose.model("IrrigationLog", IrrigationLogSchema, "irrigation_log");
