// server/socketHandler.js
import aiQuestions from "./aiQuestions.js";

const waitingUsers = {};
const activeMatches = {};
const userToRoom = {};

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    const auth = socket.handshake.auth || {};

    const userId = auth.userId || null;
    const username = auth.username || "anonymous";

    console.log("🟢 User connected:", username, userId);

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", username, userId);
    });

    // ================= FIND MATCH =================
    socket.on("findMatch", ({ userId, username, category }) => {
      if (!userId || !category) {
        console.log("❌ Invalid findMatch payload");
        return;
      }

      if (!waitingUsers[category]) waitingUsers[category] = [];

      const question = aiQuestions.getRandomQuestion(category);

      // MATCH FOUND
      if (waitingUsers[category].length > 0) {
        const opponent = waitingUsers[category].shift();
        const roomId = `room_${socket.id}_${opponent.socketId}`;

        socket.join(roomId);
        io.sockets.sockets.get(opponent.socketId)?.join(roomId);

        activeMatches[roomId] = {
          users: [userId, opponent.userId],
          completed: {},
          question,
        };

        userToRoom[userId] = roomId;
        userToRoom[opponent.userId] = roomId;

        io.to(roomId).emit("matchFound", {
          roomId,
          question,
          opponent: opponent.username,
          opponentId: opponent.userId,
        });

        console.log("🎮 Match created:", roomId);
      }
      // WAITING
      else {
        waitingUsers[category].push({
          userId,
          username,
          socketId: socket.id,
        });

        socket.emit("waiting", {
          message: "Looking for opponent...",
          question,
        });

        console.log("⏳ Waiting:", userId, category);
      }
    });

    // ================= SUBMIT ANSWER =================
    socket.on("submitAnswer", ({ userId, roomId }) => {
      const match = activeMatches[roomId];
      if (!match) return;

      match.completed[userId] = true;

      socket.to(roomId).emit("opponentStatusUpdate", {
        status: "completed",
      });

      if (Object.keys(match.completed).length === 1) {
        io.to(roomId).emit("gameOver", {
          winner: userId,
        });

        cleanupRoom(roomId);
      }
    });

    // ================= EXIT ARENA =================
    socket.on("exitArena", ({ roomId }) => {
      socket.to(roomId).emit("opponentLeft");
      cleanupRoom(roomId);
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", socket.userId, reason);

      Object.keys(waitingUsers).forEach((cat) => {
        waitingUsers[cat] = waitingUsers[cat].filter(
          (u) => u.socketId !== socket.id
        );
      });
    });
  });
}

function cleanupRoom(roomId) {
  delete activeMatches[roomId];
  Object.keys(userToRoom).forEach((u) => {
    if (userToRoom[u] === roomId) delete userToRoom[u];
  });
}
