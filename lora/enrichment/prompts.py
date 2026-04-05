"""
Loraloop — AI Enrichment Layer
Gemini prompts for each enrichment step.
All prompts return pure JSON — no markdown, no preamble.
"""

SYSTEM_PROMPT = """You are an expert brand strategist and business intelligence analyst.
You analyze website content to extract precise, actionable brand intelligence.
You are specific, never generic — you extract what makes THIS business unique.
Respond with valid JSON only. No markdown fences, no explanation text."""


# ── Step 1: Core business identity & brand values ──────────────────────────────

BRAND_CORE_PROMPT = """\
Analyze this website and extract the core business identity.

URL: {url}
SITE TYPE: {site_type}
PAGES CRAWLED: {pages_crawled}

FULL PAGE CONTENT:
{text_content}

HEADINGS FOUND:
{headings}

META DESCRIPTIONS:
{meta_descriptions}

Return EXACTLY this JSON (no other text):
{{
  "business_name": "<exact brand/company name>",
  "tagline": "<their headline tagline or value prop line, null if absent>",
  "business_overview": "<50-100 word paragraph: what they do, who for, why it matters>",
  "elevator_pitch": "<one punchy sentence capturing the business value>",
  "value_proposition": "<core promise — what outcome/transformation do customers get?>",
  "unique_selling_points": [
    "<USP 1 — specific to this business>",
    "<USP 2>",
    "<USP 3>"
  ],
  "brand_values": [
    "<value 1 inferred from content & tone>",
    "<value 2>",
    "<value 3>",
    "<value 4>"
  ],
  "mission_statement": "<their stated mission if explicitly present, else null>",
  "business_location": "<city, country if identifiable, else null>",
  "founding_story": "<brief founding context if present on site, else null>",
  "industry": "<precise industry vertical — not just 'technology'>",
  "market_segment": "<B2B | B2C | B2B2C | marketplace | platform>",
  "business_model": "<SaaS | e-commerce | agency | consulting | media | marketplace | product | service | other>"
}}"""


# ── Step 2: Brand voice & tone analysis ───────────────────────────────────────

BRAND_VOICE_PROMPT = """\
Analyze the brand voice and communication style from this website.

BUSINESS: {business_name}
INDUSTRY: {industry}

WEBSITE COPY (headlines, body text, CTAs):
{text_content}

HEADINGS & KEY PHRASES:
{headings}

Return EXACTLY this JSON:
{{
  "formality_level": "<professional | casual | playful | friendly | authoritative | technical>",
  "communication_style": "<e.g. 'direct and confident', 'warm storytelling', 'data-driven and precise'>",
  "tone_descriptors": ["<word 1>", "<word 2>", "<word 3>", "<word 4>", "<word 5>"],
  "key_messaging_themes": [
    "<theme they repeat most — e.g. 'speed and efficiency'>",
    "<theme 2>",
    "<theme 3>"
  ],
  "brand_personality_dimensions": [
    "<dimension e.g. 'Competent — expertise-forward messaging'>",
    "<dimension 2>",
    "<dimension 3>"
  ],
  "brand_aesthetic": "<one sentence describing the overall visual and editorial aesthetic>"
}}"""


# ── Step 3: Target audience classification ────────────────────────────────────

TARGET_AUDIENCE_PROMPT = """\
Infer the target audience for this business from their website content and positioning.

BUSINESS: {business_name}
INDUSTRY: {industry}
BUSINESS MODEL: {business_model}
VALUE PROPOSITION: {value_proposition}

WEBSITE CONTENT:
{text_content}

Return EXACTLY this JSON:
{{
  "primary_segments": [
    "<segment 1 — specific, not just 'small businesses'>",
    "<segment 2>",
    "<segment 3>"
  ],
  "buyer_personas": [
    {{
      "name": "<persona label e.g. 'The Scaling Founder'>",
      "role": "<specific job title or role>",
      "age_range": "<e.g. 28-42>",
      "pain_points": ["<pain 1 — emotional, not just functional>", "<pain 2>"],
      "goals": ["<goal 1 — outcome-focused>", "<goal 2>"],
      "buying_trigger": "<situation that makes them act NOW>"
    }},
    {{
      "name": "<persona 2>",
      "role": "<role>",
      "age_range": "<range>",
      "pain_points": ["<pain>"],
      "goals": ["<goal>"],
      "buying_trigger": "<trigger>"
    }}
  ],
  "demographics": {{
    "age_range": "<primary age range>",
    "geography": "<primary markets>",
    "company_size": "<if B2B: e.g. '10-200 employees', else 'N/A'>"
  }},
  "psychographics": [
    "<psychographic trait 1 — values, lifestyle>",
    "<trait 2>",
    "<trait 3>"
  ],
  "audience_pain_points": [
    "<pain 1 — the deeper emotional frustration>",
    "<pain 2>",
    "<pain 3>",
    "<pain 4>"
  ],
  "audience_needs": [
    "<need 1 — what they are looking for>",
    "<need 2>",
    "<need 3>"
  ]
}}"""


# ── Step 4: Competitive landscape mapping ─────────────────────────────────────

COMPETITIVE_LANDSCAPE_PROMPT = """\
Map the competitive landscape for this business. Use your training knowledge about this industry.

BUSINESS: {business_name}
INDUSTRY: {industry}
VALUE PROPOSITION: {value_proposition}
MARKET SEGMENT: {market_segment}

WEBSITE CONTENT (for context):
{text_content}

Return EXACTLY this JSON with 5-10 real competitors:
{{
  "competitors": [
    {{
      "name": "<competitor name>",
      "website": "<URL if known, else null>",
      "positioning": "<their core positioning in one sentence>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "weaknesses": ["<weakness 1>", "<weakness 2>"]
    }}
  ],
  "market_gaps": [
    "<gap 1: what the whole market misses that this business could own>",
    "<gap 2>",
    "<gap 3>"
  ],
  "competitive_advantages": [
    "<advantage 1: what makes this business harder to replace>",
    "<advantage 2>",
    "<advantage 3>"
  ],
  "competitive_positioning": "<how this business sits vs competitors — one sentence>"
}}"""


# ── Step 5: Brand descriptors & visual identity ───────────────────────────────

BRAND_DESCRIPTORS_PROMPT = """\
Generate brand descriptors and summarize the visual identity for this business.

BUSINESS: {business_name}
INDUSTRY: {industry}
BRAND VOICE: {tone_descriptors}

VISUAL ELEMENTS DETECTED FROM SITE:
- Primary color: {primary_color}
- Secondary colors: {secondary_colors}
- Fonts detected: {fonts}
- Logo found: {logo_found}
- Visual style hints: {visual_hints}

WEBSITE CONTENT:
{text_content}

Return EXACTLY this JSON:
{{
  "visual_aesthetics": [
    "<descriptor 1 e.g. 'clean and spacious layout'>",
    "<descriptor 2 e.g. 'bold typographic hierarchy'>",
    "<descriptor 3>",
    "<descriptor 4>",
    "<descriptor 5>"
  ],
  "brand_personality_keywords": [
    "<keyword 1>", "<keyword 2>", "<keyword 3>",
    "<keyword 4>", "<keyword 5>", "<keyword 6>"
  ],
  "brand_archetype": "<exactly one of: Hero | Sage | Rebel | Creator | Explorer | Innocent | Ruler | Caregiver | Jester | Lover | Everyman | Magician>",
  "emotional_associations": [
    "<emotion/feeling the brand evokes e.g. 'confidence'>",
    "<association 2>",
    "<association 3>",
    "<association 4>"
  ]
}}"""
