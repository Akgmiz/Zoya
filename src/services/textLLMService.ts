import { GoogleGenAI } from "@google/genai";

export async function getAdvancedTextResponse(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in the environment");
    return "API key missing for advanced model.";
  }
  
  try {
    const textGenAI = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
    const response = await textGenAI.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    return response.text || "Sorry, kuch samajh nahi aaya.";
  } catch (error) {
    console.error("Advanced LLM Error:", error);
    return "Mera advanced model thoda lazy ho gaya... phir try karte hain.";
  }
}
