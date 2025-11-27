// server/authentication/server.js
import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: "*",
  credentials: true
}));

// Auth routes
app.use("/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

export default app; // ✅ export app, don’t listen here
