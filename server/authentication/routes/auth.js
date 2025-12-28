import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/users.js";

const router = express.Router();

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔐 Helper: generate JWT
function generateToken(userId) {
  return jwt.sign(
    { userId },                 // payload
    process.env.JWT_SECRET,     // secret
    { expiresIn: "7d" }         // validity
  );
}

// ================================
// 🔹 GOOGLE LOGIN ROUTE
// ================================
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Google token missing",
      });
    }

    // 1️⃣ Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub: googleId,
      email,
      name,
      picture,
    } = payload;

    if (!email) {
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
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || null,
      });
    } else {
      // 4️⃣ Link googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // 5️⃣ Generate JWT (YOUR app token)
    const jwtToken = generateToken(user._id);

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
    console.error("GOOGLE AUTH ERROR:", err);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
});

export default router;
