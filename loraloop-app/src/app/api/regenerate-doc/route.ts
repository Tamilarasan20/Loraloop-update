import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
];

const VALID_DOCS = ["businessProfile", "marketResearch", "socialStrategy"] as const;
type DocType = typeof VALID_DOCS[number];

const DB_FIELD: Record<DocType, string> = {
  businessProfile: "business_profile",
  marketResearch: "market_research",
  socialStrategy: "social_strategy",
};

export async function POST(req: Request) {
  try {
    const { businessId, docType } = await req.json();

    if (!businessId || !docType || !VALID_DOCS.includes(docType)) {
      return NextResponse.json({ error: "businessId and valid docType required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
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
    const brandName = business.business_name || "this brand";
    const url = business.website || "";

    const brandContext = `
Brand: ${brandName}
Website: ${url}
Overview: ${enriched.businessOverview || "N/A"}
Tagline: ${enriched.tagline || "N/A"}
Brand Values: ${(enriched.brandValues || []).join(", ") || "N/A"}
Brand Aesthetic: ${enriched.brandAesthetic || "N/A"}
Tone of Voice: ${enriched.brandTone || "N/A"}
Colors: ${(guidelines.colors || []).map((c: any) => `${c.name}: ${c.hex}`).join(", ") || "N/A"}
Typography: ${(guidelines.typography || []).map((t: any) => `${t.usage}: ${t.family}`).join(", ") || "N/A"}
Existing Strategy: ${(business.social_strategy || "").slice(0, 500)}
Existing Research: ${(business.market_research || "").slice(0, 500)}
Existing Profile: ${(business.business_profile || "").slice(0, 500)}
`.trim();

    const PROMPTS: Record<DocType, string> = {
      businessProfile: `You are a senior brand analyst. Write a detailed Business Profile document in markdown for ${brandName}.

BRAND DATA:
${brandContext}

Write the Business Profile with these exact sections:
# ${brandName} – Business Profile

## Overview
2-3 paragraphs covering what the business does, their mission, and market positioning.

## Products & Services
List every product, service or offering mentioned with a short description of each.

## Key Selling Points
5-8 bullet points of the most compelling reasons to choose this brand.

## Target Audience
Who this brand serves — demographics, psychographics, interests, lifestyle.

## Brand Positioning
How this brand positions itself vs competitors — premium/budget, local/global, niche/mass market.

Rules: Use markdown: ## headers, - bullets, **bold** for key terms. Minimum 400 words.`,

      marketResearch: `You are a senior market researcher. Write a comprehensive Market Research document in markdown for ${brandName}.

BRAND DATA:
${brandContext}

Write the Market Research with these exact sections:
# ${brandName} – Market Research

## Market Opportunity
Describe the market this brand operates in, current trends, and growth indicators.

## Competitive Landscape
List 8-10 REAL competitor companies in the same industry. For each, 1-2 lines on what they do and how they compare.

## SEO & GEO Keywords
List 15-20 high-value search keywords grouped by intent (informational, commercial, transactional).

## Target Audiences on Social
4-5 distinct audience segments with platform preferences and what content resonates.

## Opportunities & Gaps
3-5 white-space opportunities this brand could own in the market.

Rules: Competitors must be real named companies. Use markdown: ## headers, - bullets. Minimum 500 words.`,

      socialStrategy: `You are a senior social media strategist. Write a detailed Social Media Strategy document in markdown for ${brandName}.

BRAND DATA:
${brandContext}

Write the Social Media Strategy with these exact sections:
# ${brandName} – Social Media Strategy

## Priority Platforms
Rank the top 3-4 social platforms. For each: why it's a priority, the audience, and content format.

## Content Pillars
Define 4-6 content themes. For each pillar: name, description, 2-3 specific example post ideas, which audience it speaks to.

## Posting Cadence
Recommended posting frequency per platform.

## Messaging Hierarchy
The 3-4 core messages ranked by priority — lead message, secondary hooks, proof points.

## Quick Wins
5-7 immediately actionable tactics for the next 30 days to grow engagement and followers.

## Brand Voice Guide
How to write captions: dos and don'ts, example phrases, emoji usage.

Rules: Be specific to ${brandName}'s industry and tone: ${enriched.brandTone || "professional"}. Minimum 500 words.`,
    };

    const genAI = new GoogleGenAI({ apiKey });
    let content = "";
    let lastError = "";

    for (const model of MODELS) {
      try {
        console.log(`[regenerate-doc] ${docType} with ${model}`);
        const response = await genAI.models.generateContent({
          model,
          contents: PROMPTS[docType as DocType],
          config: { responseMimeType: "text/plain" },
        });
        content = response.text?.trim() || "";
        if (content.length > 100) {
          console.log(`[regenerate-doc] ✅ ${docType} (${content.length} chars)`);
          break;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        console.warn(`[regenerate-doc] ${model} failed:`, msg.slice(0, 150));
      }
    }

    if (!content) {
      let userMsg = "Failed to generate document";
      if (lastError.includes("API key") || lastError.includes("PERMISSION_DENIED") || lastError.includes("leaked")) {
        userMsg = "Gemini API key is invalid or revoked. Update GEMINI_API_KEY in .env.local";
      } else if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED")) {
        userMsg = "Gemini API rate limit. Please wait and try again.";
      }
      return NextResponse.json({ error: userMsg, detail: lastError.slice(0, 300) }, { status: 500 });
    }

    // Save to Supabase
    const { error: saveError } = await supabase
      .from("businesses")
      .update({ [DB_FIELD[docType as DocType]]: content })
      .eq("id", businessId);

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("[regenerate-doc] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
