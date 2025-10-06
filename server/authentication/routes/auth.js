import 'dotenv/config';

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/users.js"; // make sure this is ESM-exported

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  logger: true,
  debug: true,
});

// POST /auth/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP and expiry to user in DB (create user if not exists)
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }
    user.otp = otp.toString();
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}:`, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("💀 Error in /send-otp route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password)
      return res.status(400).json({ message: "Email, OTP, and password are required" });

    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash password and update user
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password set successfully" });
  } catch (error) {
    console.error("💀 Error in /verify-otp route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        userName: user.userName || "", // optional
        email: user.email,
      },
    });
  } catch (error) {
    console.error("💀 Error in /login route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
