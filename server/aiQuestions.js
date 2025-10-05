// server/aiQuestions.js
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI("AIzaSyBvu-5VLjr7mdpJMkxNdQkZ-Nr3oF2z9CQ");

// Helper to safely parse AI JSON responses
function safeParseJSON(text) {
  try {
    // Remove newlines and extra spaces that break JSON
    const cleaned = text
      .replace(/\r?\n/g, "\\n") // replace line breaks inside strings
      .replace(/\\n\\n/g, "\\n"); // collapse double line breaks
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Failed to parse AI JSON:", text, err);
    return null;
  }
}

// POST /ai/generate-question
router.post("/generate-question", async (req, res) => {
  const { category, difficulty } = req.body;

  if (!category) return res.status(400).json({ message: "Category is required" });

  try {
    const prompt = `
      Generate a unique coding problem in ${category} with ${difficulty || "medium"} difficulty.
      Respond strictly as **valid JSON only**, with no Markdown, no code blocks, and no unescaped newlines.
      Example JSON format:
      {
        "title": "Problem Title",
        "description": "Problem description",
        "input": "Input format",
        "output": "Output format",
        "examples": "Example input/output as a single string"
      }
    `;

    // Use the Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate the question
    const result = await model.generateContent(prompt);

    // Get text from AI response
    const text = result.response.text();

    // Safely parse JSON
    const question = safeParseJSON(text);
    if (!question) {
      return res.status(500).json({ message: "Failed to generate valid question" });
    }

    res.json({ question });
  } catch (err) {
    console.error("❌ Gemini API error:", err);
    res.status(500).json({ message: "AI generation failed" });
  }
});

module.exports = router;
