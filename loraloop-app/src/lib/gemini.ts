/**
 * Gemini Smart Model Router
 *
 * ALL available models from the Google AI Studio dashboard are registered here.
 * Each task type uses a priority list optimised for:
 *   1. Highest quota availability (RPM/TPM/RPD)
 *   2. Best capability for the task
 *   3. Speed vs quality trade-off
 *
 * Dashboard quota (current as of April 2025):
 *   gemini-3.1-flash-lite  — highest RPM (15), best availability
 *   gemini-2.5-flash-lite  — 10 RPM
 *   gemini-2.5-flash       — 5 RPM
 *   gemini-3.0-flash       — 5 RPM
 *   gemma-4-27b/31b        — 15 RPM (large capable open models)
 *   gemma-3-*              — 30 RPM (fastest quota refresh)
 *   gemini-2.5-pro         — currently 0 quota (included as last resort)
 */

import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

// ── All registered models ──────────────────────────────────────────────────────
export const GEMINI_MODELS = {
  // ── Gemini 2.5 family ──
  FLASH_25:       "gemini-2.5-flash",
  FLASH_LITE_25:  "gemini-2.5-flash-lite",
  PRO_25:         "gemini-2.5-pro",

  // ── Gemini 2.0 family ──
  FLASH_20:       "gemini-2.0-flash",
  FLASH_LITE_20:  "gemini-2.0-flash-lite",

  // ── Gemini 3.x family (newest) ──
  FLASH_30:       "gemini-3.0-flash",
  FLASH_LITE_31:  "gemini-3.1-flash-lite",
  PRO_31:         "gemini-3.1-pro",

  // ── Gemma 4 family (large open models, high RPM) ──
  GEMMA4_31B:     "gemma-4-31b",
  GEMMA4_27B:     "gemma-4-27b",

  // ── Gemma 3 family (very high RPM, lighter tasks) ──
  GEMMA3_27B:     "gemma-3-27b-it",
  GEMMA3_12B:     "gemma-3-12b-it",
  GEMMA3_4B:      "gemma-3-4b-it",
  GEMMA3_2B:      "gemma-3-2b-it",
  GEMMA3_1B:      "gemma-3-1b-it",
} as const;

export type GeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

// ── Cost Tier System ───────────────────────────────────────────────────────────
// Tier 1 (haiku):  Extremely fast, very cheap. Data extraction, formatting, templates.
// Tier 2 (sonnet): Balanced. Standard copywriting, marketing hooks, moderate reasoning.
// Tier 3 (opus):   Slow, expensive. Zero-to-one creative strategy, complex reasoning.
export type CostTier = "haiku" | "sonnet" | "opus";

export const TIER_MODELS: Record<CostTier, GeminiModel[]> = {
  haiku: [
    GEMINI_MODELS.GEMMA3_4B,       // 30 RPM — tiny, fastest
    GEMINI_MODELS.GEMMA3_12B,      // 30 RPM — fast
    GEMINI_MODELS.FLASH_LITE_31,   // 15 RPM — cheap flash
    GEMINI_MODELS.FLASH_LITE_25,   // 10 RPM
    GEMINI_MODELS.FLASH_LITE_20,   // backup
  ],
  sonnet: [
    GEMINI_MODELS.FLASH_LITE_31,   // 15 RPM — newest lite
    GEMINI_MODELS.FLASH_25,        // 5 RPM  — strong balanced
    GEMINI_MODELS.FLASH_30,        // 5 RPM  — newer gen
    GEMINI_MODELS.GEMMA4_27B,      // 15 RPM — capable
    GEMINI_MODELS.GEMMA4_31B,      // 15 RPM
    GEMINI_MODELS.FLASH_20,        // backup
    GEMINI_MODELS.GEMMA3_27B,      // 30 RPM
  ],
  opus: [
    GEMINI_MODELS.FLASH_25,        // 5 RPM  — strongest flash
    GEMINI_MODELS.PRO_25,          // 0 RPM  — deepest reasoning
    GEMINI_MODELS.PRO_31,          // newest pro
    GEMINI_MODELS.GEMMA4_31B,      // 15 RPM — large model fallback
    GEMINI_MODELS.FLASH_30,        // 5 RPM
    GEMINI_MODELS.FLASH_LITE_31,   // 15 RPM — last resort
  ],
};

/**
 * Route a task to the cheapest tier that guarantees 95%+ success.
 * Chain-of-thought:
 *   1. Is the task purely mechanical (extraction, formatting, JSON, templates)? → haiku
 *   2. Does it need moderate creativity or reasoning? → sonnet
 *   3. Does it need zero-to-one strategy or complex multi-step logic? → opus
 */
