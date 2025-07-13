// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const waitingUsers = {}; // category: [socket]

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinCategory", (category) => {
    console.log(`${socket.id} joined category: ${category}`);
    
    if (!waitingUsers[category]) {
      waitingUsers[category] = [];
    }

    // Check if someone is already waiting
    if (waitingUsers[category].length > 0) {
      const opponentSocket = waitingUsers[category].shift();
      const roomId = `${socket.id}#${opponentSocket.id}`;

      // Dummy question for now
      const question = `Solve a ${category} question: Reverse a string`;

      // Send match info to both users
      opponentSocket.emit("matchFound", { roomId, question });
      socket.emit("matchFound", { roomId, question });

      console.log("Match made:", roomId);
    } else {
      // No one waiting, add current user to waiting queue
      waitingUsers[category].push(socket);
    }
  });

  socket.on("leaveQueue", (category) => {
  if (waitingUsers[category]) {
    waitingUsers[category] = waitingUsers[category].filter(s => s.id !== socket.id);
    console.log(`${socket.id} left queue for ${category}`);
  }
  });
});

server.listen(3000, () => {
  console.log("Socket.IO server running on http://localhost:3000");
});
