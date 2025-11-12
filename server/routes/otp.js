import express from 'express';
import { sendOtp, verifyOtp } from '../controllers/otpController.js'
const router = express.Router();
// const { sendOtp, verifyOtp } = require("../controllers/otpController");
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
export default router;