import express from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/users.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login Route
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token missing" });
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log("Google Login:", { email, name, googleId });

    // Check if user already exists
    let user = await User.findOne({ googleId });

    // If new user → create
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId,
        avatar: picture || null,
      });

      console.log(`[NEW USER] ${name} (${email}) registered`);
    } else {
      console.log(`[LOGIN] ${name} (${email}) logged in`);
    }

    return res.json({
      success: true,
      message: "Google login successful",
      user,
    });
  } catch (error) {
    console.error("[GOOGLE AUTH ERROR]", error);
    return res.status(400).json({ success: false, error: "Authentication failed" });
  }
});

export default router;
