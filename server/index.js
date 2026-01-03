import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from multiple locations
const rootEnvPath = path.resolve(__dirname, '../.env');
const serverEnvPath = path.resolve(__dirname, '.env');

// Try root first, then server folder
if (dotenv.config({ path: rootEnvPath }).error) {
  console.log('⚠️ No .env in root, trying server folder...');
  dotenv.config({ path: serverEnvPath });
}

console.log('📂 Environment loaded from:', rootEnvPath);
console.log('🔐 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
console.log('🗄️ MONGO_URI:', process.env.MONGO_URI ? '✅ Loaded' : '❌ Missing');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing');

// Import routes
import authRoutes from "./authentication/routes/auth.js";
import runCodeRouter from "./authentication/routes/runCode.js";
import aiQuestionsRouter from "./aiQuestions.js"; // This should have /submit-answer route

// Import socket handler
import initSocket from "./socketHandler.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "https://codefightclub.vercel.app",
    "https://codefightclub.onrender.com",
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/ai", aiQuestionsRouter);
app.use("/run-code", runCodeRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 Server is running!",
    status: "active",
    timestamp: new Date().toISOString(),
    environment: {
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      mongoUri: !!process.env.MONGO_URI,
      jwtSecret: !!process.env.JWT_SECRET,
    }
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);
console.log("✅ Socket.IO initialized");

const PORT = process.env.PORT || 5000;

// Verify critical environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("❌ ERROR: GOOGLE_CLIENT_ID not found!");
  console.error("Make sure .env file exists and contains GOOGLE_CLIENT_ID");
}

if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI not found!");
}

if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR: JWT_SECRET not found!");
}

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured ✅' : 'Missing ❌'}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

export default app;