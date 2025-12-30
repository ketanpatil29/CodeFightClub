// socketHandler.js
import aiQuestions from "./aiQuestions.js";

const waitingUsers = {}; // { category: [{ userId, username, socketId, question }] }
const activeMatches = {}; // { roomId: { user1, user2, question, status } }
const userToRoom = {}; // { userId: roomId }

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;

    console.log("🟢 User connected:", userId, socket.id);

    // ===============================
    // FIND MATCH
    // ===============================
    socket.on("findMatch", ({ userId, username, category }) => {
      if (!userId || !category) return;

      if (!waitingUsers[category]) {
        waitingUsers[category] = [];
      }

      const question = aiQuestions.getRandomQuestion(category);

      // 🟡 If someone already waiting → MATCH
      if (waitingUsers[category].length > 0) {
        const opponent = waitingUsers[category].shift();

        const roomId = `room_${socket.id}_${opponent.socketId}`;

        socket.join(roomId);
        socket.to(opponent.socketId).socketsJoin(roomId);

        activeMatches[roomId] = {
          users: [userId, opponent.userId],
          question,
          completed: {},
        };

        userToRoom[userId] = roomId;
        userToRoom[opponent.userId] = roomId;

        // Notify both users
        io.to(roomId).emit("matchFound", {
          roomId,
          question,
          opponent: opponent.username,
          opponentId: opponent.userId,
        });

        console.log("🎮 Match created:", roomId);
      } 
      // 🟡 Otherwise → WAIT
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

    // ===============================
    // SUBMIT ANSWER
    // ===============================
    socket.on("submitAnswer", ({ userId, roomId, success }) => {
      const match = activeMatches[roomId];
      if (!match) return;

      match.completed[userId] = true;

      socket.to(roomId).emit("opponentStatusUpdate", {
        status: "completed",
      });

      const completedUsers = Object.keys(match.completed);

      // 🏆 WIN CONDITION
      if (completedUsers.length === 1) {
        io.to(roomId).emit("gameOver", {
          winner: userId,
          youWon: false,
        });

        cleanupRoom(roomId);
      }
    });

    // ===============================
    // EXIT ARENA
    // ===============================
    socket.on("exitArena", ({ userId, roomId }) => {
      socket.to(roomId).emit("opponentLeft");
      cleanupRoom(roomId);
    });

    // ===============================
    // DISCONNECT
    // ===============================
    socket.on("disconnect", () => {
      console.log("🔌 Disconnected:", userId, socket.id);
    });
  });
}

function cleanupRoom(roomId) {
  delete activeMatches[roomId];

  Object.keys(userToRoom).forEach((uid) => {
    if (userToRoom[uid] === roomId) {
      delete userToRoom[uid];
    }
  });
}
