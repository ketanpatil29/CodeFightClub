// server/aiQuestions.js
import express from "express";
import axios from "axios";
import 'dotenv/config';

const router = express.Router();

// ✅ Hugging Face API key from .env
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Helper function to parse JSON safely
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Failed to parse AI JSON:", text, err);
    return null;
  }
}

// POST /ai/generate-question
router.post("/generate-question", async (req, res) => {
  const { category, difficulty } = req.body;

  if (!category) {
    return res.status(400).json({ message: "Category is required" });
  }

  try {
    const prompt = `
      Generate a unique coding problem in ${category} with ${
      difficulty || "medium"
    } difficulty.
      Respond strictly as valid JSON only, with no Markdown, no code blocks.
      Example JSON format:
      {
        "title": "Problem Title",
        "description": "Problem description",
        "input": "Input format",
        "output": "Output format",
        "examples": "Example input/output as a single string"
      }
    `;

    // ✅ Hugging Face Inference API request
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-small", // free model
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data[0]?.generated_text || response.data?.generated_text || "";

    const question = safeParseJSON(text);

    if (!question) {
      return res.status(500).json({ message: "Failed to parse AI JSON" });
    }

    res.json({ question });
  } catch (err) {
    console.error("❌ Hugging Face API error:", err.response?.data || err.message);
    res.status(500).json({ message: "AI generation failed" });
  }
});

export default router;
