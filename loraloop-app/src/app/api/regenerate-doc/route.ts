import { NextResponse } from "next/server";
import { localDb } from "@/lib/localDb";
import { callGemini } from "@/lib/gemini";

const VALID_DOCS = ["businessProfile", "marketResearch", "socialStrategy"] as const;
type DocType = typeof VALID_DOCS[number];

const DB_FIELD: Record<DocType, string> = {
  businessProfile: "business_profile",
  marketResearch: "market_research",
  socialStrategy: "social_strategy",
};

// ─── Template fallback — generates structured markdown from Supabase data ─────
// Used when Gemini is unavailable so documents are NEVER empty
function buildTemplateDocs(business: any): Record<DocType, string> {
  const enriched = business.enriched_data || {};
  const guidelines = business.brand_guidelines || {};
  const name = business.business_name || "This Brand";
  const url = business.website || "";

  const tagline = enriched.tagline || "";
  const overview = enriched.businessOverview || "";
  const values: string[] = enriched.brandValues || [];
  const aesthetic = enriched.brandAesthetic || "";
  const tone = enriched.brandTone || "";

  const colors: any[] = guidelines.colors || [];
  const fonts: any[] = guidelines.typography || [];
  const images: any[] = guidelines.images || [];
  const logo = guidelines.logos?.[0]?.url || guidelines.logo || "";

  const colorLines = colors.map((c: any) => `- **${c.name || c.usage}**: \`${c.hex}\``).join("\n") || "- Not extracted";
  const fontLines = fonts.map((f: any) => `- **${f.usage}**: ${f.family}`).join("\n") || "- Not extracted";
  const valueList = values.map((v: string) => `- ${v}`).join("\n") || "- Not specified";

  // ── Business Profile ──────────────────────────────────────────────────────
  const businessProfile = `# ${name} – Business Profile

## Overview
${overview || `${name} is a brand with a presence at ${url}.`}

## Brand Identity
${tagline ? `> "${tagline}"` : ""}

**Core Values:**
${valueList}

**Brand Aesthetic:** ${aesthetic || "Not specified"}

**Tone of Voice:** ${tone || "Not specified"}

## Visual Brand
### Color Palette
${colorLines}

### Typography
${fontLines}

${logo ? `### Logo\nLogo available at: ${logo}` : ""}

## Digital Presence
- **Website:** ${url}
- **Images scraped:** ${images.length} brand images captured

## Target Audience
Based on the brand's tone (${tone || "professional"}) and values (${values.join(", ") || "quality, trust"}), ${name} targets audiences who value ${aesthetic || "quality and authenticity"}.

## Summary
${overview || name + " is a growing brand with a strong visual identity and clear brand values."} The brand communicates with a ${tone || "professional"} voice and maintains a ${aesthetic || "clean"} aesthetic across all touchpoints.`;

  // ── Market Research ───────────────────────────────────────────────────────
  const marketResearch = `# ${name} – Market Research

## Brand Overview
${overview || `${name} operates at ${url} with a focus on delivering value to their target audience.`}

## Brand Positioning
${tagline ? `**Tagline:** "${tagline}"` : ""}

${name} positions itself with a **${aesthetic || "distinctive"}** visual identity and **${tone || "professional"}** communication style, focusing on values of ${values.slice(0, 3).join(", ") || "quality and customer satisfaction"}.

## Key Differentiators
${values.map((v: string) => `- **${v}** — core brand value that drives product and communication decisions`).join("\n") || "- Quality and authenticity\n- Strong brand identity\n- Customer-first approach"}

## Digital Footprint
- **Website:** ${url}
- **Brand images captured:** ${images.length}
- **Colors identified:** ${colors.length}
- **Fonts identified:** ${fonts.length}

## Target Audience Signals
Based on the brand's aesthetic (${aesthetic || "modern"}) and tone (${tone || "professional"}):

- **Primary Audience:** Consumers who align with ${values[0] || "quality"} and ${values[1] || "authenticity"}
- **Communication Style:** ${tone || "Professional, approachable, and trustworthy"}
- **Visual Expectation:** ${aesthetic || "Clean, modern, and professional"}

## Opportunities
1. **Content Marketing** — Use brand values (${values.slice(0, 2).join(", ") || "quality, trust"}) as content pillars
2. **Social Proof** — Leverage the ${aesthetic || "strong"} visual identity for social media
3. **SEO** — Build content around brand's core offering and values
4. **Community** — Build audience around shared values of ${values[0] || "quality and sustainability"}
5. **Visual Consistency** — ${colors.length} brand colors and ${fonts.length} fonts form a strong visual system

## Brand Health Indicators
- ✅ Brand aesthetic is ${aesthetic || "defined"}
- ✅ Tone of voice is ${tone || "established"}
- ✅ ${values.length} core values identified
- ✅ ${colors.length} brand colors captured
- ${images.length > 5 ? "✅" : "⚠️"} ${images.length} brand images (${images.length > 5 ? "good coverage" : "consider adding more"})`;

  // ── Social Strategy ───────────────────────────────────────────────────────
  const socialStrategy = `# ${name} – Social Media Strategy

## Brand Voice
**Tone:** ${tone || "Professional, authentic, and engaging"}

**Core Message:** ${tagline || overview.slice(0, 120) || `${name} stands for ${values[0] || "quality"} and ${values[1] || "innovation"}`}

## Content Pillars
${values.length > 0
  ? values.map((v: string, i: number) => `### Pillar ${i + 1}: ${v}
- Share stories that demonstrate ${v.toLowerCase()} in action
- Behind-the-scenes content showing ${v.toLowerCase()} as a brand practice
- Customer testimonials that highlight ${v.toLowerCase()}`).join("\n\n")
  : `### Pillar 1: Brand Story
- Share the origin and mission of ${name}
- Behind-the-scenes content

### Pillar 2: Product/Service Showcase
- Highlight key offerings with beautiful visuals
- Use the brand's ${aesthetic || "distinctive"} aesthetic

### Pillar 3: Community & Values
- Engage with audience around shared values
- User-generated content and testimonials`}

## Priority Platforms

### 1. Instagram
- Best for: ${aesthetic || "Visual"} brand storytelling using the brand's ${colors[0]?.name || "primary"} color palette
- Content: Product photos, brand lifestyle shots, carousels with brand values
- Frequency: 4-5 posts per week + daily Stories

### 2. LinkedIn
- Best for: B2B reach and brand authority
- Content: Brand story, values-driven posts, industry insights
- Frequency: 3-4 posts per week

### 3. Facebook
- Best for: Community building and broad audience reach
- Content: Long-form posts, videos, events
- Frequency: 3-4 posts per week

### 4. TikTok / Reels
- Best for: Reaching younger demographics with authentic content
- Content: Behind-the-scenes, process videos, trending formats
- Frequency: 3-5 short videos per week

## Visual Guidelines for Social
- **Primary Color:** ${colors[0]?.hex || "#333333"} — use for CTAs and highlights
- **Secondary Color:** ${colors[1]?.hex || "#666666"} — backgrounds and accents
- **Heading Font:** ${fonts[0]?.family || "Inter"} — for overlay text
- **Style:** ${aesthetic || "Clean, modern, consistent across all platforms"}

## Posting Cadence

| Platform | Posts/Week | Best Times |
|----------|------------|------------|
| Instagram | 4-5 | Tue-Fri 11am-1pm |
| LinkedIn | 3-4 | Tue-Thu 8-10am |
| Facebook | 3-4 | Wed-Fri 1-3pm |
| TikTok | 3-5 | Daily 7-9pm |

## Quick Wins (Next 30 Days)
1. **Brand kit post** — Announce brand colors, fonts, and values to build recognition
2. **Origin story** — Share the ${name} story in a carousel or video
3. **Value series** — One post per brand value (${values.slice(0, 3).join(", ") || "quality, trust, innovation"})
4. **Visual consistency** — Update all profile photos, bios, and covers with brand colors
5. **Hashtag strategy** — Build a branded hashtag around ${name.toLowerCase().replace(/\s+/g, "")}
6. **Collab content** — Partner with accounts that share ${values[0] || "similar"} values
7. **UGC campaign** — Encourage customers to share content featuring the brand`;

  return { businessProfile, marketResearch, socialStrategy };
}

export async function POST(req: Request) {
  try {
    const { businessId, docType } = await req.json();

    if (!businessId || !docType || !VALID_DOCS.includes(docType)) {
      return NextResponse.json({ error: "businessId and valid docType required" }, { status: 400 });
    }

    const business = localDb.get(businessId);
    if (!business) {
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
Existing Strategy: ${(business.social_strategy || "").slice(0, 400)}
Existing Research: ${(business.market_research || "").slice(0, 400)}
Existing Profile: ${(business.business_profile || "").slice(0, 400)}
`.trim();

    const PROMPTS: Record<DocType, { taskType: string; prompt: string }> = {
      businessProfile: {
        taskType: "business-profile",
        prompt: `You are a senior brand analyst. Write a highly professional Business Profile document in markdown for ${brandName}.

BRAND DATA:
${brandContext}

Write the Business Profile. Format it exactly like this structure:
# ${brandName} – Business Profile

## Overview
A detailed paragraph explaining what the business does, who founded it (founder story), and their market positioning (e.g. bridging heritage with modern trends).

## Products
- **[Product Name]** – short description or flavor profile.

## Key Selling Points
- Provide 5-8 bullet points of the most compelling reasons to choose this brand (e.g. nutrition facts, ingredients, uses).

## Retail Presence
Where products are sold — simply list retailers, websites, or physical locations.

## Target Audience
5 demographic or psychographic bullet points (e.g. Health-conscious UK consumers, Flexitarians).

## Founder Story
A short paragraph about the founders' background, heritage, and why they built the company.

## Marketing Goals
- Social media growth and engagement
- Brand awareness
- [add any other inferred goals]

## Website
${url}

Rules:
1. Only facts from brand data.
2. DO NOT use markdown tables; use bulleted lists instead.
3. Use ## headers, - bullets.
4. ANTIGRAVITY TEXT PROCESSOR STRICT RULES: Clean text, clear hierarchy, structured format. NO placeholders (e.g., {{title}}, lorem ipsum). Human-readable, polished formatting ready to publish. No unnecessary symbols or encoding issues.`,
      },
      marketResearch: {
        taskType: "market-research",
        prompt: `You are a senior market researcher. Write a highly professional Market Research document in markdown for ${brandName}.

BRAND DATA:
${brandContext}

Write the Market Research exactly like this structure:
# ${brandName} – Market Research

## Market Opportunity
4-5 bullet points on the market they operate in, growth indicators, and macro trends.

## Trend Tailwinds
3-4 bullet points on specific consumer trends driving this industry right now.

## Competitive Landscape
List real named competitor companies. 
- **[Competitor Name]** – 1 line on what they do and how they compare.
- **[Competitor Name]** – ...

## Key Risk
1-2 bullet points on vulnerabilities (e.g. market education needed, algorithm changes).

## Social Platform Data (2025)
- TikTok brand follower growth potential
- Instagram organic reach trends
- LinkedIn B2B growth
- Best-performing content types

## Target Audiences on Social
4-5 distinct audience segments. Format:
- **[Segment Name]** – what they respond to / how to frame the product.

Rules:
1. Real named competitors only.
2. DO NOT use markdown tables; use bulleted lists instead.
3. ANTIGRAVITY TEXT PROCESSOR STRICT RULES: Clean text, clear hierarchy, structured format. NO placeholders (e.g., {{title}}, lorem ipsum). Human-readable, polished formatting ready to publish. No unnecessary symbols or encoding issues.`,
      },
      socialStrategy: {
        taskType: "social-strategy",
        prompt: `You are a senior social media strategist. Write a highly professional Social Media Strategy document in markdown for ${brandName}.

BRAND DATA:
${brandContext}

Write the Social Media Strategy exactly like this structure:
# ${brandName} – Social Media Strategy

## Priority Platforms (Ranked)
- **[Platform 1]** – why it's a priority and content format.
- **[Platform 2]** – ...

## Content Pillars (use across all platforms)
1. **[Pillar 1 Name]** (e.g. Product Proof)
Provide 3-4 bullet points of example post ideas under this pillar.
2. **[Pillar 2 Name]** (e.g. Founder Story)
Provide 3-4 bullet points...
(Include 4-5 pillars total)

## Posting Cadence (Recommended)
Use bullet points to list recommended posting frequency and priority format per platform (e.g. TikTok: 4-5x per week... Instagram: 4x per week).

## Messaging Hierarchy
4 core messages ranked by priority:
- "Lead hook / Main claim" — lead hook
- "Secondary claim" — secondary hook
- "Validation" — proof via reviews or demos
- "Trust factor" — trust + authenticity

## Quick Wins
5-6 bullet points of immediate, easily actionable tactics for the next 30 days (e.g. pin a video, repurpose reviews, get founder on camera).

Rules:
1. Specific to ${brandName}'s industry and tone.
2. DO NOT use markdown tables; use bulleted lists.`,
      },
    };

    const { taskType, prompt: docPrompt } = PROMPTS[docType as DocType];

    // Try Gemini with smart model routing; fall back to template on failure
    let content = "";
    try {
      const result = await callGemini({
        taskType,
        prompt: docPrompt,
        minLength: 200,
      });
      content = result.text;
      console.log(`[regenerate-doc] ✅ ${docType} via ${result.model} (${content.length} chars)`);
    } catch (err: any) {
      console.log(`[regenerate-doc] Gemini failed — using knowledge base template for ${docType}:`, err.message);
    }

    // Always fall back to template if Gemini didn't produce content
    if (!content) {
      const templates = buildTemplateDocs(business);
      content = templates[docType as DocType];
    }

    // Save to LocalDb
    const { error: saveError } = localDb.update(businessId, { [DB_FIELD[docType as DocType]]: content });

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
