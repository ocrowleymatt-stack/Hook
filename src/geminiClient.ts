import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY not set in environment");
}

export const ai = new GoogleGenAI({ apiKey });

export async function generateText(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  return response.text;
}

export async function multiTurnChat(messages: { role: string; content: string }[]) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
  });

  return response.text;
}
