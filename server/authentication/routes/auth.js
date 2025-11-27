import "dotenv/config";

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/users.js";

const router = express.Router();

// ----------------------------
// EMAIL TRANSPORTER (GMAIL)
// ----------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be Gmail App Password
  },
});

// ----------------------------
// SEND OTP
// ----------------------------
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    let user = await User.findOne({ email });
    if (!user) user = new User({ email });

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Prepare email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
    });

    console.log(`📧 OTP sent to ${email}: ${otp}`);

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("💀 OTP send error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ----------------------------
// VERIFY OTP + SET PASSWORD
// ----------------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password)
      return res.status(400).json({ message: "Email, OTP & Password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Incorrect OTP" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    // Hash password
    user.passwordHash = await bcrypt.hash(password, 10);

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password set successfully" });

  } catch (error) {
    console.error("💀 Verify OTP error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------------------
// LOGIN
// ----------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("💀 Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
