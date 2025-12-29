import { Server } from "socket.io";
import { getQuestion } from "./questionService.js";

const waitingUsers = {}; // category -> [{ socketId, userId, username }]

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("findMatch", async ({ userId, username, category }) => {
      console.log(`🔍 ${username} searching in ${category}`);

      if (!waitingUsers[category]) {
        waitingUsers[category] = [];
      }

      // get opponent if exists
      const opponent = waitingUsers[category].shift();

      // ALWAYS get question (can be verified or AI)
      const question = await getQuestion(category);

      if (opponent) {
        // match found
        const roomId = `room_${socket.id}_${opponent.socketId}`;
        socket.join(roomId);
        io.to(opponent.socketId).socketsJoin(roomId);

        io.to(roomId).emit("matchFound", {
          roomId,
          question,
          players: [
            { userId, username },
            { userId: opponent.userId, username: opponent.username },
          ],
        });

        console.log("🎮 Match created:", roomId);
      } else {
        // no opponent → wait
        waitingUsers[category].push({
          socketId: socket.id,
          userId,
          username,
        });

        socket.emit("waiting", {
          message: "Waiting for opponent...",
          question,
        });

        console.log("⏳ Waiting:", username);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);

      // cleanup from waitingUsers
      for (const cat in waitingUsers) {
        waitingUsers[cat] = waitingUsers[cat].filter(
          (u) => u.socketId !== socket.id
        );
      }
    });
  });

  return io;
}
