"""
Loraloop — AI Enrichment Layer
Data models for the enriched Business Profile output.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Callable
from pydantic import BaseModel, Field

# Type alias
ProgressCallback = Optional[Callable[[str, int], None]]


class BrandVoiceProfile(BaseModel):
    formality_level:              str = ""   # professional | casual | playful | friendly | authoritative
    communication_style:          str = ""
    tone_descriptors:             list[str] = Field(default_factory=list)   # 3–5 words
    key_messaging_themes:         list[str] = Field(default_factory=list)
    brand_personality_dimensions: list[str] = Field(default_factory=list)


class BuyerPersona(BaseModel):
    name:            str = ""
    role:            str = ""
    age_range:       str = ""
    pain_points:     list[str] = Field(default_factory=list)
    goals:           list[str] = Field(default_factory=list)
    buying_trigger:  str = ""


class TargetAudienceProfile(BaseModel):
    primary_segments:   list[str]        = Field(default_factory=list)
    buyer_personas:     list[BuyerPersona] = Field(default_factory=list)
    demographics:       dict              = Field(default_factory=dict)
    psychographics:     list[str]        = Field(default_factory=list)
    audience_pain_points: list[str]      = Field(default_factory=list)
    audience_needs:     list[str]        = Field(default_factory=list)


class CompetitorInfo(BaseModel):
    name:        str
    website:     Optional[str]  = None
    positioning: str            = ""
    strengths:   list[str]      = Field(default_factory=list)
    weaknesses:  list[str]      = Field(default_factory=list)


class BrandDescriptors(BaseModel):
    visual_aesthetics:         list[str] = Field(default_factory=list)  # 5–7
    brand_personality_keywords: list[str] = Field(default_factory=list)
    brand_archetype:           str        = ""   # Hero, Sage, Rebel, Creator …
    emotional_associations:    list[str]  = Field(default_factory=list)


class BrandGuidelines(BaseModel):
    """Visual brand guidelines extracted from the site."""
    primary_color:    Optional[str] = None
    secondary_colors: list[str]     = Field(default_factory=list)
    accent_colors:    list[str]     = Field(default_factory=list)
    primary_font:     Optional[str] = None
    secondary_font:   Optional[str] = None
    logo_url:         Optional[str] = None
    visual_style:     list[str]     = Field(default_factory=list)


class EnrichedBusinessProfile(BaseModel):
    """
    Complete AI-enriched Business Profile.
    Output of the Enrichment Layer — ready for downstream AI & product use.
    """

    # ── Core business ──────────────────────────────────────────────────────────
    business_name:        str           = ""
    tagline:              Optional[str] = None
    business_overview:    str           = ""   # 50–100 words
    elevator_pitch:       str           = ""
    value_proposition:    str           = ""
    unique_selling_points: list[str]    = Field(default_factory=list)

    # ── Brand identity ─────────────────────────────────────────────────────────
    brand_values:         list[str]          = Field(default_factory=list)
    brand_aesthetic:      str                = ""
    brand_voice:          BrandVoiceProfile  = Field(default_factory=BrandVoiceProfile)
    brand_descriptors:    BrandDescriptors   = Field(default_factory=BrandDescriptors)
    brand_guidelines:     BrandGuidelines    = Field(default_factory=BrandGuidelines)

    # ── Market position ────────────────────────────────────────────────────────
    industry:                  str                    = ""
    market_segment:            str                    = ""
    business_model:            str                    = ""
    competitive_positioning:   str                    = ""
    target_audience:           TargetAudienceProfile  = Field(default_factory=TargetAudienceProfile)

    # ── Competitive landscape ──────────────────────────────────────────────────
    competitors:            list[CompetitorInfo] = Field(default_factory=list)
    market_gaps:            list[str]            = Field(default_factory=list)
    competitive_advantages: list[str]            = Field(default_factory=list)

    # ── Additional context ─────────────────────────────────────────────────────
    business_location:  Optional[str] = None
    mission_statement:  Optional[str] = None
    founding_story:     Optional[str] = None

    # ── Metadata ───────────────────────────────────────────────────────────────
    source_url:             str   = ""
    enrichment_confidence:  float = 0.0   # 0.0 → 1.0
    data_completeness:      dict  = Field(default_factory=dict)
    enriched_at:            datetime = Field(default_factory=datetime.utcnow)
    raw_llm_output:         dict  = Field(default_factory=dict)   # step → raw text
