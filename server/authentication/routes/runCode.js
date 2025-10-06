// runCode.js
import express from "express";
import { VM } from "vm2";

const router = express.Router();

// 🧪 POST /run-code
router.post("/", async (req, res) => {
  const { code, testCases } = req.body;

  if (!code || !testCases) {
    return res.status(400).json({ message: "Code and testCases are required" });
  }

  try {
    const results = [];

    // Detect user function name
    const functionNameMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
    if (!functionNameMatch) {
      return res.status(400).json({ message: "No function found in submitted code" });
    }

    const functionName = functionNameMatch[1];

    // Create VM
    const vm = new VM({
      timeout: 3000, // 3s per test case
      sandbox: {},
    });

    // Inject the user code into VM
    vm.run(code);

    // Run all test cases
    let passedAll = true;
    for (const testCase of testCases) {
      const { input, output } = testCase;

      // input could be array or single value
      let args = input;
      if (!Array.isArray(input)) args = [input];

      let userResult;
      try {
        userResult = vm.run(`${functionName}(...${JSON.stringify(args)})`);
      } catch (err) {
        userResult = `Error: ${err.message}`;
      }

      const passed = JSON.stringify(userResult) === JSON.stringify(output);
      if (!passed) passedAll = false;

      results.push({
        input,
        expected: output,
        userResult,
        passed,
      });
    }

    return res.json({ results, passedAll });

  } catch (err) {
    console.error("❌ Error running code:", err);
    return res.status(500).json({ message: "Code execution failed", error: err.message });
  }
});

export default router;
