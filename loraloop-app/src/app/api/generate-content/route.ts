import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { businessId, prompt } = await req.json();

    if (!businessId || !prompt) {
      return NextResponse.json({ error: "businessId and prompt are required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

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

    // Content generation uses gemini-2.0-flash first — fast & conversational
    const result = await callGemini({
      taskType: "content-generation",
      prompt: fullPrompt,
      minLength: 50,
    });

    return NextResponse.json({ content: result.text });
  } catch (err: any) {
    console.error("[generate-content] Error:", err);
    const userMsg = err.message?.includes("API key") || err.message?.includes("revoked")
      ? err.message
      : err.message || "Failed to generate content";
    return NextResponse.json({ error: userMsg, detail: err.detail || "" }, { status: 500 });
  }
}
