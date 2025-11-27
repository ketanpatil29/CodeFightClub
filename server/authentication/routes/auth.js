import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/users.js";

const router = express.Router();

/* ==========================
   SEND EMAIL USING BREVO API
   ========================== */
async function sendOTPEmail(to, otp) {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email: to }],
        subject: "Your OTP Code",
        htmlContent: `<p>Your OTP is: <b>${otp}</b></p>`,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📩 Email Sent:", response.data);
    return true;
  } catch (err) {
    console.error("Email Error:", err.response?.data || err);
    return false;
  }
}

/* ==========================
   SEND OTP
   ========================== */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    let user = await User.findOne({ email });
    if (!user) user = new User({ email });

    user.otp = otp.toString();
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const sent = await sendOTPEmail(email, otp);
    if (!sent) return res.status(500).json({ message: "Failed to send OTP" });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   VERIFY OTP
   ========================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   LOGIN
   ========================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
