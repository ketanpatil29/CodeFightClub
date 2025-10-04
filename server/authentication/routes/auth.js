const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/users");
require('dotenv').config();

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if( !email || !emailRegex.test(email) ){
        return res.status(400).json({ message: "Invalid email format"});
    } 

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await User.findOne({ email });
    if ( !user )
    {
        user = new User({ email });
    }
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60000);

    await user.save();

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP code",
            text: `Your OTP is ${otp}`,
        });

        res.json({ message: "OTP sent successfully"})
    } catch (error) {
        console.error("Email send error:", error);
        res.status(500).json({ message: "Failed to send OTP. Please check your email address."});
    }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  user.passwordHash = passwordHash;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({ message: "Password set successfully" });
});

// 3. Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

module.exports = router;