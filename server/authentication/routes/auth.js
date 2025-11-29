// server/routes/auth.js
import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/users.js";

const router = express.Router();

// Helper: Sign JWT
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Helper: Upsert user in DB
async function findOrCreateUser({ email, name, provider, providerId, avatar }) {
  if (!email) throw new Error("Email is required");

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
    const exists = user.oauthProviders.some(
      p => p.provider === provider && p.providerId === providerId
    );
    if (!exists) {
      user.oauthProviders.push({ provider, providerId });
    }
  }

  await user.save();
  return user;
}

/* --------------------------------------
   STEP 1: REDIRECT TO GOOGLE LOGIN PAGE
   -------------------------------------- */
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

/* --------------------------------------
   STEP 2: GOOGLE CALLBACK
   -------------------------------------- */
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

    const access_token = tokenResp.data.access_token;
    if (!access_token) throw new Error("No access token");

    // Fetch profile
    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email, name, picture, sub: providerId } = userInfo.data;

    if (!email) return res.status(400).send("No Google email");

    const user = await findOrCreateUser({
      email,
      name,
      provider: "google",
      providerId,
      avatar: picture
    });

    const token = signToken(user._id);

    // ⭐ ADD LOG HERE
    console.log(`🔐 OAuth Login: ${email} logged in via Google`);

    // Redirect to frontend
    const qp = new URLSearchParams({
      token,
      email: user.email,
      username: user.userName || ""
    });

    return res.redirect(
      `${process.env.FRONTEND_URL.replace(/\/$/, "")}/oauth-callback?${qp.toString()}`
    );

  } catch (err) {
    console.error("Google OAuth Error:", err.response?.data || err.message);
    return res.status(500).send("Google OAuth failed");
  }
});

/* --------------------------------------
   GITHUB REDIRECT
   -------------------------------------- */
router.get("/github", (req, res) => {
  const root = "https://github.com/login/oauth/authorize";
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/auth/github/callback`,
    scope: "user:email"
  });
  res.redirect(`${root}?${params.toString()}`);
});

/* --------------------------------------
   GITHUB CALLBACK
   -------------------------------------- */
router.get("/github/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    // Exchange code for token
    const tokenResp = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const { access_token } = tokenResp.data;
    if (!access_token) throw new Error("No GitHub access token");

    // Fetch GitHub user
    const ghUser = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${access_token}` }
    });

    const { id: providerId, avatar_url, login, name } = ghUser.data;

    // Get emails
    const emailResp = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${access_token}` }
    });

    const primary =
      emailResp.data.find(e => e.primary && e.verified) ||
      emailResp.data.find(e => e.verified) ||
      emailResp.data[0];

    const email = primary?.email;
    if (!email) return res.status(400).send("GitHub email not found");

    const user = await findOrCreateUser({
      email,
      name: name || login,
      provider: "github",
      providerId: String(providerId),
      avatar: avatar_url
    });

    const token = signToken(user._id);

    // ⭐ ADD LOG HERE
    console.log(`🔐 OAuth Login: ${email} logged in via GitHub`);

    const qp = new URLSearchParams({
      token,
      email: user.email,
      username: user.userName || ""
    });

    return res.redirect(
      `${process.env.FRONTEND_URL.replace(/\/$/, "")}/oauth-callback?${qp.toString()}`
    );

  } catch (err) {
    console.error("GitHub OAuth Error:", err.response?.data || err.message);
    return res.status(500).send("GitHub OAuth failed");
  }
});

export default router;
