import express from "express";
const router = express.Router();

// POST /ai/generate-question
router.post("/generate-question", async (req, res) => {
  const { category } = req.body;

  if (!category) return res.status(400).json({ message: "Category is required" });

  const question = {
  title: "Two Sum",
  description: "Return indices of two numbers adding to target",
  input: "[nums, target]",
  output: "[index1, index2]",
  examples: "Example: nums = [2,7,11,15], target = 9 -> [0,1]",
  testCases: [
      { input: [[2,7,11,15], 9], output: [0,1] },
      { input: [[3,2,4], 6], output: [1,2] }
    ]
  };

  console.log(`✅ Test question sent for category: ${category}`);
  res.json({ question });
});

export default router;
