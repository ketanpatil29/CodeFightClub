import express from "express";
import { getQuestion } from "../services/questionService.js";

const router = express.Router();

router.post("/generate-question", async (req, res) => {
  const question = await getQuestion(req.body.category);
  res.json({ question });
});

export default router;
