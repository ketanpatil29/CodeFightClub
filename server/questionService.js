import verifiedQuestions from "./verifiedQuestion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY.js
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function getQuestion(category = "DSA") {
  // STEP 1: instant fallback
  const safeQuestion =
    verifiedQuestions[Math.floor(Math.random() * verifiedQuestions.length)];

  // STEP 2: mostly return verified
  if (!genAI || Math.random() > 0.05) {
    return safeQuestion;
  }

  // STEP 3: AI attempt (non-blocking safe)
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
Generate a simple coding question in JSON:
{
  "title": "...",
  "description": "...",
  "testCases": [{ "input": [...], "expectedOutput": ... }]
}`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, r) => setTimeout(() => r("timeout"), 4000))
    ]);

    const text = result?.response?.text();
    const parsed = JSON.parse(text);

    if (parsed?.testCases) return parsed;
  } catch (err) {
    console.log("⚠️ AI failed, using verified");
  }

  return safeQuestion;
}
