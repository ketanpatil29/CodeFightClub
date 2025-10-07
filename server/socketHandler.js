import { Server } from "socket.io";
import axios from "axios";

const waitingUsers = {};          // Users waiting per category
const matchQuestions = {};
const waitingQuestions ={};        // Store question per roomId

export default function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"], credentials: true }
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("joinCategory", async ({ category, user }) => {
  if (!user || !user._id) return socket.emit("error", "Invalid user");

  if (!waitingUsers[category]) waitingUsers[category] = [];
  const opponent = waitingUsers[category].find(u => u.user._id !== user._id);

  if (opponent) {
    waitingUsers[category] = waitingUsers[category].filter(u => u.user._id !== opponent.user._id);

    // deterministic roomId
    const roomId = socket.id < opponent.socket.id
      ? `${socket.id}#${opponent.socket.id}`
      : `${opponent.socket.id}#${socket.id}`;

    // Use the question generated for this category
    let question = waitingQuestions[category];
    if (!question) {
      try {
        const { data } = await axios.post("http://localhost:3000/ai/generate-question", { category });
        question = data.question;
      } catch (err) {
        question = fallbackQuestion; // fallback
      }
    }

    // Save question globally for this room
    matchQuestions[roomId] = question;

    // Clear waitingQuestions
    delete waitingQuestions[category];

    opponent.socket.emit("matchFound", { roomId, question, opponent: user.userName });
    socket.emit("matchFound", { roomId, question, opponent: opponent.user.userName });
    console.log(`✅ Match made: ${user.userName} vs ${opponent.user.userName}`);
  } else {
    // Store question for the waiting user
    if (!waitingQuestions[category]) {
      try {
        const { data } = await axios.post("http://localhost:3000/ai/generate-question", { category });
        waitingQuestions[category] = data.question;
      } catch (err) {
        waitingQuestions[category] = fallbackQuestion;
      }
    }

    waitingUsers[category].push({ socket, user });
    console.log(`🕓 Waiting for opponent in ${category}`);
  }
});


    // Submit answer event
    socket.on("submitAnswer", async ({ userId, code, roomId }) => {
      const question = matchQuestions[roomId];
      if (!question) return socket.emit("submissionResult", { userId, data: { passedAll: false, error: "No question found for this match" } });

      try {
        const { data } = await axios.post("http://localhost:3000/run-code", { code, testCases: question.testCases });
        socket.emit("submissionResult", { userId, data });
        socket.broadcast.emit("opponentStatusUpdate", { userId, passedAll: data.passedAll });
      } catch (err) {
        console.error("❌ Error running code:", err.message);
        socket.emit("submissionResult", { userId, data: { passedAll: false, error: err.message } });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Remove user from waiting lists
      for (const cat in waitingUsers) {
        waitingUsers[cat] = waitingUsers[cat].filter(u => u.socket.id !== socket.id);
      }

      // Remove room questions if this socket was part of any room
      for (const roomId in matchQuestions) {
        if (roomId.startsWith(socket.id) || roomId.endsWith(socket.id)) {
          delete matchQuestions[roomId];
        }
      }

      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
}
