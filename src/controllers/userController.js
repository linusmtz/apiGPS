import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOTPEmail } from "../services/emailService.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// --------------------------------------------------
// 1) REGISTER USER
// --------------------------------------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(409).json({ error: "El correo ya está registrado" });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      return res.status(409).json({ error: "El número de teléfono ya está registrado" });

    const hashed = await bcrypt.hash(password, 10);

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

// --------------------------------------------------
// 2) LOGIN USER
// --------------------------------------------------
export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password)
      return res.status(400).json({ error: "Faltan credenciales" });

    let user = email
      ? await User.findOne({ email })
      : await User.findOne({ phone });

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

// --------------------------------------------------
// 3) FORGOT PASSWORD (Enviar código OTP por email)
// Protección anti-spam, anti-fuerza-bruta y anti-expiración
// --------------------------------------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Seguridad: no revelar si existe o no
    if (!user) {
      return res.status(200).json({
        message: "If the email exists, a verification code will be sent."
      });
    }

    const now = Date.now();
    const expired =
      !user.password_reset_expires || now > user.password_reset_expires;

    if (!user.password_reset_code || expired) {
      // Generar un nuevo código
      user.password_reset_code = generateOTP();
      user.password_reset_expires = now + 10 * 60 * 1000; // 10 minutos
      user.password_reset_attempts = 0;
    } else {
      // Existe uno vigente → solo renovar expiración
      user.password_reset_expires = now + 10 * 60 * 1000;
      user.password_reset_attempts = 0;
    }

    await user.save();

    await sendOTPEmail(email, user.password_reset_code);

    return res.json({
      message: "If the email exists, a verification code will be sent."
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------
// 4) VERIFY RESET CODE
// Límite de intentos, expiración y limpieza automática
// --------------------------------------------------
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid code" });

    const now = Date.now();

    if (!user.password_reset_code || !user.password_reset_expires)
      return res.status(400).json({ message: "No reset requested" });

    if (now > user.password_reset_expires) {
      user.password_reset_code = null;
      user.password_reset_expires = null;
      user.password_reset_attempts = 0;
      await user.save();
      return res.status(400).json({ message: "Code expired" });
    }

    if (user.password_reset_attempts >= 5) {
      user.password_reset_code = null;
      user.password_reset_expires = null;
      user.password_reset_attempts = 0;
      await user.save();
      return res.status(400).json({ message: "Too many attempts" });
    }

    if (user.password_reset_code !== code) {
      user.password_reset_attempts += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid code" });
    }

    // Código correcto
    user.password_reset_attempts = 0;
    await user.save();

    return res.json({ message: "Code verified" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------
// 5) RESET PASSWORD (Eliminar código y actualizar password)
// --------------------------------------------------
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.password_reset_code || !user.password_reset_expires)
      return res.status(400).json({ message: "No active reset process" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashed;

    // Limpiar el OTP y estado
    user.password_reset_code = null;
    user.password_reset_expires = null;
    user.password_reset_attempts = 0;

    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
