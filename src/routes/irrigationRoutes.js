import express from "express";
import { startIrrigation } from "../controllers/irrigationController.js";

const router = express.Router();

router.post("/start", startIrrigation);

export default router;
