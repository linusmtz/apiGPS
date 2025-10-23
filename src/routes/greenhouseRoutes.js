import express from "express";
import { registerGreenhouse, getGreenhousesByUser } from "../controllers/greenhouseController.js";

const router = express.Router();

router.post("/register", registerGreenhouse);
router.get("/user/:userId", getGreenhousesByUser);


export default router;

