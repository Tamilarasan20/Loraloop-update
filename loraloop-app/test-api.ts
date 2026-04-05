import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC0kpFTFl4ruYMi5LbTV2Kd2ZFWqTLaiCQ";
  const genAI = new GoogleGenAI({ apiKey });
  
  const prompt = "What model is this?";
  console.log("Testing API Key...");
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    console.log("SUCCESS:", response.text);
  } catch (err: any) {
    console.error("FAIL:", err.message);
  }
}
test();
