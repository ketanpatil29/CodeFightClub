import { Server } from "socket.io";
import dotenv from "dotenv";
import verifiedQuestions from "./aiQuestions.js";
dotenv.config();

import axios from "axios";

const waitingUsers = {}; // { category: [{ userId, username, socketId, question }] }
const activeMatches = {}; // { roomId: { user1, user2, question, status } }
const userToRoom = {}; // { userId: roomId }
const abandonedUsers = new Set(); // Users who left mid-match

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const BACKEND_URL = process.env.BACKEND_URL;

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Find match
    socket.on("findMatch", async ({ userId, username, category }) => {
      console.log(`🔍 ${username} looking for match in ${category}`);

      abandonedUsers.delete(userId);

      Object.keys(waitingUsers).forEach(cat => {
        waitingUsers[cat] = waitingUsers[cat]?.filter(u => u.userId !== userId) || [];
      });

      if (!waitingUsers[category]) waitingUsers[category] = [];

      const opponent = waitingUsers[category].shift(); // ⬅️ REMOVE immediately

      // ✅ SERVER chooses the question ONCE
      const question = verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];

      if (opponent) {
        const roomId = `room_${userId}_${opponent.userId}_${Date.now()}`;

        activeMatches[roomId] = {
          user1: { userId, username, socketId: socket.id, status: "solving" },
          user2: { userId: opponent.userId, username: opponent.username, socketId: opponent.socketId, status: "solving" },
          question,
          category,
          startTime: Date.now(),
        };

        userToRoom[userId] = roomId;
        userToRoom[opponent.userId] = roomId;

        socket.join(roomId);
        io.sockets.sockets.get(opponent.socketId)?.join(roomId);

        const payloadForUser1 = {
          roomId,
          opponent: opponent.username,
          opponentId: opponent.userId,
          yourUsername: username,
          question,
        };

        const payloadForUser2 = {
          roomId,
          opponent: username,
          opponentId: userId,
          yourUsername: opponent.username,
          question,
        };

        socket.emit("matchFound", payloadForUser1);
        io.to(opponent.socketId).emit("matchFound", payloadForUser2);

        console.log("🎮 Match created:", roomId);
      } else {
        waitingUsers[category].push({
          userId,
          username,
          socketId: socket.id,
        });

        socket.emit("waiting", {
          message: "Looking for opponent...",
          question,
        });
      }
    });


    // Submit answer
    socket.on("submitAnswer", ({ userId, roomId, success }) => {
      const match = activeMatches[roomId];
      if (!match) return;

      // Update user status
      if (match.user1.userId === userId) {
        match.user1.status = success ? "completed" : "solving";
      } else if (match.user2.userId === userId) {
        match.user2.status = success ? "completed" : "solving";
      }

      const winner = match.user1.status === "completed" ? match.user1 :
        match.user2.status === "completed" ? match.user2 : null;

      // Notify opponent of status update
      const opponentSocketId = match.user1.userId === userId ? match.user2.socketId : match.user1.socketId;
      io.to(opponentSocketId).emit("opponentStatusUpdate", {
        status: success ? "completed" : "solving",
      });

      // If someone won, notify both
      if (winner) {
        const loser = winner === match.user1 ? match.user2 : match.user1;

        io.to(match.user1.socketId).emit("gameOver", {
          winner: winner.username,
          winnerId: winner.userId,
          loser: loser.username,
          youWon: match.user1.userId === winner.userId,
        });

        io.to(match.user2.socketId).emit("gameOver", {
          winner: winner.username,
          winnerId: winner.userId,
          loser: loser.username,
          youWon: match.user2.userId === winner.userId,
        });

        console.log(`🏆 ${winner.username} won against ${loser.username}`);

        // Cleanup
        delete activeMatches[roomId];
        delete userToRoom[match.user1.userId];
        delete userToRoom[match.user2.userId];
      }
    });

    // User exits arena
    socket.on("exitArena", ({ userId, roomId }) => {
      handleUserExit(io, socket, userId, roomId, false);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      // Find user's room
      const userId = Object.keys(userToRoom).find(
        (uid) => {
          const roomId = userToRoom[uid];
          const match = activeMatches[roomId];
          return match?.user1.socketId === socket.id || match?.user2.socketId === socket.id;
        }
      );

      if (userId) {
        const roomId = userToRoom[userId];
        handleUserExit(io, socket, userId, roomId, true);
      }

      // Remove from waiting queues
      Object.keys(waitingUsers).forEach((cat) => {
        waitingUsers[cat] = waitingUsers[cat]?.filter((u) => u.socketId !== socket.id) || [];
      });
    });

    // Cancel search
    socket.on("cancelSearch", ({ userId }) => {
      Object.keys(waitingUsers).forEach((cat) => {
        waitingUsers[cat] = waitingUsers[cat]?.filter((u) => u.userId !== userId) || [];
      });
      console.log(`🚫 ${userId} cancelled search`);
    });
  });

  return io;
}

// Helper function to handle user exit/disconnect
function handleUserExit(io, socket, userId, roomId, isDisconnect) {
  const match = activeMatches[roomId];
  if (!match) return;

  const exitingUser = match.user1.userId === userId ? match.user1 : match.user2;
  const remainingUser = match.user1.userId === userId ? match.user2 : match.user1;

  // Mark user as abandoned (so they don't match with same opponent)
  abandonedUsers.add(userId);

  console.log(`🚪 ${exitingUser.username} ${isDisconnect ? 'disconnected' : 'exited'} from ${roomId}`);

  // Notify remaining user
  io.to(remainingUser.socketId).emit("opponentLeft", {
    opponentName: exitingUser.username,
    message: `${exitingUser.username} has left the match. You can continue practicing or exit.`,
  });

  // Cleanup
  delete activeMatches[roomId];
  delete userToRoom[match.user1.userId];
  delete userToRoom[match.user2.userId];
}