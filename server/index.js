import 'dotenv/config';
import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";

// Import routes
import authRoutes from "./authentication/routes/auth.js";
import runCodeRouter from "./authentication/routes/runCode.js";
import aiQuestionsRouter from "./aiQuestions.js";

// Import socket handler
import initSocket from "./socketHandler.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
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
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);
console.log("✅ Socket.IO initialized");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
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