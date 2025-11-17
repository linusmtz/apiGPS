import express from "express";
import { startIrrigation } from "../controllers/irrigationController.js";
import { getLatestIrrigation }  from "../controllers/irrigationController.js";

const router = express.Router();

router.post("/start", startIrrigation);
router.get("/:greenhouseId/last", getLatestIrrigation);

export default router;
