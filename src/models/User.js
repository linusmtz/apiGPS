import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, default: "standard" },
  greenhouses: [{ type: String }],
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: "light" }
  },
  password_reset_code: { type: String, default: null },
  password_reset_expires: { type: Date, default: null },
  password_reset_attempts: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

const User = mongoose.model("User", userSchema);


export default User;
