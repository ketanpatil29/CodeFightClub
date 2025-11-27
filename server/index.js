import 'dotenv/config';
import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./authentication/routes/auth.js";
import initSocket from "./socketHandler.js";

import runCodeRouter from "./authentication/routes/runCode.js";
import aiQuestionsRouter from "./aiQuestions.js";

const app = express();
app.use(cors({
  origin: [
    "https://codefightclub.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/ai", aiQuestionsRouter);
app.use("/run-code", runCodeRouter);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT;

// Wait for MongoDB before starting server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));
