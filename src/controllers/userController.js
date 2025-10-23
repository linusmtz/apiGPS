import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "El correo ya está registrado" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password_hash: hashed,
      role: "standard"
    });

    const { password_hash, ...safeUser } = user.toObject();
    res.status(201).json({ message: "Usuario registrado", user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Faltan credenciales" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const { password_hash, ...safeUser } = user.toObject();

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: safeUser._id,
        name: safeUser.name,
        email: safeUser.email,
        role: safeUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
};
