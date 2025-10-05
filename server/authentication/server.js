// server/authentication/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import auth routes
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // your React frontend
  credentials: true
}));

// Auth routes
app.use("/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(`mongodb://ketan:ketanvsmongodb@127.0.0.1:27017/codeFightClub?authSource=admin`)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
