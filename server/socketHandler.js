import { v4 as uuidv4 } from "uuid";
import getAIQuestion from "./aiQuestions.js";

const waitingQueue = {}; // { category: [ { socket, userId, username } ] }
const activeRooms = {};  // { roomId: { users, question } }

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // FIND MATCH
    socket.on("findMatch", async ({ userId, username, category }) => {
      if (!userId || !username || !category) {
        socket.emit("error", { message: "Invalid matchmaking data" });
        return;
      }

      socket.userData = { userId, username, category };

      if (!waitingQueue[category]) {
        waitingQueue[category] = [];
      }

      // IF SOMEONE IS ALREADY WAITING → MATCH
      if (waitingQueue[category].length > 0) {
        const opponent = waitingQueue[category].shift();

        const roomId = uuidv4();
        const question = await getAIQuestion(category);

        socket.join(roomId);
        opponent.socket.join(roomId);

        activeRooms[roomId] = {
          users: [
            { socketId: socket.id, userId, username },
            {
              socketId: opponent.socket.id,
              userId: opponent.userId,
              username: opponent.username,
            },
          ],
          question,
        };

        // SEND MATCH FOUND TO BOTH
        socket.emit("matchFound", {
          roomId,
          opponent: opponent.username,
          opponentId: opponent.userId,
          question,
        });

        opponent.socket.emit("matchFound", {
          roomId,
          opponent: username,
          opponentId: userId,
          question,
        });

        console.log(`⚔️ Match created: ${roomId}`);
      } 
      // ELSE → WAIT
      else {
        waitingQueue[category].push({
          socket,
          userId,
          username,
        });

        const question = await getAIQuestion(category);

        socket.emit("waiting", {
          message: "Waiting for opponent...",
          question,
        });

        console.log(`⏳ ${username} waiting in ${category}`);
      }
    });

    // CANCEL MATCH
    socket.on("cancelMatch", () => {
      const { category } = socket.userData || {};
      if (!category || !waitingQueue[category]) return;

      waitingQueue[category] = waitingQueue[category].filter(
        (u) => u.socket.id !== socket.id
      );

      console.log("❌ Match cancelled:", socket.id);
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      const { category } = socket.userData || {};
      if (!category || !waitingQueue[category]) return;

      waitingQueue[category] = waitingQueue[category].filter(
        (u) => u.socket.id !== socket.id
      );

      console.log("🔴 User disconnected:", socket.id);
    });
  });
}
