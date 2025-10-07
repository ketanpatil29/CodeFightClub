import express from "express";
import { HfInference } from "@huggingface/inference";

const router = express.Router();

// ✅ Replace this with your real Hugging Face API key
const inference = new HfInference("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");

// ✅ Fallback question (used if API fails)
const fallbackQuestion = {
  title: "Two Sum",
  description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  input: "[nums, target]",
  output: "[index1, index2]",
  examples: "Example: nums = [2,7,11,15], target = 9 → [0,1]",
  testCases: [
    { input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] },
    { input: [[3, 2, 4], 6], expectedOutput: [1, 2] },
  ],
};

// ✅ Helper to clean up and parse model output safely
function parseJSONResponse(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

// ✅ Route to generate AI question
router.post("/generate-question", async (req, res) => {
  const { category = "DSA" } = req.body;
  console.log(`🧠 Generating AI question for category: ${category}...`);

  try {
    // --- Try Provider 1 ---
    let response;
    try {
      response = await inference.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        provider: "together", // reliable
        messages: [
          {
            role: "system",
            content: "You are an expert programming interviewer who writes clean JSON coding challenges.",
          },
          {
            role: "user",
            content: `
Generate a unique medium-difficulty coding problem in category: ${category}.
Respond STRICTLY in valid JSON format like:
{
  "title": "Problem Title",
  "description": "Problem description...",
  "input": "Input description...",
  "output": "Output description...",
  "examples": "Example: ...",
  "testCases": [
    { "input": [...], "expectedOutput": ... }
  ]
}`,
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });
    } catch (err) {
      console.warn("⚠️ Provider 'together' failed. Retrying with 'sambanova'...");
      response = await inference.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        provider: "sambanova",
        messages: [
          {
            role: "system",
            content: "You are an expert programming interviewer who writes clean JSON coding challenges.",
          },
          {
            role: "user",
            content: `
Generate a unique medium-difficulty coding problem in category: ${category}.
Respond STRICTLY in valid JSON format.`,
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });
    }

    const aiMessage = response?.message?.content || response?.choices?.[0]?.message?.content;
    const question = parseJSONResponse(aiMessage);

    if (!question) {
      console.warn("⚠️ Invalid or empty AI response, using fallback.");
      return res.json({ question: fallbackQuestion });
    }

    console.log("✅ Question generated successfully");
    res.json({ question });

  } catch (err) {
    console.error("❌ Hugging Face API Error:", err.message);
    console.warn("⚠️ Using fallback question instead of AI result");
    res.json({ question: fallbackQuestion });
  }
});

router.post("/submit-answer", async (req, res) => {
  const { code, question } = req.body;

  if (!code || !question?.testCases) {
    return res.status(400).json({ success: false, error: "Missing code or test cases" });
  }

  try {
    const sandbox = {};
    vm.createContext(sandbox);

    // Inject user's code into VM
    vm.runInContext(code, sandbox);

    const solve = sandbox.solve;
    if (typeof solve !== "function") {
      return res.status(400).json({ success: false, error: "Function 'solve' not found" });
    }

    let allPassed = true;
    let results = [];

    for (const { input, expectedOutput } of question.testCases) {
      const output = solve(...input);
      const passed = JSON.stringify(output) === JSON.stringify(expectedOutput);
      results.push({ input, output, expectedOutput, passed });
      if (!passed) allPassed = false;
    }

    return res.json({
      success: allPassed,
      results,
      message: allPassed ? "✅ All test cases passed!" : "❌ Some test cases failed",
    });

  } catch (err) {
    console.error("Error evaluating user code:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
