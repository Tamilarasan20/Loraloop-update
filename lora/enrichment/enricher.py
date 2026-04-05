"""
Loraloop — AI Enrichment Layer
Transforms raw scraped website data into a rich, structured Business Profile
using multi-step Gemini processing.

Enrichment Pipeline:
  Step 1 (0–20%)   Extract core business identity & brand values
  Step 2 (20–40%)  Analyse brand tone, voice & personality
  Step 3 (40–60%)  Classify target audience & buyer personas
  Step 4 (60–75%)  Map competitive landscape (top 5–10 competitors)
  Step 5 (75–90%)  Generate brand descriptors & visual guidelines
  Step 6 (90–100%) Assemble, score & return EnrichedBusinessProfile
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime

from google import genai
from google.genai import types

from lora.scraper.models import RawWebsiteData
from lora.enrichment.models import (
    EnrichedBusinessProfile,
    BrandVoiceProfile,
    TargetAudienceProfile,
    BuyerPersona,
    CompetitorInfo,
    BrandDescriptors,
    BrandGuidelines,
    ProgressCallback,
)
import lora.enrichment.prompts as P

_MODEL       = "gemini-2.5-flash"
_MAX_TOKENS  = 4096
_TEMPERATURE = 0.3


def _safe(text: str) -> str:
    """Escape curly braces in scraped text so str.format() doesn't choke."""
    return text.replace("{", "{{").replace("}", "}}")


def _parse_json(raw: str) -> dict:
    """Robustly extract JSON from LLM output, handling markdown and preamble."""
    if not raw:
        return {}
    # Strip markdown fences
    text = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1 or end <= 0:
        return {}
    candidate = text[start:end]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        # Try to recover by finding the largest valid JSON object
        for i in range(start, len(text)):
            if text[i] == "{":
                for j in range(len(text), i, -1):
                    if text[j - 1] == "}":
                        try:
                            return json.loads(text[i:j])
                        except json.JSONDecodeError:
                            continue
        return {}


def _emit(cb: ProgressCallback, step: str, pct: int) -> None:
    print(f"  [{pct:3d}%] {step}")
    if cb:
        cb(step, pct)


