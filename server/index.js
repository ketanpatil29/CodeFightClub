// server/index.js
require('dotenv').config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./authentication/server"); // your existing DB connection file
const initSocket = require("./socketHandler");

const app = express();
app.use(cors());
app.use(express.json());

// create HTTP + Socket server
const server = http.createServer(app);
initSocket(server);

server.listen(3000, () => console.log("🚀 Server with WebSocket running on http://localhost:3000"));
