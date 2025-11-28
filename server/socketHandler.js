import { Server } from "socket.io";
import dotenv from "dotenv";
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

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Find match
    socket.on("findMatch", async ({ userId, username, category }) => {
      console.log(`🔍 ${username} looking for match in ${category}`);

      // Check if user abandoned a previous match
      if (abandonedUsers.has(userId)) {
        abandonedUsers.delete(userId); // Clear the flag for new search
      }

      // Remove user from any previous waiting queue
      Object.keys(waitingUsers).forEach((cat) => {
        waitingUsers[cat] = waitingUsers[cat]?.filter((u) => u.userId !== userId) || [];
      });

      // Initialize category queue if needed
      if (!waitingUsers[category]) {
        waitingUsers[category] = [];
      }

      // Check for waiting opponent (exclude abandoned users)
      const availableOpponent = waitingUsers[category].find(
        (u) => u.userId !== userId && !abandonedUsers.has(u.userId)
      );

      if (availableOpponent) {
        // Match found! Use the opponent's question
        const roomId = `room_${userId}_${availableOpponent.userId}_${Date.now()}`;
        const sharedQuestion = availableOpponent.question;

        // Remove opponent from waiting
        waitingUsers[category] = waitingUsers[category].filter(
          (u) => u.userId !== availableOpponent.userId
        );

        // Create match with shared question
        activeMatches[roomId] = {
          user1: { userId, username, socketId: socket.id, status: "solving" },
          user2: {
            userId: availableOpponent.userId,
            username: availableOpponent.username,
            socketId: availableOpponent.socketId,
            status: "solving",
          },
          question: sharedQuestion,
          category,
          startTime: Date.now(),
        };

        userToRoom[userId] = roomId;
        userToRoom[availableOpponent.userId] = roomId;

        // Join room
        socket.join(roomId);
        io.sockets.sockets.get(availableOpponent.socketId)?.join(roomId);

        console.log(`✅ Match made: ${username} vs ${availableOpponent.username}`);
        console.log(`📝 Question: ${sharedQuestion.title}`);

        // Notify both users with the SAME question
        io.to(socket.id).emit("matchFound", {
          roomId,
          opponent: availableOpponent.username,
          opponentId: availableOpponent.userId,
          yourUsername: username,
          question: sharedQuestion,
        });

        io.to(availableOpponent.socketId).emit("matchFound", {
          roomId,
          opponent: username,
          opponentId: userId,
          yourUsername: availableOpponent.username,
          question: sharedQuestion,
        });
      } else {
        // No opponent yet - generate question and wait
        try {
          console.log(`📝 Generating question for ${username}...`);
          const response = await axios.post(`${BACKEND_URL}/ai/generate-question`, {
            category: category || "DSA"
          });
          
          const question = response.data.question;
          console.log(`✅ Question ready: ${question.title}`);

          // Add to waiting queue WITH the question
          waitingUsers[category].push({ 
            userId, 
            username, 
            socketId: socket.id,
            question: question 
          });

          socket.emit("waiting", { 
            message: "Looking for opponent...",
            question: question 
          });

          console.log(`⏳ ${username} added to ${category} queue with question`);
        } catch (error) {
          console.error("Error generating question:", error);
          socket.emit("error", { message: "Failed to generate question" });
        }
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