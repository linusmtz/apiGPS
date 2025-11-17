import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Campos obligatorios
    if (!name || !email || !password || !phone)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    // Email único
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(409).json({ error: "El correo ya está registrado" });

    // Phone único
    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      return res.status(409).json({ error: "El número de teléfono ya está registrado" });

    // Hash
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await User.create({
      name,
      email,
      phone,
      password_hash: hashed,
      role: "standard"
    });

    const { password_hash, ...safeUser } = user.toObject();

    res.status(201).json({ 
      message: "Usuario registrado", 
      user: safeUser 
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Debe haber email o phone
    if ((!email && !phone) || !password)
      return res.status(400).json({ error: "Faltan credenciales" });

    let user = null;

    // Si viene email → login por email
    if (email) {
      user = await User.findOne({ email });
    }

    // Si no viene email pero sí phone → login por phone
    if (!user && phone) {
      user = await User.findOne({ phone });
    }

    if (!user)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Credenciales inválidas" });

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
        phone: safeUser.phone,
        role: safeUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
};
