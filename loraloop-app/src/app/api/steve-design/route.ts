import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { callGemini } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { businessId, prompt, platform, format, slideCount } = await req.json();

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
    const images: string[] = (guidelines.images || []).slice(0, 3);

    const brandColors = guidelines.colors || [];
    const primaryColor = brandColors[0]?.hex || "#2563EB";
    const secondaryColor = brandColors[1]?.hex || "#F59E0B";
    const tertiaryColor = brandColors[2]?.hex || "#10B981";

    const brandFonts = guidelines.typography || [];
    const headingFont = brandFonts.find((t: any) => t.usage?.toLowerCase().includes("head"))?.family
      || brandFonts[0]?.family || "Inter";
    const bodyFont = brandFonts.find((t: any) => t.usage?.toLowerCase().includes("body"))?.family
      || brandFonts[1]?.family || headingFont;

    const numSlides = format === "carousel" ? (slideCount || 5) : 1;
    const platformName = platform || "Instagram";

    const PLATFORM_SPECS: Record<string, { ratio: string; width: number; height: number }> = {
      Instagram: { ratio: "4:5", width: 1080, height: 1350 },
      "Instagram Story": { ratio: "9:16", width: 1080, height: 1920 },
      Facebook: { ratio: "1.91:1", width: 1200, height: 630 },
      TikTok: { ratio: "9:16", width: 1080, height: 1920 },
      LinkedIn: { ratio: "1.91:1", width: 1200, height: 627 },
      X: { ratio: "16:9", width: 1600, height: 900 },
    };
    const spec = PLATFORM_SPECS[platformName] || PLATFORM_SPECS.Instagram;

    const brandContext = `
Brand: ${business.business_name}
Website: ${business.website}
Tagline: ${enriched.tagline || "N/A"}
Overview: ${enriched.businessOverview || "N/A"}
Brand Values: ${(enriched.brandValues || []).join(", ") || "N/A"}
Aesthetic: ${enriched.brandAesthetic || "N/A"}
Tone: ${enriched.brandTone || "N/A"}
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}
Heading Font: ${headingFont}
Social Strategy: ${(business.social_strategy || "").slice(0, 800)}
Target Audience: ${(business.market_research || "").slice(0, 400)}
`.trim();

    const systemPrompt = `You are Steve, an elite AI Visual Designer specialising in scroll-stopping social media content.
You create highly specific, brand-aligned design briefs that a designer can execute immediately.

CRITICAL: Reply ONLY with a valid JSON object. No markdown fences, no explanation.

JSON structure:
{
  "title": "short campaign title",
  "platform": "${platformName}",
  "format": "${format}",
  "slides": [
    {
      "slideNumber": 1,
      "role": "hook|value|story|proof|cta",
      "headline": "SHORT PUNCHY HEADLINE IN CAPS",
      "subhead": "Supporting line that expands the headline",
      "body": "1–2 sentence body copy (use \\n for line breaks)",
      "cta": "Call-to-action text",
      "visualDirection": "Detailed description of the background visual/photo",
      "layout": "centered|left-aligned|split|overlay|top-bottom",
      "backgroundColor": "#hex — brand color or complementary",
      "textColor": "#hex — high-contrast against background",
      "accentColor": "#hex — highlight color for CTA or keywords",
      "overlayOpacity": 0.0,
      "emojiAccent": "single relevant emoji or empty string",
      "designNotes": "Brief mood/feel note for the designer"
    }
  ]
}

Rules:
- ${numSlides} slide(s) total
- Slide 1 is always the hook — stop the scroll immediately
- Each slide must have a distinct role and visual identity
- Headlines: max 6 words, all caps, punchy
- Body copy: conversational, brand voice aligned
- Colors must use the brand palette provided
- Platform is ${platformName} (${spec.ratio} ratio, ${spec.width}×${spec.height}px)
- Make it scroll-stopping and platform-native`;

    const fullPrompt = `${systemPrompt}

BRAND KNOWLEDGE:
${brandContext}

USER REQUEST:
${prompt}

Generate ${numSlides} slide(s) for ${platformName} ${format} post.`;

    // Steve design uses gemini-2.5-flash first — creative + structured JSON
    const result = await callGemini({
      taskType: "steve-design",
      prompt: fullPrompt,
      minLength: 100,
    });

    // Parse JSON — strip markdown fences if present
    let design: any;
    try {
      const cleaned = result.text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      design = JSON.parse(cleaned);
    } catch {
      console.error("[steve-design] JSON parse failed, raw:", result.text.slice(0, 500));
      return NextResponse.json({ error: "Design generation returned malformed JSON", raw: result.text.slice(0, 500) }, { status: 500 });
    }

    // Attach brand meta for the frontend renderer
    design.brandMeta = {
      name: business.business_name,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      headingFont,
      bodyFont,
      logo: guidelines.logo || null,
      images,
      platformSpec: spec,
    };

    return NextResponse.json({ design });
  } catch (err: any) {
    console.error("[steve-design] Error:", err);
    return NextResponse.json({ error: err.message, detail: err.detail || "" }, { status: 500 });
  }
}
