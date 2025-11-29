// routes/auth.js
import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/users.js"; // your mongoose User model
import bcrypt from "bcrypt"; // not used for oauth but kept if needed

const router = express.Router();

/**
 * Helper: sign JWT
 */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Helper: upsert user by email and provider info
 */
async function findOrCreateUser({ email, name, provider, providerId, avatar }) {
  if (!email) {
    throw new Error("Email is required from provider");
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      email,
      userName: name || email.split("@")[0],
      avatar: avatar || null,
      oauthProviders: [{ provider, providerId }],
    });
  } else {
    // ensure provider is listed
    user.userName = user.userName || name || email.split("@")[0];
    user.avatar = user.avatar || avatar || user.avatar;
    const hasProv = (user.oauthProviders || []).some(
      (p) => p.provider === provider && p.providerId === providerId
    );
    if (!hasProv) {
      user.oauthProviders = user.oauthProviders || [];
      user.oauthProviders.push({ provider, providerId });
    }
  }

  await user.save();
  return user;
}

/* ============================
   GOOGLE: exchange code -> user
   ============================ */
router.post("/google", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    if (!code || !redirect_uri) return res.status(400).json({ message: "code and redirect_uri are required" });

    // Exchange code for tokens
    const tokenResp = await axios.post("https://oauth2.googleapis.com/token", new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri,
      grant_type: "authorization_code"
    }).toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const { access_token, id_token } = tokenResp.data;
    if (!access_token && !id_token) throw new Error("Failed to get tokens from Google");

    // Get user info (use id_token or userinfo)
    // id_token is a JWT that also contains email; we fetch userinfo to be safe.
    const userInfoResp = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token || id_token}` }
    });

    const { email, name, picture, sub: providerId } = userInfoResp.data;
    if (!email) return res.status(400).json({ message: "Google account did not provide email" });

    const user = await findOrCreateUser({
      email,
      name,
      provider: "google",
      providerId,
      avatar: picture
    });

    const token = signToken(user._id);
    res.json({ message: "Login success", token, user: { _id: user._id, email: user.email, userName: user.userName } });

  } catch (err) {
    console.error("Google OAuth error:", err.response?.data || err.message || err);
    res.status(500).json({ message: "Google OAuth failed", error: err.response?.data || err.message });
  }
});

/* ============================
   GITHUB: exchange code -> user
   ============================ */
router.post("/github", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    if (!code || !redirect_uri) return res.status(400).json({ message: "code and redirect_uri are required" });

    // Exchange code for access token
    const tokenResp = await axios.post("https://github.com/login/oauth/access_token", {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri
    }, {
      headers: { Accept: "application/json" }
    });

    const { access_token } = tokenResp.data;
    if (!access_token) throw new Error("Failed to get GitHub access_token");

    // Get GitHub user
    const ghUserResp = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${access_token}`, Accept: "application/vnd.github.v3+json" }
    });

    const { id: providerId, avatar_url: avatar, login: ghLogin, name } = ghUserResp.data;

    // GitHub may not return email in /user, so fetch emails
    let email = null;
    const emailResp = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${access_token}`, Accept: "application/vnd.github.v3+json" }
    });

    if (Array.isArray(emailResp.data)) {
      // Find primary verified email
      const primary = emailResp.data.find(e => e.primary && e.verified) || emailResp.data.find(e => e.verified) || emailResp.data[0];
      email = primary?.email;
    }

    if (!email) {
      // If still no email, create a pseudo email (not recommended). Better to ask user for email on frontend.
      return res.status(400).json({ message: "GitHub account has no public email. Please enable email or use another login." });
    }

    const user = await findOrCreateUser({
      email,
      name: name || ghLogin,
      provider: "github",
      providerId: String(providerId),
      avatar
    });

    const token = signToken(user._id);
    res.json({ message: "Login success", token, user: { _id: user._id, email: user.email, userName: user.userName } });

  } catch (err) {
    console.error("GitHub OAuth error:", err.response?.data || err.message || err);
    res.status(500).json({ message: "GitHub OAuth failed", error: err.response?.data || err.message });
  }
});

export default router;