class BrandEnricher:
    """
    AI Enrichment Layer.

    Accepts raw website data from ScraperEngine and runs 5 sequential
    Gemini calls to produce a complete EnrichedBusinessProfile.

    Usage::

        enricher = BrandEnricher()
        profile  = enricher.enrich(raw_data, on_progress=my_callback)
        print(profile.model_dump_json(indent=2))
    """

    def __init__(self, api_key: str | None = None):
        self._client = genai.Client(
            api_key=api_key or os.environ.get("GOOGLE_API_KEY")
        )

    # ------------------------------------------------------------------ public

    def enrich(
        self,
        raw_data:    RawWebsiteData,
        on_progress: ProgressCallback = None,
    ) -> EnrichedBusinessProfile:
        """
        Run all enrichment steps and produce a complete Business Profile.

        Args:
            raw_data:    Output from ScraperEngine.scrape().
            on_progress: Optional callback(step_name, percent 0–100).

        Returns:
            EnrichedBusinessProfile — structured, AI-enriched brand data.
        """
        profile = EnrichedBusinessProfile(
            source_url=raw_data.url,
            enriched_at=datetime.utcnow(),
        )
        raw_outputs: dict[str, dict] = {}

        # Pre-compute shared inputs once
        text     = raw_data.full_text()
        headings = "\n".join(raw_data.all_headings())
        metas    = "\n".join(
            p.meta_description for p in raw_data.pages if p.meta_description
        )

        # ── Step 1: Core business identity ────────────────────────────
        _emit(on_progress, "Extracting business identity & brand values", 5)
        core = self._call(P.BRAND_CORE_PROMPT.format(
            url=raw_data.url,
            site_type=raw_data.site_type.value,
            pages_crawled=raw_data.pages_crawled,
            text_content=_safe(text[:6000]),
            headings=_safe(headings),
            meta_descriptions=_safe(metas),
        ))
        raw_outputs["core"] = core

        profile.business_name         = core.get("business_name", "")
        profile.tagline               = core.get("tagline")
        profile.business_overview     = core.get("business_overview", "")
        profile.elevator_pitch        = core.get("elevator_pitch", "")
        profile.value_proposition     = core.get("value_proposition", "")
        profile.unique_selling_points = core.get("unique_selling_points", [])
        profile.brand_values          = core.get("brand_values", [])
        profile.mission_statement     = core.get("mission_statement")
        profile.business_location     = core.get("business_location")
        profile.founding_story        = core.get("founding_story")
        profile.industry              = core.get("industry", "")
        profile.market_segment        = core.get("market_segment", "")
        profile.business_model        = core.get("business_model", "")

        _emit(on_progress, "Inferring brand positioning from content", 18)

        # ── Step 2: Brand voice & tone ─────────────────────────────────
        _emit(on_progress, "Analysing brand tone of voice & personality", 22)
        voice = self._call(P.BRAND_VOICE_PROMPT.format(
            business_name=profile.business_name or "Unknown",
            industry=profile.industry or "Unknown",
            text_content=_safe(text[:4000]),
            headings=_safe(headings),
        ))
        raw_outputs["voice"] = voice

        profile.brand_voice = BrandVoiceProfile(
            formality_level=voice.get("formality_level", ""),
            communication_style=voice.get("communication_style", ""),
            tone_descriptors=voice.get("tone_descriptors", []),
            key_messaging_themes=voice.get("key_messaging_themes", []),
            brand_personality_dimensions=voice.get("brand_personality_dimensions", []),
        )
        profile.brand_aesthetic = voice.get("brand_aesthetic", "")

        _emit(on_progress, "Identifying communication style patterns", 36)

        # ── Step 3: Target audience ────────────────────────────────────
        _emit(on_progress, "Classifying target audience & buyer personas", 42)
        audience = self._call(P.TARGET_AUDIENCE_PROMPT.format(
            business_name=profile.business_name or "Unknown",
            industry=profile.industry or "Unknown",
            business_model=profile.business_model or "Unknown",
            value_proposition=_safe(profile.value_proposition or "Unknown"),
            text_content=_safe(text[:4000]),
        ))
        raw_outputs["audience"] = audience

        personas = [
            BuyerPersona(
                name=p.get("name", ""),
                role=p.get("role", ""),
                age_range=p.get("age_range", ""),
                pain_points=p.get("pain_points", []),
                goals=p.get("goals", []),
                buying_trigger=p.get("buying_trigger", ""),
            )
            for p in audience.get("buyer_personas", [])
        ]
        profile.target_audience = TargetAudienceProfile(
            primary_segments=audience.get("primary_segments", []),
            buyer_personas=personas,
            demographics=audience.get("demographics", {}),
            psychographics=audience.get("psychographics", []),
            audience_pain_points=audience.get("audience_pain_points", []),
            audience_needs=audience.get("audience_needs", []),
        )

        _emit(on_progress, "Mapping audience pain points & needs", 56)

        # ── Step 4: Competitive landscape ─────────────────────────────
        _emit(on_progress, "Identifying top competitors & market gaps", 62)
        comp = self._call(P.COMPETITIVE_LANDSCAPE_PROMPT.format(
            business_name=profile.business_name or "Unknown",
            industry=profile.industry or "Unknown",
            value_proposition=_safe(profile.value_proposition or "Unknown"),
            market_segment=profile.market_segment or "Unknown",
            text_content=_safe(text[:3000]),
        ))
        raw_outputs["competitive"] = comp

        profile.competitors = [
            CompetitorInfo(
                name=c.get("name", ""),
                website=c.get("website"),
                positioning=c.get("positioning", ""),
                strengths=c.get("strengths", []),
                weaknesses=c.get("weaknesses", []),
            )
            for c in comp.get("competitors", [])[:10]
        ]
        profile.market_gaps            = comp.get("market_gaps", [])
        profile.competitive_advantages = comp.get("competitive_advantages", [])
        profile.competitive_positioning = comp.get("competitive_positioning", "")

        _emit(on_progress, "Analysing competitive advantages", 74)

        # ── Step 5: Brand descriptors & visual guidelines ──────────────
        _emit(on_progress, "Generating brand descriptors & visual guidelines", 78)
        va   = raw_data.visual_assets
        desc = self._call(P.BRAND_DESCRIPTORS_PROMPT.format(
            business_name=profile.business_name or "Unknown",
            industry=profile.industry or "Unknown",
            tone_descriptors=", ".join(profile.brand_voice.tone_descriptors) or "unknown",
            primary_color=va.colors.primary or "not detected",
            secondary_colors=", ".join(va.colors.secondary) or "not detected",
            fonts=", ".join(va.typography.all_fonts) or "not detected",
            logo_found="yes" if va.logo_url else "no",
            visual_hints=", ".join(va.visual_style_hints) or "not detected",
            text_content=_safe(text[:2000]),
        ))
        raw_outputs["descriptors"] = desc

        profile.brand_descriptors = BrandDescriptors(
            visual_aesthetics=desc.get("visual_aesthetics", []),
            brand_personality_keywords=desc.get("brand_personality_keywords", []),
            brand_archetype=desc.get("brand_archetype", ""),
            emotional_associations=desc.get("emotional_associations", []),
        )

        # Assemble brand guidelines from detected visual assets + LLM
        profile.brand_guidelines = BrandGuidelines(
            primary_color=va.colors.primary,
            secondary_colors=va.colors.secondary,
            accent_colors=va.colors.accent,
            primary_font=va.typography.primary_font,
            secondary_font=va.typography.secondary_font,
            logo_url=va.logo_url,
            visual_style=desc.get("visual_aesthetics", []),
        )

        # ── Step 6: Score & assemble ───────────────────────────────────
        _emit(on_progress, "Scoring completeness & assembling final profile", 92)
        profile.enrichment_confidence = self._confidence(profile)
        profile.data_completeness     = self._completeness(profile)
        profile.raw_llm_output        = {k: str(v) for k, v in raw_outputs.items()}

        _emit(on_progress, "AI enrichment complete", 100)
        return profile

    # ------------------------------------------------------------------ helpers

    def _call(self, prompt: str) -> dict:
        """Execute one LLM step and return parsed JSON dict."""
        try:
            response = self._client.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=P.SYSTEM_PROMPT,
                    max_output_tokens=_MAX_TOKENS,
                    temperature=_TEMPERATURE,
                    response_mime_type="application/json",
                ),
            )
            raw = response.text or ""
            result = _parse_json(raw)
            if not result:
                print(f"  [Enrichment] Warning: empty parse from response ({len(raw)} chars)")
            return result
        except Exception as exc:
            print(f"  [Enrichment] LLM step failed: {exc}")
            return {}

    def _confidence(self, p: EnrichedBusinessProfile) -> float:
        checks = [
            bool(p.business_name),
            bool(p.tagline),
            bool(p.business_overview),
            bool(p.value_proposition),
            bool(p.brand_values),
            bool(p.industry),
            bool(p.competitors),
            bool(p.target_audience.primary_segments),
            bool(p.brand_voice.tone_descriptors),
            bool(p.brand_guidelines.primary_color),
        ]
        return round(sum(checks) / len(checks), 2)

    def _completeness(self, p: EnrichedBusinessProfile) -> dict:
        return {
            "business_name":    bool(p.business_name),
            "tagline":          bool(p.tagline),
            "business_overview": bool(p.business_overview),
            "brand_values":     bool(p.brand_values),
            "brand_voice":      bool(p.brand_voice.tone_descriptors),
            "target_audience":  bool(p.target_audience.primary_segments),
            "competitors":      len(p.competitors) >= 3,
            "visual_identity":  bool(p.brand_guidelines.primary_color),
            "typography":       bool(p.brand_guidelines.primary_font),
            "logo":             bool(p.brand_guidelines.logo_url),
        }
