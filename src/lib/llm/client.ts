import { GoogleGenAI } from "@google/genai";

let genAiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-gemini-api-key-here") {
    return null;
  }

  if (!genAiInstance) {
    genAiInstance = new GoogleGenAI({ apiKey });
  }

  return genAiInstance;
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!client) {
    console.warn("No GEMINI_API_KEY detected in environment. Using fallback intelligent synthesizer.");
    return ""; // signal to use template/fallback generator
  }

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: systemInstruction
        ? {
            systemInstruction,
            temperature: 0.7,
          }
        : {
            temperature: 0.7,
          },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "";
  }
}
