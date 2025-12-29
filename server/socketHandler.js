import { getQuestion } from ".questionService.js";

socket.on("findMatch", async ({ userId, username, category }) => {
  const question = await getQuestion(category);

  if (opponent) {
    io.to(roomId).emit("matchFound", { question });
  } else {
    socket.emit("waiting", { question });
  }
});
