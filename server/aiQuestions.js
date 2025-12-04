import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import vm from "vm";

const router = express.Router();

// Initialize Gemini with your API key (get free key from: https://aistudio.google.com/apikey)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Verified questions pool (always correct)
const verifiedQuestions = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    input: "Array of numbers and target sum",
    output: "Array of two indices [index1, index2]",
    examples: "Example: nums = [2,7,11,15], target = 9 → Output: [0,1]",
    testCases: [
      { input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] },
      { input: [[3, 2, 4], 6], expectedOutput: [1, 2] },
      { input: [[3, 3], 6], expectedOutput: [0, 1] },
    ],
  },
  {
    title: "Count Occurrences",
    description: "Given an array of numbers and a target number, return the count of occurrences of the target in the array.",
    input: "Array of numbers and target number",
    output: "Integer (count)",
    examples: "Example: [1, 2, 3, 2, 2, 4], 2 → 3",
    testCases: [
      { input: [[1, 2, 3, 2, 2, 4], 2], expectedOutput: 3 },
      { input: [[5, 5, 5, 5], 5], expectedOutput: 4 },
      { input: [[1, 2, 3], 9], expectedOutput: 0 },
    ],
  },
  // Add other verified questions here ...
];

// --- Helper functions ---
function parseJSONResponse(text) {
  try {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.title && parsed.description && parsed.testCases && Array.isArray(parsed.testCases)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// --- Generate Question ---
router.post("/generate-question", async (req, res) => {
  const { category = "DSA" } = req.body;

  // 95% of the time → use verified question immediately
  const randomQuestion = verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];

  // Send instant response to frontend → prevents socket timeout
  res.json({ question: randomQuestion });

  // --- Optional: AI generation in background ---
  const useAI = Math.random() < 0.05; // 5% chance for AI
  if (!useAI || !process.env.GEMINI_API_KEY) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const prompt = `
Generate a simple coding problem with guaranteed correct test cases.
Return ONLY JSON:
{
  "title": "...",
  "description": "...",
  "input": "...",
  "output": "...",
  "examples": "...",
  "testCases": [ { "input": [...], "expectedOutput": ... } ]
}`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), 5000))
    ]);

    clearTimeout(timeout);

    const aiMessage = result.response.text();
    const question = parseJSONResponse(aiMessage);

    if (question && question.testCases) {
      console.log("🧠 AI question generated in background:", question.title);
      // Optional: store AI question for later use
    }

  } catch (err) {
    console.log("⚠️ AI generation failed:", err.message);
  }
});

// --- Submit Answer ---
router.post("/submit-answer", async (req, res) => {
  const { code, question } = req.body;
  if (!code || !question?.testCases) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing code or test cases" 
    });
  }

  try {
    const sandbox = {
      console, Array, Object, String, Number, Math, JSON, Set, Map
    };
    vm.createContext(sandbox);

    try {
      vm.runInContext(code, sandbox, { timeout: 5000 });
    } catch (syntaxErr) {
      return res.json({
        success: false,
        error: `Syntax Error: ${syntaxErr.message}`,
        results: [],
        passedCount: 0,
        totalTests: question.testCases.length
      });
    }

    if (typeof sandbox.solve !== "function") {
      return res.json({ 
        success: false, 
        error: "Function 'solve' not found. Define: function solve(...) { }",
        results: [],
        passedCount: 0,
        totalTests: question.testCases.length
      });
    }

    let passedCount = 0;
    let results = [];

    for (let i = 0; i < question.testCases.length; i++) {
      const { input, expectedOutput } = question.testCases[i];
      try {
        const userOutput = sandbox.solve(...input);
        const passed = deepEqual(userOutput, expectedOutput);
        results.push({ testNumber: i + 1, input, output: userOutput, expectedOutput, passed });
        if (passed) passedCount++;
      } catch (runtimeErr) {
        results.push({
          testNumber: i + 1,
          input,
          output: null,
          expectedOutput,
          passed: false,
          error: runtimeErr.message
        });
      }
    }

    const allPassed = passedCount === question.testCases.length;

    return res.json({
      success: allPassed,
      passedCount,
      totalTests: question.testCases.length,
      results,
      message: allPassed 
        ? `🎉 Perfect! All ${passedCount} test cases passed!` 
        : `${passedCount}/${question.testCases.length} test cases passed. Keep trying!`
    });

  } catch (err) {
    console.error("Evaluation error:", err);
    return res.json({
      success: false,
      error: `Error: ${err.message}`,
      results: [],
      passedCount: 0,
      totalTests: question.testCases.length
    });
  }
});

export default router;
