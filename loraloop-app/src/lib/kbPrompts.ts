/**
 * Knowledge Base prompt library.
 *
 * Shared by:
 *   - /api/extract-dna   (initial pipeline — fills docs right after scrape)
 *   - /api/regenerate-doc (manual regenerate / auto-fill on /board open)
 *
 * These prompts produce RICH, table-heavy markdown — the LLM enriches scraped
 * data with real-world knowledge (named competitors, persona matrices, keyword
 * tables, KPIs, hooks). They intentionally go beyond what's literally on the
 * website so the AI marketing agents downstream have something to work with.
 */

export type KbDocType =
  | "businessProfile"
  | "marketResearch"
  | "socialStrategy"
  | "growthGoals";

export const KB_DOC_TYPES: KbDocType[] = [
  "businessProfile",
  "marketResearch",
  "socialStrategy",
  "growthGoals",
];

export const KB_DB_FIELD: Record<KbDocType, string> = {
  businessProfile: "business_profile",
  marketResearch: "market_research",
  socialStrategy: "social_strategy",
  growthGoals: "growth_goals",
};

export const KB_TASK_TYPE: Record<KbDocType, string> = {
  businessProfile: "business-profile",
  marketResearch: "market-research",
  socialStrategy: "social-strategy",
  growthGoals: "business-profile", // reuse strong writer model
};

export interface BrandContext {
  brandName: string;
  website: string;
  industry?: string;
  overview?: string;
  tagline?: string;
  brandValues?: string;
  brandAesthetic?: string;
  toneOfVoice?: string;
  colors?: string;
  fonts?: string;
  scrapedText?: string;
  existingProfile?: string;
  existingResearch?: string;
  existingStrategy?: string;
  existingGoals?: string;
}

function header(ctx: BrandContext): string {
  return `
BRAND CONTEXT
=============
Name:          ${ctx.brandName}
Website:       ${ctx.website}
Industry:      ${ctx.industry || "(infer from website)"}
Overview:      ${ctx.overview || "(infer)"}
Tagline:       ${ctx.tagline || "(infer)"}
Values:        ${ctx.brandValues || "(infer)"}
Aesthetic:     ${ctx.brandAesthetic || "(infer)"}
Tone of voice: ${ctx.toneOfVoice || "(infer)"}
Colors:        ${ctx.colors || "(n/a)"}
Fonts:         ${ctx.fonts || "(n/a)"}

WEBSITE TEXT (truncated)
========================
${(ctx.scrapedText || "").slice(0, 4500)}
`.trim();
}

const GLOBAL_RULES = `
GLOBAL OUTPUT RULES
- Output clean GitHub-flavored Markdown ONLY. No preamble, no "Here is..." prefix.
- Use H1 once for the title, H2 for sections, H3 for sub-sections.
- Use proper Markdown tables wherever data has 2+ comparable attributes. Many tables is good.
- Anchor everything in the brand context. Where the website is silent, INFER plausibly
  using real industry knowledge — name real companies, real platforms, real keywords.
  Do NOT write "Not found on website" or "TBD" — fill every field.
- Be specific. Numbers, percentages, dates, real names. No buzzword soup.
- Tone: confident, modern, practical, slightly bold. Short sentences.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// 1. Business Profile
// ─────────────────────────────────────────────────────────────────────────────
function businessProfilePrompt(ctx: BrandContext): string {
  return `You are a senior brand strategist. Produce the BUSINESS PROFILE document for the brand below.

${header(ctx)}

${GLOBAL_RULES}

STRUCTURE (use these exact H2 sections):

# ${ctx.brandName} – Business Profile

## Brand Overview
2-3 paragraphs covering: what the brand does, mission, founding story (infer if absent),
market positioning, business model (DTC, SaaS, marketplace, service, etc.). Then a
quick-fact table:

| Attribute      | Value |
|----------------|-------|
| Brand name     | …     |
| Website        | …     |
| Industry       | …     |
| Business model | …     |
| HQ / Market    | …     |
| Founded        | …     |
| Stage          | …     |

## Products & Services
A table of every product/service mentioned (or inferred from category):

| Product / Service | Category | Description | Price Range | Best-Seller? |
|-------------------|----------|-------------|-------------|--------------|

