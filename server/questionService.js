import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ VERIFIED QUESTIONS LIVE HERE
export const verifiedQuestions = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target...",
    testCases: [
      { input: [[2,7,11,15], 9], expectedOutput: [0,1] }
    ]
  },
  {
    title: "Count Occurrences",
    description: "Count target in array",
    testCases: [
      { input: [[1,2,2,3], 2], expectedOutput: 2 }
    ]
  }
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export async function getQuestion(category = "DSA") {
  // 95% verified (FAST)
  if (Math.random() < 0.95 || !process.env.GEMINI_API_KEY) {
    return verifiedQuestions[
      Math.floor(Math.random() * verifiedQuestions.length)
    ];
  }

  // 5% AI
  try {
    const prompt = `
Return ONLY JSON coding problem:
{
  "title": "",
  "description": "",
  "testCases": [{ "input": [], "expectedOutput": null }]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Bad AI");

    return JSON.parse(match[0]);
  } catch {
    return verifiedQuestions[
      Math.floor(Math.random() * verifiedQuestions.length)
    ];
  }
}
