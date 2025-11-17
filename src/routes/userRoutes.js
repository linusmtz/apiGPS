
import express from "express";
import { registerUser, loginUser, forgotPassword, verifyResetCode, resetPassword } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
