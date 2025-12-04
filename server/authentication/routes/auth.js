import express from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/users.js"; // make sure path is correct

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token missing" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    console.log("Google User Logged In:", { email, name, googleId });

    // Check if user exists
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({ email, name, googleId });
      console.log(`[NEW USER] ${name} (${email}) registered`);
    } else {
      console.log(`[LOGIN] ${name} (${email}) connected`);
    }

    res.json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.error("[AUTH ERROR]", error.message);
    res.status(400).json({ error: "Authentication failed" });
  }
});

export default router;
