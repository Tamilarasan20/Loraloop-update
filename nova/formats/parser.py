"""
Nova Agent — Format Parsers
Each parser takes raw LLM JSON output and returns a typed content model.
"""

from __future__ import annotations

import json
import re
from typing import Any

from nova.models import (
    ContentFormat,
    ContentOutput,
    ContentRequest,
    InstagramImageContent,
    InstagramCarouselContent,
    CarouselSlide,
    BlogContent,
    EmailContent,
)


def _extract_json(raw: str) -> dict[str, Any]:
    """
    Extract a JSON object from raw LLM output.
    Handles cases where the model wraps JSON in markdown code fences.
    """
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*", "", raw).strip()
    text = text.rstrip("`").strip()

    # Find the outermost JSON object
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON object found in LLM output:\n{raw[:300]}")

    json_str = text[start:end]
    return json.loads(json_str)


def parse_instagram_image(raw: str, request: ContentRequest) -> ContentOutput:
    data = _extract_json(raw)
    content = InstagramImageContent(
        caption=data.get("caption", ""),
        visual_concept=data.get("visual_concept", ""),
        hashtags=data.get("hashtags", []),
    )
    return ContentOutput(
        request=request,
        format=ContentFormat.INSTAGRAM_IMAGE,
        instagram_image=content,
        raw_text=raw,
    )


def parse_instagram_carousel(raw: str, request: ContentRequest) -> ContentOutput:
    data = _extract_json(raw)
    slides = [
        CarouselSlide(
            slide_number=s.get("slide_number", i + 1),
            heading=s.get("heading", ""),
            body=s.get("body", ""),
            is_hook=s.get("is_hook", False),
            is_cta=s.get("is_cta", False),
        )
        for i, s in enumerate(data.get("slides", []))
    ]
    content = InstagramCarouselContent(
        slides=slides,
        cover_caption=data.get("cover_caption", ""),
        hashtags=data.get("hashtags", []),
    )
    return ContentOutput(
        request=request,
        format=ContentFormat.INSTAGRAM_CAROUSEL,
        instagram_carousel=content,
        raw_text=raw,
    )


def parse_blog(raw: str, request: ContentRequest) -> ContentOutput:
    data = _extract_json(raw)
    content = BlogContent(
        title=data.get("title", ""),
        sections=data.get("sections", []),
        image_prompt=data.get("image_prompt", ""),
        word_count_estimate=data.get("word_count_estimate", 0),
    )
    return ContentOutput(
        request=request,
        format=ContentFormat.BLOG,
        blog=content,
        raw_text=raw,
    )


def parse_email(raw: str, request: ContentRequest) -> ContentOutput:
    data = _extract_json(raw)
    content = EmailContent(
        subject_line=data.get("subject_line", ""),
        preview_text=data.get("preview_text", ""),
        body_sections=data.get("body_sections", []),
        cta_text=data.get("cta_text", ""),
        cta_url_placeholder=data.get("cta_url_placeholder", "[CTA_URL]"),
    )
    return ContentOutput(
        request=request,
        format=ContentFormat.EMAIL,
        email=content,
        raw_text=raw,
    )


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

_PARSERS = {
    ContentFormat.INSTAGRAM_IMAGE:    parse_instagram_image,
    ContentFormat.INSTAGRAM_CAROUSEL: parse_instagram_carousel,
    ContentFormat.BLOG:               parse_blog,
    ContentFormat.EMAIL:              parse_email,
}


def parse_output(raw: str, request: ContentRequest) -> ContentOutput:
    """Parse raw LLM text into a typed ContentOutput for the given format."""
    parser = _PARSERS.get(request.format)
    if not parser:
        raise ValueError(f"No parser registered for format: {request.format}")
    return parser(raw, request)
