"""
Nova Agent — Format Renderers
Pretty-print each content format for terminal / UI display.
"""

from __future__ import annotations

from nova.models import ContentOutput, ContentFormat


def _divider(char: str = "─", width: int = 60) -> str:
    return char * width


def render_instagram_image(output: ContentOutput) -> str:
    c = output.instagram_image
    if not c:
        return "[No instagram image content]"
    lines = [
        _divider("═"),
        "📸  INSTAGRAM IMAGE",
        _divider(),
        "",
        "📝  CAPTION",
        c.caption,
        "",
        "🎨  VISUAL CONCEPT",
        c.visual_concept,
        "",
        "🏷   HASHTAGS",
        "  ".join(f"#{t.lstrip('#')}" for t in c.hashtags),
        _divider("═"),
    ]
    return "\n".join(lines)


def render_instagram_carousel(output: ContentOutput) -> str:
    c = output.instagram_carousel
    if not c:
        return "[No carousel content]"
    lines = [
        _divider("═"),
        "🎠  INSTAGRAM CAROUSEL",
        _divider(),
        "",
        "📝  COVER CAPTION",
        c.cover_caption,
        "",
    ]
    for slide in c.slides:
        label = "🪝 HOOK" if slide.is_hook else ("📣 CTA" if slide.is_cta else f"💡 SLIDE {slide.slide_number}")
        lines += [
            f"{label}  (Slide {slide.slide_number})",
            f"  Heading: {slide.heading}",
            f"  Body:    {slide.body}",
            "",
        ]
    lines += [
        "🏷   HASHTAGS",
        "  ".join(f"#{t.lstrip('#')}" for t in c.hashtags),
        _divider("═"),
    ]
    return "\n".join(lines)


def render_blog(output: ContentOutput) -> str:
    c = output.blog
    if not c:
        return "[No blog content]"
    lines = [
        _divider("═"),
        "📖  BLOG POST",
        _divider(),
        "",
        f"🔤  TITLE: {c.title}",
        "",
    ]
    for section in c.sections:
        lines += [
            f"## {section.get('heading', '')}",
            section.get("body", ""),
            "",
        ]
    lines += [
        "🖼️   IMAGE PROMPT",
        c.image_prompt,
        "",
        f"📊  Estimated word count: ~{c.word_count_estimate}",
        _divider("═"),
    ]
    return "\n".join(lines)


def render_email(output: ContentOutput) -> str:
    c = output.email
    if not c:
        return "[No email content]"
    lines = [
        _divider("═"),
        "✉️   EMAIL",
        _divider(),
        "",
        f"📬  SUBJECT:  {c.subject_line}",
        f"👁️   PREVIEW:  {c.preview_text}",
        "",
        _divider("-"),
        "",
    ]
    for section in c.body_sections:
        if section.get("heading"):
            lines.append(f"### {section['heading']}")
        lines += [section.get("body", ""), ""]
    lines += [
        _divider("-"),
        f"🔘  CTA BUTTON: [ {c.cta_text} ]",
        f"    URL: {c.cta_url_placeholder}",
        _divider("═"),
    ]
    return "\n".join(lines)


_RENDERERS = {
    ContentFormat.INSTAGRAM_IMAGE:    render_instagram_image,
    ContentFormat.INSTAGRAM_CAROUSEL: render_instagram_carousel,
    ContentFormat.BLOG:               render_blog,
    ContentFormat.EMAIL:              render_email,
}


def render(output: ContentOutput) -> str:
    """Return a formatted string representation of the content output."""
    renderer = _RENDERERS.get(output.format)
    if not renderer:
        return output.raw_text
    return renderer(output)
