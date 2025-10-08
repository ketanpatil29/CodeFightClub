import 'dotenv/config';
import express from "express";
import http from "http";
import cors from "cors";
import * as connectDB from "./authentication/server.js"; // your DB connection
import initSocket from "./socketHandler.js";

import runCodeRouter from "./authentication/routes/runCode.js";
import aiQuestionsRouter from "./aiQuestions.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/ai", aiQuestionsRouter);
app.use("/run-code", runCodeRouter);

const server = http.createServer(app);
initSocket(server); // Initialize WebSocket

server.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
