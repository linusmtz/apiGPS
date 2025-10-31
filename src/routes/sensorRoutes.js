// routes/sensorRoutes.js
import express from "express";
import {
  addSensorData,
  getLatestData,
  getHistory,
  getSensorType,
} from "../controllers/sensorController.js";

const router = express.Router();

router.post("/:greenhouseId", addSensorData); // ESP32 envía
router.get("/:greenhouseId/latest", getLatestData); // Flutter obtiene último
router.get("/:greenhouseId/history", getHistory); // Flutter obtiene histórico
router.get("/:greenhouseId/:type", getSensorType); // Flutter obtiene por tipo

export default router;

