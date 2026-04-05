"""
Nova Agent — Modular Prompt Templates
One template per content format. Each template enforces structure, not just suggests it.
Brand guidelines are injected at render time.
"""

from __future__ import annotations
from nova.models import BrandGuidelines, ContentFormat


# ---------------------------------------------------------------------------
# Brand context block (shared across all templates)
# ---------------------------------------------------------------------------

def _brand_block(brand: BrandGuidelines) -> str:
    parts = [
        f"Language: {brand.language}",
        f"Tone: {brand.tone}",
    ]
    if brand.brand_name:
        parts.append(f"Brand: {brand.brand_name}")
    if brand.brand_description:
        parts.append(f"Brand description: {brand.brand_description}")
    if brand.audience_age_range or brand.audience_gender or brand.audience_location:
        audience_parts = []
        if brand.audience_age_range:
            audience_parts.append(f"age {brand.audience_age_range}")
        if brand.audience_gender:
            audience_parts.append(brand.audience_gender)
        if brand.audience_location:
            audience_parts.append(brand.audience_location)
        parts.append(f"Target audience: {', '.join(audience_parts)}")
    if brand.avoid_words:
        parts.append(f"NEVER use these words or phrases: {', '.join(brand.avoid_words)}")
    if brand.style_rules:
        for rule in brand.style_rules:
            parts.append(f"Style rule: {rule}")
    if brand.cta_default:
        parts.append(f"Default CTA: {brand.cta_default}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Quality rules block (shared)
# ---------------------------------------------------------------------------

_QUALITY_RULES = """
OUTPUT QUALITY RULES (non-negotiable):
- NEVER use generic openers: "In today's world", "Are you looking for", "In this fast-paced world", "Have you ever wondered"
- First line / first slide MUST have a strong, specific hook
- Every CTA must be concrete and action-oriented
- Write like a human expert, not a content mill
- No fluff, no filler sentences
""".strip()


# ---------------------------------------------------------------------------
# System prompt for Nova
# ---------------------------------------------------------------------------

NOVA_SYSTEM_PROMPT = """You are Nova, an elite AI content creator agent for Loraloop.
Your purpose is to generate one high-quality content asset per request.
You focus on depth, structure, and brand alignment.
No bulk generation, no variants — one excellent output at a time.
Always follow the exact output format requested."""


# ---------------------------------------------------------------------------
# Format-specific prompt templates
# ---------------------------------------------------------------------------

def instagram_image_prompt(topic: str, brand: BrandGuidelines, extra_context: str = "") -> str:
    extra = f"\nExtra context: {extra_context}" if extra_context else ""
    return f"""Create an Instagram Image post for the following topic.

TOPIC: {topic}{extra}

BRAND GUIDELINES:
{_brand_block(brand)}

{_QUALITY_RULES}

OUTPUT FORMAT — respond with exactly this JSON structure:
{{
  "caption": "<hook-first caption, 150-300 chars, platform-optimised, includes emoji>",
  "visual_concept": "<detailed description for image generation: composition, colors, mood, key visual elements, style — 2-4 sentences>",
  "hashtags": ["<tag1>", "<tag2>", ..., "<tag10>"]
}}

Rules for this format:
- Caption hook must be the very first sentence — make it scroll-stopping
- Visual concept must be specific enough for an AI image generator
- Hashtags: mix of niche (3-4), mid-tier (4-5), and broad (2-3)
- Do NOT include hashtags inside the caption text"""


def instagram_carousel_prompt(topic: str, brand: BrandGuidelines, extra_context: str = "") -> str:
    extra = f"\nExtra context: {extra_context}" if extra_context else ""
    return f"""Create an Instagram Carousel post for the following topic.

TOPIC: {topic}{extra}

BRAND GUIDELINES:
{_brand_block(brand)}

{_QUALITY_RULES}

OUTPUT FORMAT — respond with exactly this JSON structure:
{{
  "slides": [
    {{
      "slide_number": 1,
      "heading": "<hook headline — bold claim or curiosity gap>",
      "body": "<1-2 lines max — intrigue, not explanation>",
      "is_hook": true,
      "is_cta": false
    }},
    {{
      "slide_number": 2,
      "heading": "<value point 1>",
      "body": "<concrete explanation, 2-3 lines>",
      "is_hook": false,
      "is_cta": false
    }},
    ... (slides 3 and 4 follow same structure as slide 2) ...,
    {{
      "slide_number": 5,
      "heading": "<CTA headline>",
      "body": "<clear next step for the reader>",
      "is_hook": false,
      "is_cta": true
    }}
  ],
  "cover_caption": "<caption for the post, hook-first, 100-200 chars>",
  "hashtags": ["<tag1>", ..., "<tag10>"]
}}

Rules for this format:
- Slide 1: Hook — bold claim, shocking stat, or curiosity gap. No explanations yet.
- Slides 2-4: One clear value point each. Short sentences. Easy to scan.
- Final slide: Strong CTA tied to the topic. One action only.
- Each slide heading ≤ 8 words
- Each slide body ≤ 40 words"""


def blog_prompt(topic: str, brand: BrandGuidelines, extra_context: str = "") -> str:
    extra = f"\nExtra context: {extra_context}" if extra_context else ""
    return f"""Create a short-form blog post for the following topic.

TOPIC: {topic}{extra}

BRAND GUIDELINES:
{_brand_block(brand)}

{_QUALITY_RULES}

OUTPUT FORMAT — respond with exactly this JSON structure:
{{
  "title": "<compelling title, 8-12 words>",
  "sections": [
    {{
      "heading": "<H2 section heading>",
      "body": "<section content, 80-150 words>"
    }},
    ...
  ],
  "image_prompt": "<AI image generation prompt for a relevant hero image: specific scene/composition, style, colors, mood — incorporates brand tone and topic context>",
  "word_count_estimate": <integer>
}}

Rules for this format:
- 3-5 H2 sections (no full SEO article — focused and readable)
- Total body: 400-700 words
- First section must hook the reader immediately — no "In this article..."
- Each section heading must be informative, not generic
- image_prompt must reflect both the topic and the brand DNA
- End with a clear takeaway or next-step section"""


def email_prompt(topic: str, brand: BrandGuidelines, extra_context: str = "") -> str:
    extra = f"\nExtra context: {extra_context}" if extra_context else ""
    return f"""Create a marketing email for the following topic.

TOPIC: {topic}{extra}

BRAND GUIDELINES:
{_brand_block(brand)}

{_QUALITY_RULES}

OUTPUT FORMAT — respond with exactly this JSON structure:
{{
  "subject_line": "<subject line, 40-60 chars, curiosity or benefit-driven>",
  "preview_text": "<preview/preheader text, 80-100 chars, complements subject>",
  "body_sections": [
    {{
      "heading": null,
      "body": "<opening paragraph — hook, 2-3 lines, personal and direct>"
    }},
    {{
      "heading": "<optional section heading>",
      "body": "<section body, 60-100 words>"
    }},
    ...
  ],
  "cta_text": "<CTA button text, 3-6 words, action verb first>",
  "cta_url_placeholder": "[CTA_URL]"
}}

Rules for this format:
- Subject line: no emoji spam, no ALL CAPS, no "RE:" tricks — benefit-first or curiosity
- Opening paragraph: speak to the reader directly, no "Dear [Name]" formality
- 3-4 body sections max — scannable, not a wall of text
- One CTA only — conversion-focused
- End before the CTA with a sentence that makes clicking feel natural"""


# ---------------------------------------------------------------------------
# Regeneration prompt templates
# ---------------------------------------------------------------------------

def improve_prompt(original_content: str, format_name: str, brand: BrandGuidelines) -> str:
    return f"""You are Nova, an elite content creator. Improve the following {format_name} content.

BRAND GUIDELINES:
{_brand_block(brand)}

{_QUALITY_RULES}

ORIGINAL CONTENT:
{original_content}

TASK: Enhance the overall quality. Make it more compelling, specific, and brand-aligned.
Keep the same JSON structure as the original. Return ONLY the improved JSON."""


def rewrite_hook_prompt(original_content: str, format_name: str, brand: BrandGuidelines) -> str:
    return f"""You are Nova, an elite content creator. Rewrite ONLY the hook/opening of this {format_name} content.

BRAND GUIDELINES:
{_brand_block(brand)}

{_QUALITY_RULES}

ORIGINAL CONTENT:
{original_content}

TASK: Rewrite only the first line/slide/subject — the hook. Keep everything else identical.
Return the COMPLETE content with the new hook in the same JSON structure."""


def adjust_tone_prompt(
    original_content: str,
    format_name: str,
    brand: BrandGuidelines,
    new_tone: str
) -> str:
    return f"""You are Nova, an elite content creator. Adjust the tone of this {format_name} content.

BRAND GUIDELINES:
{_brand_block(brand)}

ORIGINAL CONTENT:
{original_content}

TASK: Shift the voice to be more "{new_tone}". Do NOT change the substance, facts, or structure.
Keep the same JSON structure. Return ONLY the tone-adjusted JSON."""


# ---------------------------------------------------------------------------
# Template dispatcher
# ---------------------------------------------------------------------------

def get_creation_prompt(
    format: ContentFormat,
    topic: str,
    brand: BrandGuidelines,
    extra_context: str = ""
) -> str:
    dispatch = {
        ContentFormat.INSTAGRAM_IMAGE:    instagram_image_prompt,
        ContentFormat.INSTAGRAM_CAROUSEL: instagram_carousel_prompt,
        ContentFormat.BLOG:               blog_prompt,
        ContentFormat.EMAIL:              email_prompt,
    }
    fn = dispatch.get(format)
    if not fn:
        raise ValueError(f"No prompt template for format: {format}")
    return fn(topic, brand, extra_context)
