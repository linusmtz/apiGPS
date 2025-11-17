import express from "express";
import { moveServo } from "../controllers/servoController.js";

const router = express.Router();

router.post("/move", moveServo);

export default router;
