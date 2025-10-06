import { Server } from "socket.io";
import axios from "axios";

const waitingUsers = {};

export default function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"], credentials: true }
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("joinCategory", ({ category, user }) => {
      if (!user || !user._id) return socket.emit("error", "Invalid user");

      if (!waitingUsers[category]) waitingUsers[category] = [];
      const opponent = waitingUsers[category].find(u => u.user._id !== user._id);

      if (opponent) {
        waitingUsers[category] = waitingUsers[category].filter(u => u.user._id !== opponent.user._id);

        const roomId = `${socket.id}#${opponent.socket.id}`;
        const question = {
          title: "Two Sum",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          testCases: [
            { input: JSON.stringify([2,7,11,15]) + ",9", expectedOutput: "[0,1]" }
          ]
        };

        opponent.socket.emit("matchFound", { roomId, question, opponent: user.userName });
        socket.emit("matchFound", { roomId, question, opponent: opponent.user.userName });
        console.log(`✅ Match made: ${user.userName} vs ${opponent.user.userName}`);
      } else {
        waitingUsers[category].push({ socket, user });
        console.log(`🕓 Waiting for opponent in ${category}`);
      }
    });

    socket.on("submitAnswer", async ({ userId, code, question }) => {
      try {
        const { data } = await axios.post("http://localhost:3000/run-code", { code, testCases: question.testCases });
        socket.emit("submissionResult", { userId, data });
        socket.broadcast.emit("opponentStatusUpdate", { userId, passedAll: data.passedAll });
      } catch (err) {
        console.error("❌ Error running code:", err.message);
        socket.emit("submissionResult", { userId, data: { passedAll: false, error: err.message } });
      }
    });

    socket.on("disconnect", () => {
      for (const cat in waitingUsers) {
        waitingUsers[cat] = waitingUsers[cat].filter(u => u.socket.id !== socket.id);
      }
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
}
