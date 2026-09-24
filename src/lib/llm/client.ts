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

interface GeminiResult {
  text: string;
  usedFallback: boolean;
  error?: string;
}

const RETRYABLE_STATUS = [429, 500, 503];

export async function callGemini(
  prompt: string,
  systemInstruction?: string
): Promise<GeminiResult> {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (!client) {
    console.warn("No GEMINI_API_KEY detected. Using fallback synthesizer.");
    return { text: "", usedFallback: true, error: "no_api_key" };
  }

  const maxAttempts = 3;
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: systemInstruction
          ? { systemInstruction, temperature: 0.7 }
          : { temperature: 0.7 },
      });

      const text = response.text || "";
      if (!text) throw new Error("empty_response");
      return { text, usedFallback: false };
    } catch (error: any) {
      const status = error?.status ?? error?.error?.code;
      lastError = error?.message || String(error);
      console.error(`Gemini call failed (attempt ${attempt}/${maxAttempts}, status ${status}):`, lastError);

      const retryable = RETRYABLE_STATUS.includes(status);
      if (!retryable || attempt === maxAttempts) break;

      // exponential backoff: 500ms, 1500ms
      await new Promise((r) => setTimeout(r, 500 * Math.pow(3, attempt - 1)));
    }
  }

  return { text: "", usedFallback: true, error: lastError };
}