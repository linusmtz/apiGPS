import mongoose from "mongoose";

const activationCodeSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ej. GK-23WX-91A5
  valid: { type: Boolean, default: true },
  linked_greenhouse_id: { type: mongoose.Schema.Types.ObjectId, ref: "Greenhouse", default: null },
  activated_by_user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  activated_at: { type: Date, default: null }
});

const ActivationCode = mongoose.model("ActivationCode", activationCodeSchema, "activation_codes");
export default ActivationCode;
