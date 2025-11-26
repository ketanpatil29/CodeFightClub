import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import vm from "vm";

const router = express.Router();

// Initialize Gemini with your API key (get free key from: https://aistudio.google.com/apikey)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCCyjj9nFo9A9rFFijBxHlS1rmxYBY_UQ0");
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
  {
    title: "Reverse String",
    description: "Given a string, return the string reversed.",
    input: "String",
    output: "Reversed string",
    examples: "Example: 'hello' → 'olleh'",
    testCases: [
      { input: ["hello"], expectedOutput: "olleh" },
      { input: ["world"], expectedOutput: "dlrow" },
      { input: ["a"], expectedOutput: "a" },
    ],
  },
  {
    title: "Find Maximum",
    description: "Given an array of numbers, return the maximum number.",
    input: "Array of numbers",
    output: "Single number (the maximum)",
    examples: "Example: [1, 5, 3, 9, 2] → 9",
    testCases: [
      { input: [[1, 5, 3, 9, 2]], expectedOutput: 9 },
      { input: [[10, 20, 30]], expectedOutput: 30 },
      { input: [[-5, -1, -10]], expectedOutput: -1 },
    ],
  },
  {
    title: "Find Minimum",
    description: "Given an array of numbers, return the minimum number.",
    input: "Array of numbers",
    output: "Single number (the minimum)",
    examples: "Example: [5, 2, 9, 1, 6] → 1",
    testCases: [
      { input: [[5, 2, 9, 1, 6]], expectedOutput: 1 },
      { input: [[-3, 0, 10, -8, 7]], expectedOutput: -8 },
      { input: [[100, 50, 25]], expectedOutput: 25 },
    ],
  },
  {
    title: "Sum of Array",
    description: "Given an array of numbers, return the sum of all elements.",
    input: "Array of numbers",
    output: "Single number (sum)",
    examples: "Example: [1, 2, 3, 4] → 10",
    testCases: [
      { input: [[1, 2, 3, 4]], expectedOutput: 10 },
      { input: [[10, -5, 15]], expectedOutput: 20 },
      { input: [[0, 0, 0]], expectedOutput: 0 },
    ],
  },
  {
    title: "Check Palindrome",
    description: "Given a string, return true if it's a palindrome (reads the same forwards and backwards), false otherwise. Ignore spaces and case.",
    input: "String",
    output: "Boolean (true/false)",
    examples: "Example: 'racecar' → true, 'hello' → false",
    testCases: [
      { input: ["racecar"], expectedOutput: true },
      { input: ["hello"], expectedOutput: false },
      { input: ["A man a plan a canal Panama"], expectedOutput: true },
    ],
  },
  {
    title: "Remove Duplicates",
    description: "Given an array of numbers, return a new array with duplicates removed (keeping only unique values in order of first appearance).",
    input: "Array of numbers",
    output: "Array of unique numbers",
    examples: "Example: [1, 2, 2, 3, 1, 4] → [1, 2, 3, 4]",
    testCases: [
      { input: [[1, 2, 2, 3, 1, 4]], expectedOutput: [1, 2, 3, 4] },
      { input: [[5, 5, 5]], expectedOutput: [5] },
      { input: [[1, 2, 3]], expectedOutput: [1, 2, 3] },
    ],
  },
];

function parseJSONResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      // Validate required fields
      if (parsed.title && parsed.description && parsed.testCases && Array.isArray(parsed.testCases)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Generate question: 70% verified, 30% AI-generated
router.post("/generate-question", async (req, res) => {
  const { category = "DSA" } = req.body;
  
  // 70% chance to use verified question, 30% chance to try AI
  const useVerified = Math.random() < 0.7;
  
  if (useVerified) {
    const randomQuestion = verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];
    console.log(`✅ Using verified question: ${randomQuestion.title}`);
    return res.json({ question: randomQuestion });
  }
  
  // Try AI generation
  console.log(`🧠 Generating AI question for category: ${category}...`);

  try {
    const prompt = `Generate a medium-difficulty coding problem about ${category}.

CRITICAL RULES:
1. Test cases MUST be 100% mathematically/logically correct
2. Manually verify EACH test case before including it
3. Avoid complex math problems - use simple array/string operations
4. Create 3-4 test cases that are DEFINITELY correct

Good problem types:
- Array operations (sum, max, min, count, filter)
- String manipulation (reverse, count chars, check palindrome)
- Simple searches (find element, find duplicates)
- Basic transformations (square numbers, uppercase, etc)

Return ONLY valid JSON with NO markdown formatting:
{
  "title": "Problem Name",
  "description": "Clear problem description",
  "input": "Input parameter description",
  "output": "Output description",
  "examples": "Example: input → output",
  "testCases": [
    { "input": [arg1, arg2], "expectedOutput": correctResult }
  ]
}`;

    const result = await model.generateContent(prompt);
    const aiMessage = result.response.text();
    
    console.log("🤖 Gemini Response:", aiMessage);
    
    const question = parseJSONResponse(aiMessage);

    if (!question || !question.testCases || question.testCases.length < 2) {
      console.warn("⚠️ Invalid AI response, using verified fallback");
      const randomFallback = verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];
      return res.json({ question: randomFallback });
    }

    console.log("✅ Question generated:", question.title);
    res.json({ question });

  } catch (err) {
    console.error("❌ AI Error:", err.message);
    const randomFallback = verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];
    res.json({ question: randomFallback });
  }
});

// Submit answer with proper code execution
router.post("/submit-answer", async (req, res) => {
  const { code, question } = req.body;

  if (!code || !question?.testCases) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing code or test cases" 
    });
  }

  try {
    // Create a safe sandbox environment
    const sandbox = {
      console: console,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Math: Math,
      JSON: JSON,
      Set: Set,
      Map: Map,
    };

    vm.createContext(sandbox);

    // Execute user's code
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

    // Check if solve function exists
    if (typeof sandbox.solve !== "function") {
      return res.json({ 
        success: false, 
        error: "Function 'solve' not found. Make sure to define: function solve(...args) { }",
        results: [],
        passedCount: 0,
        totalTests: question.testCases.length
      });
    }

    let passedCount = 0;
    let results = [];

    // Run all test cases
    for (let i = 0; i < question.testCases.length; i++) {
      const testCase = question.testCases[i];
      
      try {
        const { input, expectedOutput } = testCase;
        
        // Call the user's solve function with the input
        const userOutput = sandbox.solve(...input);
        
        // Deep comparison for arrays/objects
        const passed = deepEqual(userOutput, expectedOutput);
        
        results.push({ 
          testNumber: i + 1,
          input: input,
          output: userOutput, 
          expectedOutput: expectedOutput, 
          passed: passed
        });
        
        if (passed) passedCount++;
        
      } catch (runtimeErr) {
        results.push({
          testNumber: i + 1,
          input: testCase.input,
          output: null,
          expectedOutput: testCase.expectedOutput,
          passed: false,
          error: runtimeErr.message
        });
      }
    }

    const allPassed = passedCount === question.testCases.length;

    return res.json({
      success: allPassed,
      passedCount: passedCount,
      totalTests: question.testCases.length,
      results: results,
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

// Helper function for deep equality comparison
function deepEqual(a, b) {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
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

export default router;