import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { businessId, prompt } = await req.json();

    if (!businessId || !prompt) {
      return NextResponse.json(
        { error: "businessId and prompt are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenAI({ apiKey });

    // Fetch business data
    const supabase = getServiceSupabase();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Build context from knowledge base
    const enriched = business.enriched_data || {};
    const guidelines = business.brand_guidelines || {};
    const docs = {
      strategy: business.social_strategy || "",
      research: business.market_research || "",
      profile: business.business_profile || "",
    };

    const context = `
Brand Name: ${business.business_name}
Website: ${business.website}

Brand DNA:
- Overview: ${enriched.businessOverview || "N/A"}
- Tagline: ${enriched.tagline || "N/A"}
- Values: ${(enriched.brandValues || []).join(", ") || "N/A"}
- Aesthetic: ${enriched.brandAesthetic || "N/A"}
- Tone: ${enriched.brandTone || "N/A"}

Colors: ${guidelines.colors?.map((c: any) => `${c.name}: ${c.hex}`).join(", ") || "N/A"}
Typography: ${guidelines.typography?.map((t: any) => `${t.usage}: ${t.family}`).join(", ") || "N/A"}

Social Media Strategy:
${docs.strategy.slice(0, 1500)}

Market Research:
${docs.research.slice(0, 1500)}

Business Profile:
${docs.profile.slice(0, 1500)}
`.trim();

    const fullPrompt = `You are an expert content strategist for a brand. Use the brand's knowledge base below to create highly relevant, on-brand content ideas.

BRAND KNOWLEDGE BASE:
${context}

USER REQUEST:
${prompt}

Generate creative, actionable, and specific ideas that align with the brand's values, aesthetic, and tone of voice. Be practical and implementable.`;

    // Current Gemini models (2025) — 1.5 family is deprecated and returns 404
    const MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro",
    ];
    let content = "";
    let lastError = "";

    for (const model of MODELS) {
      try {
        console.log(`[generate-content] Using model: ${model}`);
        const response = await genAI.models.generateContent({
          model,
          contents: fullPrompt,
          config: { responseMimeType: "text/plain" },
        });
        content = response.text?.trim() || "";
        if (content) {
          console.log(`[generate-content] ✅ Generated content (${content.length} chars)`);
          break;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        console.warn(`[generate-content] ${model} failed:`, msg.slice(0, 250));
      }
    }

    if (!content) {
      // Surface a useful error for common cases
      let userMsg = "Failed to generate content";
      if (lastError.includes("API key") || lastError.includes("API_KEY_INVALID") || lastError.includes("leaked") || lastError.includes("PERMISSION_DENIED")) {
        userMsg = "Gemini API key is invalid or revoked. Generate a new key at https://aistudio.google.com/apikey and update .env.local";
      } else if (lastError.includes("429") || lastError.includes("quota") || lastError.includes("RESOURCE_EXHAUSTED")) {
        userMsg = "Gemini API rate limit exceeded. Please wait a moment and try again.";
      } else if (lastError.includes("404") || lastError.includes("not found")) {
        userMsg = "All Gemini models returned 404. The model names may be deprecated.";
      }
      return NextResponse.json({ error: userMsg, detail: lastError.slice(0, 300) }, { status: 500 });
    }

    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("[generate-content] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
