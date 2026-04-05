"""
Nova Agent — Data Models
Defines all core data structures used across the agent.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ContentFormat(str, Enum):
    INSTAGRAM_IMAGE    = "instagram_image"
    INSTAGRAM_CAROUSEL = "instagram_carousel"
    BLOG               = "blog"
    EMAIL              = "email"


class InputSource(str, Enum):
    CHAT          = "chat"          # T3 — direct user chat input
    TRENDING      = "trending"      # T4 — trending topic selection
    CONTENT_PLAN  = "content_plan"  # T5 — item from content plan


class RegenerationType(str, Enum):
    IMPROVE       = "improve"       # enhance overall quality
    REWRITE_HOOK  = "rewrite_hook"  # regenerate opening only
    ADJUST_TONE   = "adjust_tone"   # shift voice without changing substance


# ---------------------------------------------------------------------------
# Brand Guidelines  (T6 — Content Guidelines)
# ---------------------------------------------------------------------------

class BrandGuidelines(BaseModel):
    """
    Brand DNA and content settings loaded from T6.
    All fields are optional; Nova applies defaults when not provided.
    """
    language: str = "English"
    tone: str = "professional yet approachable"
    audience_age_range: Optional[str] = None        # e.g. "25-40"
    audience_gender: Optional[str] = None           # e.g. "all", "female", "male"
    audience_location: Optional[str] = None         # e.g. "India", "US"
    avoid_words: list[str] = Field(default_factory=list)
    style_rules: list[str] = Field(default_factory=list)
    cta_default: Optional[str] = None               # e.g. "DM us to get started"
    brand_name: Optional[str] = None
    brand_description: Optional[str] = None


# ---------------------------------------------------------------------------
# Content Request
# ---------------------------------------------------------------------------

class ContentRequest(BaseModel):
    """
    Single content creation request sent to Nova.
    One request → one excellent output.
    """
    topic: str = Field(..., description="The topic or subject for the content")
    format: ContentFormat = Field(..., description="Target content format")
    source: InputSource = Field(default=InputSource.CHAT, description="Where this request originated")
    brand: BrandGuidelines = Field(default_factory=BrandGuidelines)
    extra_context: Optional[str] = Field(
        default=None,
        description="Any extra context (product details, key messages, etc.)"
    )


# ---------------------------------------------------------------------------
# Content Output — per format
# ---------------------------------------------------------------------------

class InstagramImageContent(BaseModel):
    caption: str = Field(..., description="Platform-optimised, hook-first caption")
    visual_concept: str = Field(..., description="Description for design/image generation")
    hashtags: list[str] = Field(default_factory=list)


class CarouselSlide(BaseModel):
    slide_number: int
    heading: str
    body: str
    is_hook: bool = False
    is_cta: bool = False


class InstagramCarouselContent(BaseModel):
    slides: list[CarouselSlide] = Field(
        ..., description="3-5 slides: hook → value breakdown → CTA"
    )
    cover_caption: str = Field(..., description="Caption for the post")
    hashtags: list[str] = Field(default_factory=list)


class BlogContent(BaseModel):
    title: str
    sections: list[dict] = Field(
        ...,
        description="List of {heading: str, body: str} sections with H2 structure"
    )
    image_prompt: str = Field(
        ...,
        description="AI image generation prompt relevant to the blog topic + brand DNA"
    )
    word_count_estimate: int = 0


class EmailContent(BaseModel):
    subject_line: str
    preview_text: str
    body_sections: list[dict] = Field(
        ...,
        description="List of {heading: str | None, body: str} sections"
    )
    cta_text: str
    cta_url_placeholder: str = "[CTA_URL]"


class ContentOutput(BaseModel):
    """
    Final output from Nova for a single content request.
    """
    request: ContentRequest
    format: ContentFormat

    # Only one of these will be populated
    instagram_image: Optional[InstagramImageContent] = None
    instagram_carousel: Optional[InstagramCarouselContent] = None
    blog: Optional[BlogContent] = None
    email: Optional[EmailContent] = None

    raw_text: str = Field(default="", description="Raw LLM output (for debugging)")
    model_used: str = "gemini-2.5-flash"

    def get_content(self):
        """Return the format-specific content object."""
        if self.format == ContentFormat.INSTAGRAM_IMAGE:
            return self.instagram_image
        if self.format == ContentFormat.INSTAGRAM_CAROUSEL:
            return self.instagram_carousel
        if self.format == ContentFormat.BLOG:
            return self.blog
        if self.format == ContentFormat.EMAIL:
            return self.email
        return None
