// routes/sensorRoutes.js
import express from "express";
import {
  addSensorData,
  getLatestData,
  getSensorType,
  getSensorHistory 
} from "../controllers/sensorController.js";

const router = express.Router();

router.post("/:greenhouseId", addSensorData); // ESP32 envía
router.get("/:greenhouseId/latest", getLatestData); // Flutter obtiene último
router.get("/:greenhouseId/history", getSensorHistory);// Flutter obtiene histórico
router.get("/:greenhouseId/:type", getSensorType); // Flutter obtiene por tipo

export default router;

