import express from "express";

const router = express.Router();

// Test runner function
function runTests(code, question) {
  try {
    // Extract the function from user's code
    const functionMatch = code.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*}/);
    
    if (!functionMatch) {
      return {
        success: false,
        error: "No valid function found in code",
        passedCount: 0,
        totalTests: question.tests?.length || 0,
        results: [],
      };
    }

    const userFunction = functionMatch[0];
    
    // Create a safe evaluation context
    const testResults = [];
    let passedCount = 0;

    question.tests.forEach((test, index) => {
      try {
        // Create isolated function
        const wrappedCode = `
          ${userFunction}
          const args = ${JSON.stringify(test.input)};
          return solve(...args);
        `;

        // Execute the function
        const fn = new Function(wrappedCode);
        const output = fn();

        // Compare output with expected
        const passed = JSON.stringify(output) === JSON.stringify(test.output);
        
        if (passed) passedCount++;

        testResults.push({
          testNumber: index + 1,
          passed,
          input: test.input,
          expectedOutput: test.output,
          output,
        });
      } catch (error) {
        testResults.push({
          testNumber: index + 1,
          passed: false,
          input: test.input,
          expectedOutput: test.output,
          output: null,
          error: error.message,
        });
      }
    });

    return {
      success: passedCount === question.tests.length,
      passedCount,
      totalTests: question.tests.length,
      results: testResults,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      passedCount: 0,
      totalTests: question.tests?.length || 0,
      results: [],
    };
  }
}

// Submit answer endpoint
router.post("/submit-answer", async (req, res) => {
  try {
    const { code, question } = req.body;

    console.log("📝 Submit answer received");
    console.log("Code length:", code?.length || 0);
    console.log("Question:", question?.title);

    if (!code || !question) {
      return res.status(400).json({
        success: false,
        error: "Code and question are required",
      });
    }

    if (!question.tests || question.tests.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Question has no test cases",
      });
    }

    console.log("🧪 Running tests...");
    const results = runTests(code, question);
    
    console.log(`✅ Tests completed: ${results.passedCount}/${results.totalTests} passed`);

    return res.status(200).json(results);
  } catch (error) {
    console.error("❌ Submit answer error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to test code",
      details: error.message,
    });
  }
});

export default router;