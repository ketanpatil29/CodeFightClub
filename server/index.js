import 'dotenv/config';
import express from "express";
import http from "http";
import cors from "cors";
import * as connectDB from "./authentication/server.js";  // ✅ note the *
import * as initSocket from "./socketHandler.js";          // ✅ note the *

import aiQuestionsRouter from "./aiQuestions.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/ai", aiQuestionsRouter);

const server = http.createServer(app);
initSocket.default(server); // ✅ call its default export if it exists

server.listen(3000, () =>
  console.log("🚀 Server with WebSocket running on http://localhost:3000")
);
