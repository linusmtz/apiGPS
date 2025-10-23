import Greenhouse from "../models/Greenhouse.js";
import ActivationCode from "../models/ActivationCode.js";
import User from "../models/User.js";

export const registerGreenhouse = async (req, res) => {
  try {
    const { userId, activationCode, greenhouseName } = req.body;

    const code = await ActivationCode.findById(activationCode);
    if (!code || !code.valid)
      return res.status(400).json({ message: "Código inválido o ya usado" });

    const greenhouse = await Greenhouse.create({
      name: greenhouseName,
      device_code: activationCode,
      registered_by: userId,
    });

    await ActivationCode.findByIdAndUpdate(activationCode, {
      valid: false,
      linked_greenhouse_id: greenhouse._id,
      activated_by_user: userId,
      activated_at: new Date()
    });

    await User.findByIdAndUpdate(userId, { $push: { greenhouses: greenhouse._id } });

    res.json({ message: "Invernadero registrado con éxito", greenhouse });
  } catch (err) {
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};


export const getGreenhousesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Busca todos los invernaderos registrados por ese usuario
    const greenhouses = await Greenhouse.find({ registered_by: userId })
      .populate("registered_by", "name email") // opcional: incluye datos del usuario
      .sort({ created_at: -1 });

    if (!greenhouses.length)
      return res.status(404).json({ message: "No se encontraron invernaderos para este usuario." });

    res.json({
      ok: true,
      count: greenhouses.length,
      greenhouses
    });
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo invernaderos", error: err.message });
  }
};

