import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/users.js";

const router = express.Router();

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

console.log("🔐 Google OAuth initialized with Client ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing");

// 🔐 Helper: generate JWT
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ================================
// 🔹 GOOGLE LOGIN ROUTE
// ================================
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    console.log("📥 Google login request received");
    console.log("Token received:", token ? "✅ Yes" : "❌ No");

    if (!token) {
      console.error("❌ No token provided");
      return res.status(400).json({
        success: false,
        error: "Google token missing",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("❌ GOOGLE_CLIENT_ID not configured in environment");
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    console.log("🔍 Verifying Google token...");

    // 1️⃣ Verify Google token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("❌ Google token verification failed:", verifyError.message);
      return res.status(401).json({
        success: false,
        error: "Invalid Google token",
        details: verifyError.message,
      });
    }

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture,
    } = payload;

    console.log("✅ Google token verified for:", email);

    if (!email) {
      console.error("❌ No email in Google account");
      return res.status(400).json({
        success: false,
        error: "Google account has no email",
      });
    }

    // 2️⃣ Find existing user
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    // 3️⃣ Create user if not exists
    if (!user) {
      console.log("📝 Creating new user:", email);
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || null,
      });
    } else {
      console.log("👤 User found:", email);
      // 4️⃣ Link googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // 5️⃣ Generate JWT (YOUR app token)
    const jwtToken = generateToken(user._id);

    console.log("✅ Login successful for:", email);

    // 6️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("❌ GOOGLE AUTH ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: err.message,
    });
  }
});

export default router;