Below the table: 1 short paragraph on the lineup direction.

## Key Selling Points
6-10 bullets of specific, defensible reasons to choose this brand. Each bullet is
one tight sentence. Follow with a **Proof Points** table:

| Proof Type   | Detail |
|--------------|--------|
| Reviews      | …      |
| Awards       | …      |
| Certifications | …    |
| Case studies | …      |
| Guarantees   | …      |

## Target Audience
A 3-persona ICP matrix (use realistic names + descriptors):

| Persona | Age | Role / Lifestyle | Pain Point | Buying Trigger | Objection | Where They Hang Out |
|---------|-----|------------------|------------|----------------|-----------|---------------------|

Below it, a short paragraph on the primary vs secondary audience.

## Brand Voice
A do/don't table:

| Use            | Avoid          |
|----------------|----------------|
| (word/phrase)  | (word/phrase)  |

Then 3 example captions (good) and 2 example captions (off-brand) as bullets.

## Brand Visual Identity
A table:

| Element     | Specification |
|-------------|---------------|
| Primary colors  | …         |
| Secondary palette | …       |
| Heading typography | …      |
| Body typography | …         |
| Photography style | …       |
| Iconography | …             |
| Logo usage rules | …        |

## Brand Rules & Guardrails
A guardrail table:

| Category       | Rule | Reason |
|----------------|------|--------|
| Claims         | …    | …      |
| Legal          | …    | …      |
| Restricted words | … | …      |
| Discount rules | …    | …      |
| Sensitive topics | … | …      |
| Competitor mentions | … | …   |

