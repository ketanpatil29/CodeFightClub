// index.js
import 'dotenv/config';
import express from "express";
import http from "http";
import cors from "cors";
import authApp from "./authentication/server.js"; // DB + auth routes
import initSocket from "./socketHandler.js";

import runCodeRouter from "./authentication/routes/runCode.js";
import aiQuestionsRouter from "./aiQuestions.js";

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Mount auth routes from server.js
app.use(authApp); // ✅ all /auth routes are included

// Other routes
app.use("/ai", aiQuestionsRouter);
app.use("/run-code", runCodeRouter);

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT || 3000, () =>
  console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3000}`)
);
