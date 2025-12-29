import { Server } from "socket.io";
import dotenv from "dotenv";
import { getQuestion } from "./questionService.js";

dotenv.config();

/**
 * waitingUsers = {
 *   DSA: [{ userId, username, socketId }]
 * }
 */
const waitingUsers = {};

/**
 * activeMatches = {
 *   roomId: {
 *     user1,
 *     user2,
 *     question,
 *     startTime
 *   }
 * }
 */
const activeMatches = {};
const userToRoom = {};
const abandonedUsers = new Set();

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // ==============================
    // FIND MATCH
    // ==============================
    socket.on("findMatch", async ({ userId, username, category = "DSA" }) => {
      console.log(`🔍 ${username} searching in ${category}`);

      abandonedUsers.delete(userId);
      if (!waitingUsers[category]) waitingUsers[category] = [];

      // Remove user from any other queues
      Object.keys(waitingUsers).forEach((cat) => {
        waitingUsers[cat] = waitingUsers[cat].filter(
          (u) => u.userId !== userId
        );
      });

      const opponent = waitingUsers[category].shift();

      // ✅ ALWAYS fetch question from service
      const question = await getQuestion(category);

      if (opponent) {
        const roomId = `room_${Date.now()}_${userId}_${opponent.userId}`;

        activeMatches[roomId] = {
          user1: opponent,
          user2: { userId, username, socketId: socket.id },
          question,
          startTime: Date.now(),
        };

        userToRoom[userId] = roomId;
        userToRoom[opponent.userId] = roomId;

        socket.join(roomId);
        io.sockets.sockets.get(opponent.socketId)?.join(roomId);

        io.to(roomId).emit("matchFound", {
          roomId,
          question,
          players: [username, opponent.username],
        });

        console.log(`⚔️ Match started: ${roomId}`);
      } else {
        waitingUsers[category].push({
          userId,
          username,
          socketId: socket.id,
        });

        socket.emit("waiting", {
          message: "Waiting for opponent...",
          question,
        });
      }
    });

    // ==============================
    // SUBMIT ANSWER
    // ==============================
    socket.on("submitAnswer", ({ userId, roomId, success }) => {
      const match = activeMatches[roomId];
      if (!match) return;

      const winner =
        success &&
        (match.user1.userId === userId
          ? match.user1
          : match.user2);

      if (winner) {
        const loser =
          winner.userId === match.user1.userId
            ? match.user2
            : match.user1;

        io.to(match.user1.socketId).emit("gameOver", {
          winner: winner.username,
          youWon: winner.userId === match.user1.userId,
        });

        io.to(match.user2.socketId).emit("gameOver", {
          winner: winner.username,
          youWon: winner.userId === match.user2.userId,
        });

        cleanupMatch(roomId);
        console.log(`🏆 Winner: ${winner.username}`);
      }
    });

    // ==============================
    // EXIT ARENA
    // ==============================
    socket.on("exitArena", ({ userId }) => {
      const roomId = userToRoom[userId];
      if (roomId) handleExit(io, userId, roomId);
    });

    // ==============================
    // DISCONNECT
    // ==============================
    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);

      const userId = Object.keys(userToRoom).find((uid) => {
        const roomId = userToRoom[uid];
        const match = activeMatches[roomId];
        return (
          match?.user1.socketId === socket.id ||
          match?.user2.socketId === socket.id
        );
      });

      if (userId) {
        handleExit(io, userId, userToRoom[userId], true);
      }

      Object.keys(waitingUsers).forEach((cat) => {
        waitingUsers[cat] = waitingUsers[cat].filter(
          (u) => u.socketId !== socket.id
        );
      });
    });
  });

  return io;
}

// ==============================
// HELPERS
// ==============================
function handleExit(io, userId, roomId, disconnected = false) {
  const match = activeMatches[roomId];
  if (!match) return;

  abandonedUsers.add(userId);

  const remaining =
    match.user1.userId === userId ? match.user2 : match.user1;

  io.to(remaining.socketId).emit("opponentLeft", {
    message: "Opponent left the match",
  });

  cleanupMatch(roomId);
}

function cleanupMatch(roomId) {
  const match = activeMatches[roomId];
  if (!match) return;

  delete userToRoom[match.user1.userId];
  delete userToRoom[match.user2.userId];
  delete activeMatches[roomId];
}
