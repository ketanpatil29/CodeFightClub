import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const waitingUsers = {}; // { category: [{ userId, username, socketId }] }
const activeMatches = {}; // { roomId: { user1, user2, question, status } }
const userToRoom = {}; // { userId: roomId }
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
    console.log(`✅ User connected: ${socket.id}`);

    // Find match
    socket.on("findMatch", ({ userId, username, category }) => {
      if (!userId || !username || !category) {
        console.warn(`⚠️ findMatch received invalid data:`, { userId, username, category });
        return;
      }

      console.log(`🔍 ${username} looking for match in ${category}`);

      abandonedUsers.delete(userId);

      // Remove user from any waiting queues
      Object.keys(waitingUsers).forEach(cat => {
        waitingUsers[cat] = waitingUsers[cat]?.filter(u => u.userId !== userId) || [];
      });

      if (!waitingUsers[category]) waitingUsers[category] = [];

      const opponent = waitingUsers[category].shift();

      // Pick a question
      const question = verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];

      if (opponent) {
        // Safety check for opponent
        if (!opponent.userId || !opponent.username) {
          console.warn("⚠️ Opponent has invalid data, skipping match", opponent);
          return;
        }

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

        socket.emit("matchFound", {
          roomId,
          opponent: opponent.username,
          opponentId: opponent.userId,
          yourUsername: username,
          question,
        });

        io.to(opponent.socketId).emit("matchFound", {
          roomId,
          opponent: username,
          opponentId: userId,
          yourUsername: opponent.username,
          question,
        });

        console.log("🎮 Match created:", roomId);
      } else {
        waitingUsers[category].push({ userId, username, socketId: socket.id });
        socket.emit("waiting", { message: "Looking for opponent...", question });
      }
    });

    // Submit answer
    socket.on("submitAnswer", ({ userId, roomId, success }) => {
      const match = activeMatches[roomId];
      if (!match) return;

      if (match.user1.userId === userId) match.user1.status = success ? "completed" : "solving";
      else if (match.user2.userId === userId) match.user2.status = success ? "completed" : "solving";

      const winner = match.user1.status === "completed" ? match.user1 :
                     match.user2.status === "completed" ? match.user2 : null;

      if (winner) {
        const loser = winner === match.user1 ? match.user2 : match.user1;

        [match.user1.socketId, match.user2.socketId].forEach(sid => {
          io.to(sid).emit("gameOver", {
            winner: winner.username,
            winnerId: winner.userId,
            loser: loser.username,
            youWon: sid === winner.socketId,
          });
        });

        console.log(`🏆 ${winner.username} won against ${loser.username}`);

        // Cleanup
        delete activeMatches[roomId];
        delete userToRoom[match.user1.userId];
        delete userToRoom[match.user2.userId];
      } else {
        const opponentSocketId = match.user1.userId === userId ? match.user2.socketId : match.user1.socketId;
        io.to(opponentSocketId).emit("opponentStatusUpdate", {
          status: success ? "completed" : "solving",
        });
      }
    });

    // Exit arena / disconnect
    const handleUserExit = (userId, roomId, isDisconnect = false) => {
      const match = activeMatches[roomId];
      if (!match) return;

      const exitingUser = match.user1.userId === userId ? match.user1 : match.user2;
      const remainingUser = match.user1.userId === userId ? match.user2 : match.user1;

      abandonedUsers.add(userId);

      console.log(`🚪 ${exitingUser.username} ${isDisconnect ? "disconnected" : "exited"} from ${roomId}`);

      io.to(remainingUser.socketId).emit("opponentLeft", {
        opponentName: exitingUser.username,
        message: `${exitingUser.username} has left the match. You can continue practicing or exit.`,
      });

      delete activeMatches[roomId];
      delete userToRoom[match.user1.userId];
      delete userToRoom[match.user2.userId];
    };

    socket.on("exitArena", ({ userId, roomId }) => handleUserExit(userId, roomId, false));

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      const userId = Object.keys(userToRoom).find(uid => {
        const roomId = userToRoom[uid];
        const match = activeMatches[roomId];
        return match?.user1.socketId === socket.id || match?.user2.socketId === socket.id;
      });

      if (userId) handleUserExit(userId, userToRoom[userId], true);

      // Remove from waiting queues
      Object.keys(waitingUsers).forEach(cat => {
        waitingUsers[cat] = waitingUsers[cat]?.filter(u => u.socketId !== socket.id) || [];
      });
    });

    socket.on("cancelSearch", ({ userId }) => {
      Object.keys(waitingUsers).forEach(cat => {
        waitingUsers[cat] = waitingUsers[cat]?.filter(u => u.userId !== userId) || [];
      });
      console.log(`🚫 ${userId} cancelled search`);
    });
  });

  return io;
}