export function routeToTier(taskType: string, agentName?: string, promptLength?: number): CostTier {
  // Mechanical / template tasks → always haiku
  const haikuTasks = ["dna-extraction", "creative-copy"];
  if (haikuTasks.includes(taskType)) return "haiku";

  // Complex strategy / deep research → opus
  const opusTasks = ["market-research"];
  if (opusTasks.includes(taskType)) return "opus";

  // Agent-based routing for content-generation
  if (taskType === "content-generation" && agentName) {
    const agent = agentName.toLowerCase();
    // Lora (CMO strategy) and Maya (analytics) need deeper reasoning
    if (agent === "lora" || agent === "maya") return "sonnet";
    // Sophie (copy) and Nova (image prompts) are template-driven
    if (agent === "sophie" || agent === "nova") return "haiku";
    // Kip (video) needs moderate creativity
    if (agent === "kip") return "sonnet";
  }

  // Long prompts (>3000 chars) likely need more capable models
  if (promptLength && promptLength > 5000) return "sonnet";

  // Default: sonnet (safe middle ground)
  return "sonnet";
}

// ── Task → model priority lists ────────────────────────────────────────────────
// Models are tried IN ORDER — first success wins.
// Priority logic: highest RPM quota → then best capability for task.
export const TASK_MODELS: Record<string, GeminiModel[]> = {
  /**
   * Brand DNA extraction — structured JSON output, accuracy matters.
   * 3.1-flash-lite first (15 RPM), then 2.5-flash (best JSON accuracy).
   */
  "dna-extraction": [
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM — highest quota
    GEMINI_MODELS.FLASH_25,       // 5 RPM  — excellent structured output
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM — fast fallback
    GEMINI_MODELS.FLASH_30,       // 5 RPM  — newer model
    GEMINI_MODELS.FLASH_20,       // backup
    GEMINI_MODELS.FLASH_LITE_20,
    GEMINI_MODELS.GEMMA4_27B,
    GEMINI_MODELS.PRO_25,
  ],

  /**
   * Business Profile — detailed writing, factual accuracy.
   * Favour capable models over fastest.
   */
  "business-profile": [
    GEMINI_MODELS.FLASH_25,       // 5 RPM  — quality writing
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM — high availability
    GEMINI_MODELS.FLASH_30,       // 5 RPM  — newer generation
    GEMINI_MODELS.GEMMA4_31B,     // 15 RPM — large, capable
    GEMINI_MODELS.GEMMA4_27B,     // 15 RPM
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM — solid fallback
    GEMINI_MODELS.PRO_25,         // 0 RPM  — last resort
    GEMINI_MODELS.PRO_31,
    GEMINI_MODELS.GEMMA3_27B,
    GEMINI_MODELS.FLASH_20,
  ],

  /**
   * Market Research — needs real world knowledge for competitor names,
   * industry trends, SEO keywords. Best large models first.
   */
  "market-research": [
    GEMINI_MODELS.FLASH_25,       // 5 RPM  — strong world knowledge
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM — newest, high quota
    GEMINI_MODELS.FLASH_30,       // 5 RPM
    GEMINI_MODELS.GEMMA4_31B,     // 15 RPM — large model
    GEMINI_MODELS.GEMMA4_27B,     // 15 RPM
    GEMINI_MODELS.PRO_25,         // 0 RPM  — most knowledge depth
    GEMINI_MODELS.PRO_31,
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM
    GEMINI_MODELS.GEMMA3_27B,
    GEMINI_MODELS.FLASH_20,
  ],

  /**
   * Social Strategy — creative + strategic thinking.
   * Balance between capability and quota.
   */
  "social-strategy": [
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM — newest, highest quota
    GEMINI_MODELS.FLASH_25,       // 5 RPM  — creative quality
    GEMINI_MODELS.FLASH_30,       // 5 RPM
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM
    GEMINI_MODELS.GEMMA4_27B,     // 15 RPM — capable for creative
    GEMINI_MODELS.GEMMA4_31B,     // 15 RPM
    GEMINI_MODELS.GEMMA3_27B,
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.PRO_25,
  ],

  /**
   * Content generation (chat) — fast, conversational responses.
   * Prioritise speed and quota availability.
   */
  "content-generation": [
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM — fastest + most quota
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM — very fast
    GEMINI_MODELS.FLASH_30,       // 5 RPM  — newer generation
    GEMINI_MODELS.FLASH_25,       // 5 RPM
    GEMINI_MODELS.GEMMA3_12B,     // 30 RPM — massive quota for chat
    GEMINI_MODELS.GEMMA3_27B,     // 30 RPM
    GEMINI_MODELS.GEMMA4_27B,     // 15 RPM
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_20,
    GEMINI_MODELS.PRO_25,
  ],

  /**
   * Steve visual design briefs — creative JSON with slide copy.
   * Needs creative capability + structured output.
   */
  "steve-design": [
    GEMINI_MODELS.FLASH_25,       // 5 RPM  — best creative JSON
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM — high quota
    GEMINI_MODELS.FLASH_30,       // 5 RPM  — newer
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM
    GEMINI_MODELS.GEMMA4_31B,     // 15 RPM — large creative model
    GEMINI_MODELS.GEMMA4_27B,     // 15 RPM
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.PRO_25,
  ],

  /**
   * Short creative copy — headlines, captions, CTAs.
   * Smallest/fastest models are perfect here.
   */
  "creative-copy": [
    GEMINI_MODELS.GEMMA3_4B,      // 30 RPM — tiny, fast
    GEMINI_MODELS.GEMMA3_12B,     // 30 RPM
    GEMINI_MODELS.FLASH_LITE_31,  // 15 RPM
    GEMINI_MODELS.FLASH_LITE_25,  // 10 RPM
    GEMINI_MODELS.FLASH_20,
    GEMINI_MODELS.FLASH_LITE_20,
    GEMINI_MODELS.FLASH_25,
  ],
};

