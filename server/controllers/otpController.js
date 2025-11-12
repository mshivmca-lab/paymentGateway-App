import User from "../models/User.js";
import transporter from "../config/email.js";

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.isEmailVerified) return res.status(400).send("Verify email first");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your UPI OTP",
    html: `<h2>${otp}</h2> It will expire in 5 minutes.`,
  });

  res.json({ success: true, message: "OTP sent to email" });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
    return res.status(400).send("Invalid or expired OTP");
  }
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP are required" });
}
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.send("OTP verified successfully");
};

