import { Server } from "socket.io";

const waitingUsers = {}; // { category: [{ userId, username, socketId }] }
const activeMatches = {}; // { roomId: { user1, user2, question, status } }
const userToRoom = {}; // { userId: roomId }
const abandonedUsers = new Set();

// Question database
const QUESTIONS = {
  DSA: [
    {
      title: "Two Sum",
      description: "Given an array of integers and a target, return indices of two numbers that add up to the target.",
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      examples: [{ input: "[2,7,11,15], 9", output: "[0,1]" }],
      tests: [{ input: [[2,7,11,15], 9], output: [0,1] }],
    },
    {
      title: "Reverse Linked List",
      description: "Reverse a singly linked list.",
      input: "1->2->3->4->5",
      output: "5->4->3->2->1",
      examples: [{ input: "1->2->3", output: "3->2->1" }],
      tests: [{ input: [[1,2,3,4,5]], output: [5,4,3,2,1] }],
    }
  ],
  LOGIC: [
    {
      title: "Reverse String",
      description: "Reverse the given string.",
      input: '"hello"',
      output: '"olleh"',
      examples: [{ input: '"abc"', output: '"cba"' }],
      tests: [{ input: ["hello"], output: "olleh" }],
    },
    {
      title: "Check Palindrome",
      description: "Check if a string is a palindrome.",
      input: '"racecar"',
      output: "true",
      examples: [{ input: '"hello"', output: "false" }],
      tests: [{ input: ["racecar"], output: true }],
    }
  ],
  ALGO: [
    {
      title: "Max Element",
      description: "Find the maximum element in an array.",
      input: "[1, 5, 3]",
      output: "5",
      examples: [{ input: "[1,5,3]", output: "5" }],
      tests: [{ input: [[1,5,3]], output: 5 }],
    },
    {
      title: "Binary Search",
      description: "Implement binary search on a sorted array.",
      input: "[1,2,3,4,5], target=3",
      output: "2",
      examples: [{ input: "[1,3,5,7], 5", output: "2" }],
      tests: [{ input: [[1,2,3,4,5], 3], output: 2 }],
    }
  ],
  PROBLEM: [
    {
      title: "FizzBuzz",
      description: "Print numbers from 1 to n. For multiples of 3 print Fizz, for 5 print Buzz.",
      input: "n = 5",
      output: "[1,2,'Fizz',4,'Buzz']",
      examples: [{ input: "5", output: "[1,2,'Fizz',4,'Buzz']" }],
      tests: [{ input: [5], output: [1,2,"Fizz",4,"Buzz"] }],
    },
    {
      title: "Count Vowels",
      description: "Count the number of vowels in a string.",
      input: '"hello world"',
      output: "3",
      examples: [{ input: '"aeiou"', output: "5" }],
      tests: [{ input: ["hello world"], output: 3 }],
    }
  ],
};

function getRandomQuestion(category) {
  const questionList = QUESTIONS[category] || QUESTIONS.LOGIC;
  const question = questionList[Math.floor(Math.random() * questionList.length)];
  return {
    id: Date.now() + Math.random(),
    ...question,
  };
}

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
        socket.emit("error", { message: "Invalid data provided" });
        return;
      }

      console.log(`🔍 ${username} (${userId}) looking for match in ${category}`);

      abandonedUsers.delete(userId);

      // Remove user from any waiting queues
      Object.keys(waitingUsers).forEach(cat => {
        waitingUsers[cat] = waitingUsers[cat]?.filter(u => u.userId !== userId) || [];
      });

      // Initialize category queue if doesn't exist
      if (!waitingUsers[category]) waitingUsers[category] = [];

      // Try to find an opponent
      const opponent = waitingUsers[category].shift();

      if (opponent && opponent.userId !== userId) {
        // Match found! Pick a question
        const question = getRandomQuestion(category);
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

        // Join both users to room
        socket.join(roomId);
        const opponentSocket = io.sockets.sockets.get(opponent.socketId);
        if (opponentSocket) {
          opponentSocket.join(roomId);
        }

        // Emit match found to both users
        socket.emit("matchFound", {
          roomId,
          opponent: opponent.username,
          opponentId: opponent.userId,
          yourUsername: username,
          question,
        });

        if (opponentSocket) {
          opponentSocket.emit("matchFound", {
            roomId,
            opponent: username,
            opponentId: userId,
            yourUsername: opponent.username,
            question,
          });
        }

        console.log(`🎮 Match created: ${roomId} | ${username} vs ${opponent.username}`);
      } else {
        // No opponent found, add to waiting queue
        waitingUsers[category].push({ userId, username, socketId: socket.id });
        const waitingQuestion = getRandomQuestion(category);
        
        socket.emit("waiting", { 
          message: "Looking for opponent...", 
          question: waitingQuestion 
        });
        
        console.log(`⏳ ${username} added to ${category} queue (${waitingUsers[category].length} waiting)`);
      }
    });

    // Submit answer
    socket.on("submitAnswer", ({ userId, roomId, success }) => {
      const match = activeMatches[roomId];
      if (!match) {
        console.warn(`⚠️ submitAnswer: Room ${roomId} not found`);
        return;
      }

      console.log(`📝 ${userId} submitted in ${roomId} - success: ${success}`);

      if (match.user1.userId === userId) {
        match.user1.status = success ? "completed" : "solving";
      } else if (match.user2.userId === userId) {
        match.user2.status = success ? "completed" : "solving";
      }

      const winner = match.user1.status === "completed" ? match.user1 :
                     match.user2.status === "completed" ? match.user2 : null;

      if (winner) {
        const loser = winner === match.user1 ? match.user2 : match.user1;

        // Emit game over to both users
        [match.user1.socketId, match.user2.socketId].forEach(sid => {
          io.to(sid).emit("gameOver", {
            winner: winner.username,
            winnerId: winner.userId,
            loser: loser.username,
            loserId: loser.userId,
            youWon: sid === winner.socketId,
          });
        });

        console.log(`🏆 ${winner.username} won against ${loser.username} in ${roomId}`);

        // Cleanup
        delete activeMatches[roomId];
        delete userToRoom[match.user1.userId];
        delete userToRoom[match.user2.userId];
      } else {
        // Update opponent about status
        const opponentSocketId = match.user1.userId === userId ? match.user2.socketId : match.user1.socketId;
        io.to(opponentSocketId).emit("opponentStatusUpdate", {
          status: success ? "completed" : "solving",
        });
      }
    });

    // Exit arena / disconnect handler
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

    socket.on("exitArena", ({ userId, roomId }) => {
      console.log(`🚪 Exit request from ${userId} in ${roomId}`);
      handleUserExit(userId, roomId, false);
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      // Find userId from active matches
      const userId = Object.keys(userToRoom).find(uid => {
        const roomId = userToRoom[uid];
        const match = activeMatches[roomId];
        return match?.user1.socketId === socket.id || match?.user2.socketId === socket.id;
      });

      if (userId && userToRoom[userId]) {
        handleUserExit(userId, userToRoom[userId], true);
      }

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
      socket.emit("searchCancelled", { message: "Search cancelled" });
    });
  });

  return io;
}