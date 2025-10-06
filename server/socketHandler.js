import { Server } from "socket.io";

// In-memory queue: { category: [ { socket, userId, userName, email } ] }
const waitingUsers = {};

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // When a user joins matchmaking
    socket.on("joinCategory", async ({ category, user }) => {
      try {
        if (!user || !user._id) {
          console.log("❌ joinCategory: invalid user object");
          socket.emit("error", "Invalid user");
          return;
        }

        console.log(`👤 ${user.userName || user.email} joined category: ${category}`);

        if (!waitingUsers[category]) waitingUsers[category] = [];

        // Try to find an opponent (not same user)
        const opponent = waitingUsers[category].find(u => u.user._id !== user._id);

        if (opponent) {
          // Remove opponent from queue
          waitingUsers[category] = waitingUsers[category].filter(u => u.user._id !== opponent.user._id);

          const roomId = `${socket.id}#${opponent.socket.id}`;
          const question = `Solve a ${category} question: Reverse a string`;

          // Notify both players
          opponent.socket.emit("matchFound", {
            roomId,
            question,
            opponent: user.userName || user.email
          });

          socket.emit("matchFound", {
            roomId,
            question,
            opponent: opponent.user.userName || opponent.user.email
          });

          console.log(`✅ Match made between ${user.userName || user.email} and ${opponent.user.userName || opponent.user.email}`);
        } else {
          // Add to waiting queue
          waitingUsers[category].push({ socket, user });
          console.log(`🕓 Waiting for opponent in ${category}`);
        }

      } catch (err) {
        console.error("❌ Error in joinCategory:", err);
      }
    });

    // When a user cancels matchmaking
    socket.on("leaveQueue", ({ category, userId }) => {
      if (waitingUsers[category]) {
        waitingUsers[category] = waitingUsers[category].filter(u => u.user._id !== userId);
        console.log(`🚪 ${userId} left queue for ${category}`);
      }
    });

    // When a user disconnects
    socket.on("disconnect", () => {
      for (const category in waitingUsers) {
        waitingUsers[category] = waitingUsers[category].filter(u => u.socket.id !== socket.id);
      }
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
}

export default initSocket;

