import { GoogleGenerativeAI } from "@google/generative-ai";

// ensure the environment variable is present at startup
const apiKey: string | undefined = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing required environment variable: GEMINI_API_KEY");
}

// instantiate client
// The constructor expects the API key string directly (not an options object).
const gemini = new GoogleGenerativeAI(apiKey);
const model: string = "gemini-2.0-flash";

export { gemini, model };
