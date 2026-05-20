import { NextResponse } from "next/server";
import { localDb } from "@/lib/localDb";
import { callGemini } from "@/lib/gemini";
import {
  buildKbPrompt,
  KB_DOC_TYPES,
  KB_DB_FIELD,
  KB_TASK_TYPE,
  type KbDocType,
  type BrandContext,
} from "@/lib/kbPrompts";

// ─────────────────────────────────────────────────────────────────────────────
// Build the brand context from stored business data
// ─────────────────────────────────────────────────────────────────────────────
function toContext(business: any): BrandContext {
  const enriched = business.enriched_data || {};
  const guidelines = business.brand_guidelines || {};
  const scraped = business.scraped_data || {};

  const colors = (guidelines.colors || [])
    .map((c: any) => `${c.name || c.usage}: ${c.hex}`)
    .join(", ");
  const fonts = (guidelines.typography || [])
    .map((t: any) => `${t.usage}: ${t.family}`)
    .join(", ");

  const scrapedText = [
    scraped.content?.title || "",
    scraped.content?.description || "",
    (scraped.content?.headings || []).join("\n"),
    (scraped.content?.paragraphs || []).join("\n"),
  ].filter(Boolean).join("\n\n");

  return {
    brandName:      business.business_name || "Brand",
    website:        business.website || "",
    overview:       enriched.businessOverview,
    tagline:        enriched.tagline,
    brandValues:    (enriched.brandValues || []).join(", "),
    brandAesthetic: enriched.brandAesthetic,
    toneOfVoice:    enriched.brandTone,
    colors,
    fonts,
    scrapedText,
    existingProfile:  business.business_profile,
    existingResearch: business.market_research,
    existingStrategy: business.social_strategy,
    existingGoals:    business.growth_goals,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal fallback when Gemini is unreachable — keeps existing content if any,
// otherwise a stub so the UI isn't empty.
// ─────────────────────────────────────────────────────────────────────────────
function fallbackDoc(business: any, docType: KbDocType): string {
  const existing = business[KB_DB_FIELD[docType]];
  if (existing && existing.trim().length > 50) return existing;

  const name = business.business_name || "Brand";
  const titles: Record<KbDocType, string> = {
    businessProfile: "Business Profile",
    marketResearch:  "Market Research",
    socialStrategy:  "Social Strategy",
    growthGoals:     "Growth Goals & Execution Rules",
  };
  return `# ${name} – ${titles[docType]}\n\n_Document generation is temporarily unavailable. Click "Regenerate with AI" once Gemini is reachable to fill this in with full tables and enriched content._`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { businessId, docType } = await req.json();

    if (!businessId || !docType || !KB_DOC_TYPES.includes(docType)) {
      return NextResponse.json(
        { error: `businessId and valid docType required (one of ${KB_DOC_TYPES.join(", ")})` },
        { status: 400 }
      );
    }

    const business = localDb.get(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const ctx = toContext(business);
    const prompt = buildKbPrompt(docType as KbDocType, ctx);

    let content = "";
    try {
      const result = await callGemini({
        taskType: KB_TASK_TYPE[docType as KbDocType] as any,
        prompt,
        minLength: 400,
      });
      content = result.text;
      console.log(`[regenerate-doc] ✅ ${docType} via ${result.model} (${content.length} chars)`);
    } catch (err: any) {
      console.log(`[regenerate-doc] Gemini failed for ${docType}:`, err.message);
    }

    if (!content || content.length < 200) {
      content = fallbackDoc(business, docType as KbDocType);
    }

    const { error: saveError } = localDb.update(businessId, {
      [KB_DB_FIELD[docType as KbDocType]]: content,
    });

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    console.log(`[regenerate-doc] ✅ Saved ${docType} (${content.length} chars)`);
    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("[regenerate-doc] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