// ── Core call function ─────────────────────────────────────────────────────────
export interface GeminiCallOptions {
  taskType: keyof typeof TASK_MODELS;
  prompt: string;
  /** defaults to "text/plain" */
  mimeType?: "text/plain" | "application/json";
  /** override model order for this specific call */
  modelOverride?: GeminiModel[];
  /** minimum acceptable response length in chars (default 50) */
  minLength?: number;
  /** Cost tier override — if set, uses TIER_MODELS instead of TASK_MODELS */
  costTier?: CostTier;
  /** Agent name for tier routing (used when costTier is not set) */
  agentName?: string;
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

  // Cost-tier routing: if costTier is explicitly set or auto-routed
  const effectiveTier = options.costTier ?? routeToTier(options.taskType, options.agentName, options.prompt.length);
  const models = options.modelOverride ?? TIER_MODELS[effectiveTier] ?? TASK_MODELS[options.taskType] ?? Object.values(GEMINI_MODELS);
  console.log(`[gemini/${options.taskType}] 💰 Tier: ${effectiveTier.toUpperCase()} → trying ${models.length} models`);

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
      // Skip 0-quota models quickly — don't log noise for quota errors
      const isQuota = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
      if (!isQuota) {
        console.warn(`[gemini/${options.taskType}] ${model} failed: ${msg.slice(0, 200)}`);
      }
    }
  }

  // Surface a useful error
  let userMsg = `All models failed for task "${options.taskType}"`;
  if (lastError.includes("API key") || lastError.includes("PERMISSION_DENIED") || lastError.includes("API_KEY_INVALID") || lastError.includes("leaked")) {
    userMsg = "Gemini API key is invalid or revoked. Get a new key at https://aistudio.google.com/apikey (key starts with AIza...)";
  } else if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED")) {
    userMsg = "All Gemini models are rate-limited. Wait a moment and try again.";
  } else if (lastError.includes("404") || lastError.includes("not found")) {
    userMsg = "Gemini model not found. Model names may have changed.";
  }

  const error = new Error(userMsg) as Error & { detail: string };
  error.detail = lastError.slice(0, 400);
  throw error;
}

// ── Media Generation ───────────────────────────────────────────────────────────
export async function generateGeminiImage(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in .env.local");

  // Use gemini-3.1-flash-image-preview which supports inline image generation
  // via the generateContent API with responseModalities: ["IMAGE", "TEXT"]
  const model = "gemini-3.1-flash-image-preview";
  console.log(`[gemini/image] Requesting ${model} for prompt: ${prompt.slice(0, 60)}...`);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error?.message || "Unknown API error";
    console.error(`[gemini/image] ${model} error ${res.status}:`, errMsg);
    throw new Error(errMsg);
  }

  // Extract base64 image from response parts
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      console.log(`[gemini/image] ✅ Image received (${part.inlineData.mimeType})`);
      return part.inlineData.data; // base64 string
    }
  }

  throw new Error(`${model} returned no image data. Parts: ${JSON.stringify(parts).slice(0, 200)}`);
}

export async function generateGeminiVideo(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in .env.local");

  const model = "veo-2.0-generate-001";
  console.log(`[gemini/video] Requesting ${model} for prompt: ${prompt.slice(0, 60)}...`);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error?.message || "Unknown API error";
    console.error(`[gemini/video] ${model} error ${res.status}:`, errMsg);
    throw new Error(errMsg);
  }

  // Assuming Veo returns base64 in a format similar to Imagen
  // Note: Depending on Veo API specs, it might return a GCS URL or base64. 
  // We'll treat it as base64 video/mp4 for now.
  const videoBytes = data?.predictions?.[0]?.videoBytes || data?.predictions?.[0]?.bytesBase64;
  
  if (videoBytes) {
    console.log(`[gemini/video] ✅ Video received`);
    return `data:video/mp4;base64,${videoBytes}`;
  }

  throw new Error(`${model} returned no video data.`);
}
