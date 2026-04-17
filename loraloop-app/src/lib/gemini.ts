/**
 * Gemini Smart Model Router
 *
 * Instead of always trying the same fixed fallback chain, each task type
 * is routed to the models best suited for it — by capability, speed, and
 * creativity requirements. All available Gemini models are used across
 * different task types so every model earns its place.
 *
 * Model characteristics (2025):
 *  gemini-2.5-pro        — Most capable, largest context, best reasoning & world knowledge
 *  gemini-2.5-flash      — Fast + high quality, great for structured output & creativity
 *  gemini-2.5-flash-lite — Ultra-fast, lower latency, good for simple tasks
 *  gemini-2.0-flash      — Balanced speed/quality, solid general purpose
 *  gemini-2.0-flash-lite — Fastest, lightest, best for short creative snippets
 */

import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

// ── All available Gemini models ────────────────────────────────────────────────
export const GEMINI_MODELS = {
  PRO_25:        "gemini-2.5-pro",
  FLASH_25:      "gemini-2.5-flash",
  FLASH_LITE_25: "gemini-2.5-flash-lite",
  FLASH_20:      "gemini-2.0-flash",
  FLASH_LITE_20: "gemini-2.0-flash-lite",
} as const;

export type GeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

// ── Task types → model priority lists ─────────────────────────────────────────
// First model in the list is tried first. Falls back down the list on failure.
export const TASK_MODELS: Record<string, GeminiModel[]> = {
  /**
   * Brand DNA extraction — needs accurate JSON with real brand data.
   * 2.5-flash is ideal: fast structured output. 2.0-flash as backup.
   */
  "dna-extraction": [
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.FLASH_LITE_20,
    GEMINI_MODELS.PRO_25,
  ],

  /**
   * Business Profile — detailed brand analysis document.
   * Needs quality writing and factual accuracy. Start with 2.5-flash.
   */
  "business-profile": [
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.PRO_25,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.FLASH_LITE_20,
  ],

  /**
   * Market Research — requires world knowledge for real competitor names,
   * SEO keywords, industry trends. 2.5-pro first for best knowledge depth.
   */
  "market-research": [
    GEMINI_MODELS.PRO_25,
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.FLASH_LITE_20,
  ],

  /**
   * Social Strategy — creative + strategic. 2.5-flash balances creativity
   * and speed. 2.0-flash is a solid fallback for strategic thinking.
   */
  "social-strategy": [
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.PRO_25,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.FLASH_LITE_20,
  ],

  /**
   * Content generation (chat) — conversational, fast responses.
   * 2.0-flash is the sweet spot. Lite models work well here too.
   */
  "content-generation": [
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.FLASH_LITE_20,
    GEMINI_MODELS.PRO_25,
  ],

  /**
   * Steve visual design briefs — creative JSON with slide copy.
   * 2.5-flash excels at structured creative output. 2.0-flash backup.
   */
  "steve-design": [
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.PRO_25,
    GEMINI_MODELS.FLASH_LITE_20,
  ],

  /**
   * Short creative copy — quick headlines, captions, CTAs.
   * Lite models are fastest for short outputs.
   */
  "creative-copy": [
    GEMINI_MODELS.FLASH_LITE_20,
    GEMINI_MODELS.FLASH_LITE_25,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_25,
    GEMINI_MODELS.PRO_25,
  ],
};

// ── Core call function ─────────────────────────────────────────────────────────
export interface GeminiCallOptions {
  taskType: keyof typeof TASK_MODELS;
  prompt: string;
  /** defaults to "text/plain" */
  mimeType?: "text/plain" | "application/json";
  /** override model order for this call */
  modelOverride?: GeminiModel[];
  /** minimum acceptable response length in chars (default 50) */
  minLength?: number;
}

export interface GeminiResult {
  text: string;
  model: string;
  taskType: string;
}

export async function callGemini(options: GeminiCallOptions): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in .env.local");

  const genAI = new GoogleGenAI({ apiKey });
  const models = options.modelOverride ?? TASK_MODELS[options.taskType] ?? Object.values(GEMINI_MODELS);
  const minLen = options.minLength ?? 50;
  const config: GenerateContentConfig = {
    responseMimeType: options.mimeType ?? "text/plain",
  };

  let lastError = "";

  for (const model of models) {
    try {
      console.log(`[gemini/${options.taskType}] trying ${model}`);
      const response = await genAI.models.generateContent({
        model,
        contents: options.prompt,
        config,
      });
      const text = response.text?.trim() ?? "";
      if (text.length >= minLen) {
        console.log(`[gemini/${options.taskType}] ✅ ${model} → ${text.length} chars`);
        return { text, model, taskType: options.taskType };
      }
      console.warn(`[gemini/${options.taskType}] ${model} returned too short (${text.length} chars), trying next`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      console.warn(`[gemini/${options.taskType}] ${model} failed: ${msg.slice(0, 200)}`);
    }
  }

  // Surface a useful error
  let userMsg = `All Gemini models failed for task "${options.taskType}"`;
  if (lastError.includes("API key") || lastError.includes("PERMISSION_DENIED") || lastError.includes("leaked") || lastError.includes("API_KEY_INVALID")) {
    userMsg = "Gemini API key is invalid or revoked. Get a new key at https://aistudio.google.com/apikey (starts with AIza...)";
  } else if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED")) {
    userMsg = "Gemini API rate limit reached. Wait a moment and try again.";
  } else if (lastError.includes("404") || lastError.includes("not found")) {
    userMsg = "Gemini model not found — model names may have changed.";
  }

  const error = new Error(userMsg) as Error & { detail: string };
  error.detail = lastError.slice(0, 400);
  throw error;
}
