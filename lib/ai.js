import { GoogleGenerativeAI } from "@google/generative-ai";
import "server-only";

// AI Provider Configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || "gemini"; // 'gemini' or 'deepseek'

// Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// DeepSeek Client (compatible with OpenAI SDK)
import OpenAI from "openai";
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

/**
 * Generates a chat completion using the configured LLM provider.
 *
 * @param {string} prompt - The prompt to send to the model.
 * @param {object} options - Configuration options for the generation.
 * @returns {Promise<string>} The generated text response.
 */
async function generateText(prompt, options = {}) {
  const { model: modelName = "default" } = options;

  if (LLM_PROVIDER === "deepseek") {
    // --- DeepSeek API Call ---
    const model = modelName === "default" ? "deepseek-chat" : modelName;
    try {
      const chatCompletion = await deepseek.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      });
      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error("DeepSeek API error:", error);
      throw new Error("Failed to get response from DeepSeek API.");
    }
  } else {
    // --- Gemini API Call (Default) ---
    const model = modelName === "default" ? "gemini-2.0-flash" : modelName;
    try {
      const generativeModel = genAI.getGenerativeModel({ model });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to get response from Gemini API.");
    }
  }
}

export { generateText };

// You can now create wrappers around generateText for specific tasks,
// ensuring the core logic is provider-agnostic.
// Example:
/*
export async function generateModuleSummary(content, context) {
  const prompt = `...`; // your detailed prompt here
  const responseJson = await generateText(prompt);
  return JSON.parse(responseJson);
}
*/ 