Min 800 words across the document.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Market Research
// ─────────────────────────────────────────────────────────────────────────────
function marketResearchPrompt(ctx: BrandContext): string {
  return `You are a senior market researcher. Produce the MARKET RESEARCH document for the brand below.

${header(ctx)}

${GLOBAL_RULES}

STRUCTURE (use these exact H2 sections):

# ${ctx.brandName} – Market Research

## Market Opportunity
A snapshot table:

| Metric | Value |
|--------|-------|
| Market size (TAM estimate) | … |
| Growth rate | … |
| Trend tailwinds | … |
| Seasonality | … |
| Top customer problems | … |

Follow with one short paragraph on why now is a good moment for ${ctx.brandName}.

## Competitive Landscape
A competitor matrix with 8-10 REAL named companies in this space:

| Competitor | Positioning | Price Tier | Strengths | Weaknesses | Their Best Content Angle | What We Do Better |
|------------|-------------|------------|-----------|------------|--------------------------|-------------------|

## Audience Research
A 3-segment table (different from the Business Profile personas — these are
behaviour-driven segments):

| Segment | Behaviour Signal | Communities They Follow | Influencers | Desired Outcome | Emotional Trigger |
|---------|------------------|--------------------------|-------------|-----------------|--------------------|

## SEO Keywords
A 15-row keyword table:

| Keyword | Intent | Search Volume (est.) | Difficulty | Why it matters |
|---------|--------|----------------------|------------|----------------|

Mix primary, long-tail, problem-aware, comparison ("X vs Y"), and local keywords.

## GEO / AI-Search Queries
A 10-row table of queries customers type into ChatGPT / Gemini / Perplexity /
Claude:

| AI Query | Intent | Surface | Why ${ctx.brandName} should rank |
|----------|--------|---------|-----------------------------------|

Mix "best X for Y", "alternative to Z", "X vs Y", "how to choose X", entity queries.

## Positioning Gap
3 paragraphs or a short table:

| Dimension | What Competitors Say | What Customers Are Tired Of | What ${ctx.brandName} Can Own |
|-----------|----------------------|------------------------------|-------------------------------|

Min 900 words across the document.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Social Strategy
// ─────────────────────────────────────────────────────────────────────────────
function socialStrategyPrompt(ctx: BrandContext): string {
  return `You are a senior social media strategist. Produce the SOCIAL STRATEGY document for the brand below.

${header(ctx)}

${GLOBAL_RULES}

STRUCTURE (use these exact H2 sections):

# ${ctx.brandName} – Social Strategy

## Priority Platforms
A platform priority table (only include platforms that genuinely fit this brand):

| Platform | Priority | Primary Goal | Audience | Content Format | Posting Frequency |
|----------|----------|--------------|----------|----------------|--------------------|

Below the table: 1 paragraph rationale for the top 2 platforms.

## Content Pillars
A 5-7 row pillar matrix:

| Pillar | Purpose | Example Topics | Example Hook | Best Platform | Best Format | CTA Style |
|--------|---------|----------------|--------------|----------------|-------------|-----------|

## Posting Cadence
A cadence table:

| Content Type | Frequency | Platform(s) | Owner |
|--------------|-----------|-------------|-------|

## Content Hook Library
A 10-row hook table the AI can reuse:

| Hook Type | Template | Example for ${ctx.brandName} |
|-----------|----------|-------------------------------|

Cover: problem, mistake, before/after, founder, comparison, myth, pain-point,
curiosity, offer, social proof.

## Quick Wins (Next 30 Days)
A table of 6-8 low-effort, high-impact ideas:

| Idea | Effort | Platform | Expected Outcome | Source / Reusable Asset |
|------|--------|----------|-------------------|--------------------------|

## Campaign Roadmap
A 4-5 row campaign roadmap for Q2–Q3 2026:

| Campaign Name | Goal | Audience | Hero Message | Offer / CTA | Platforms | Duration | Success Metric |
|---------------|------|----------|--------------|-------------|-----------|----------|----------------|

## Content Rules
A do/don't table:

| Element | Do | Don't |
|---------|----|----|

Cover: caption style, hashtag style, CTA style, visual direction, emoji usage.

Min 900 words across the document.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Growth Goals & Execution Rules
// ─────────────────────────────────────────────────────────────────────────────
function growthGoalsPrompt(ctx: BrandContext): string {
  return `You are a senior growth lead. Produce the GROWTH GOALS & EXECUTION RULES document for the brand below.

${header(ctx)}

${GLOBAL_RULES}

STRUCTURE (use these exact H2 sections):

# ${ctx.brandName} – Growth Goals & Execution Rules

## Business Goals
A goal table covering 3 timeframes:

| Timeframe       | Primary Goal | Secondary Goal | KPI Target |
|-----------------|--------------|----------------|------------|
| This month      | …            | …              | …          |
| This quarter    | …            | …              | …          |
| Next 6 months   | …            | …              | …          |

## Current Offers
A 3-5 row table of active or recommended offers:

| Offer | Type | Audience | CTA | Urgency | Channel |
|-------|------|----------|-----|---------|---------|

## Funnel Stages & Content Map
A funnel → content matrix:

| Funnel Stage  | Customer Mindset | Content Type | Channel | Asset Example | KPI |
|---------------|-------------------|--------------|---------|----------------|-----|

Cover Awareness → Interest → Consideration → Conversion → Retention.

## Approval Matrix
A 5-7 row approval table:

| Task | AI Can Draft | AI Can Publish | Approver | Approval SLA |
|------|--------------|----------------|----------|--------------|

## Brand Guardrails
A guardrail table:

| Category | Rule | Severity | Reason |
|----------|------|----------|--------|

Cover: legal claims, medical/financial promises, competitor mentions, sensitive
topics, false scarcity, AI disclosure.

## KPI Scorecard
A 10-row KPI table:

| KPI | Definition | Target | Floor | Owner | Reporting Cadence |
|-----|------------|--------|-------|-------|--------------------|

Cover: engagement rate, CTR, conversion rate, CPL, CAC, follower growth, traffic,
demo bookings, email open rate, revenue.

## Current Priorities
A ranked 5-row priority table:

| Rank | Priority | Why It Matters | Owner | Status |
|------|----------|----------------|-------|--------|

Min 700 words across the document.`;
}

export function buildKbPrompt(docType: KbDocType, ctx: BrandContext): string {
  switch (docType) {
    case "businessProfile": return businessProfilePrompt(ctx);
    case "marketResearch":  return marketResearchPrompt(ctx);
    case "socialStrategy":  return socialStrategyPrompt(ctx);
    case "growthGoals":     return growthGoalsPrompt(ctx);
  }
}
