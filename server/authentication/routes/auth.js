// server/routes/auth.js
import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/users.js"; // your mongoose User model

const router = express.Router();

// Helper: sign JWT
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Helper: upsert user by email and provider info
async function findOrCreateUser({ email, name, provider, providerId, avatar }) {
  if (!email) throw new Error("Email is required from provider");

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      email,
      userName: name || email.split("@")[0],
      avatar: avatar || null,
      oauthProviders: [{ provider, providerId }],
    });
  } else {
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

/* ----------------------------
   Step 1: Redirect endpoints
   ---------------------------- */

// Redirect to Google consent
router.get("/google", (req, res) => {
  const root = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account"
  });
  res.redirect(`${root}?${params.toString()}`);
});

// Redirect to GitHub consent
router.get("/github", (req, res) => {
  const root = "https://github.com/login/oauth/authorize";
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/auth/github/callback`,
    scope: "user:email",
    allow_signup: "true"
  });
  res.redirect(`${root}?${params.toString()}`);
});

/* ----------------------------
   Step 2: Callback endpoints
   ---------------------------- */

// Google callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    // Exchange code for tokens
    const tokenResp = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`,
        grant_type: "authorization_code"
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenResp.data;
    if (!access_token) throw new Error("No access token from Google");

    // Fetch user info
    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name, picture, sub: providerId } = userInfo.data;
    if (!email) return res.status(400).send("Google account has no email");

    // Upsert user
    const user = await findOrCreateUser({
      email,
      name,
      provider: "google",
      providerId,
      avatar: picture
    });

    // issue jwt
    const token = signToken(user._id);

    // redirect to frontend with token
    const front = process.env.FRONTEND_URL.replace(/\/$/, "");
    const qp = new URLSearchParams({
      token,
      email: user.email,
      username: user.userName || ""
    });
    return res.redirect(`${front}/oauth-callback?${qp.toString()}`);
  } catch (err) {
    console.error("Google callback error:", err.response?.data || err.message || err);
    return res.status(500).send("Google OAuth failed");
  }
});

// GitHub callback
router.get("/github/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    // Exchange code for access token
    const tokenResp = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL}/auth/github/callback`
      },
      { headers: { Accept: "application/json" } }
    );

    const { access_token } = tokenResp.data;
    if (!access_token) throw new Error("No access token from GitHub");

    // Get GitHub user
    const ghUserResp = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${access_token}`, Accept: "application/vnd.github.v3+json" }
    });

    const { id: providerId, avatar_url: avatar, login: ghLogin, name } = ghUserResp.data;

    // Get email list
    let email = null;
    const emailsResp = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${access_token}`, Accept: "application/vnd.github.v3+json" }
    });

    if (Array.isArray(emailsResp.data)) {
      const primary = emailsResp.data.find(e => e.primary && e.verified) || emailsResp.data.find(e => e.verified) || emailsResp.data[0];
      email = primary?.email;
    }

    if (!email) {
      return res.status(400).send("GitHub account has no public/verified email");
    }

    // Upsert user
    const user = await findOrCreateUser({
      email,
      name: name || ghLogin,
      provider: "github",
      providerId: String(providerId),
      avatar
    });

    const token = signToken(user._id);

    const front = process.env.FRONTEND_URL.replace(/\/$/, "");
    const qp = new URLSearchParams({
      token,
      email: user.email,
      username: user.userName || ""
    });
    return res.redirect(`${front}/oauth-callback?${qp.toString()}`);
  } catch (err) {
    console.error("GitHub callback error:", err.response?.data || err.message || err);
    return res.status(500).send("GitHub OAuth failed");
  }
});

export default router;
