import mongoose from "mongoose";
import Greenhouse from "../models/Greenhouse.js";
import ActivationCode from "../models/ActivationCode.js";
import User from "../models/User.js";

export const registerGreenhouse = async (req, res) => {
  try {
    const { userId, activationCode, greenhouseName } = req.body;


    const code = await ActivationCode.findOne({ _id: activationCode });
    if (!code || !code.valid) {
      return res.status(400).json({ message: "Código inválido o ya usado" });
    }

    const greenhouse = await Greenhouse.create({
      name: greenhouseName,
      device_code: activationCode,
      registered_by: new mongoose.Types.ObjectId(userId),
    });

    await ActivationCode.updateOne(
      { _id: activationCode },
      {
        $set: {
          valid: false,
          linked_greenhouse_id: greenhouse._id,
          activated_by_user: new mongoose.Types.ObjectId(userId),
          activated_at: new Date(),
        },
      }
    );


    await User.findByIdAndUpdate(userId, {
      $push: { greenhouses: greenhouse._id },
    });

    return res.json({
      ok: true,
      message: "Invernadero registrado con éxito",
      greenhouse,
    });
  } catch (err) {
    console.error("Error en registerGreenhouse:", err);
    return res
      .status(500)
      .json({ message: "Error interno", error: err.message });
  }
};

export const getGreenhousesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const greenhouses = await Greenhouse.find({
      registered_by: new mongoose.Types.ObjectId(userId),
    })
      .populate("registered_by", "name email")
      .sort({ created_at: -1 });

    if (!greenhouses.length) {
      return res
        .status(404)
        .json({ message: "No se encontraron invernaderos para este usuario." });
    }

    return res.json({
      ok: true,
      count: greenhouses.length,
      greenhouses,
    });
  } catch (err) {
    console.error("Error en getGreenhousesByUser:", err);
    return res
      .status(500)
      .json({ message: "Error obteniendo invernaderos", error: err.message });
  }
};

