import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function generateText(prompt) {
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(`Gemini API error (attempt ${attempts + 1}):`, error);
      if (error.status === 503) {
        // Wait a bit and retry
        await new Promise((res) => setTimeout(res, 1000 * (attempts + 1)));
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Gemini API overloaded. Please try again later.");
}
