
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
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

const User = mongoose.model("User", userSchema);


export default User;
