"""
Loraloop — Website Scraper Engine
Data models for raw website extraction output.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, Callable
from pydantic import BaseModel, Field


# Type alias for progress callbacks: (step_description, percent_0_to_100)
ProgressCallback = Optional[Callable[[str, int], None]]


class CrawlStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"    # crawled but with degraded content
    FAILED  = "failed"     # could not access the site
    TIMEOUT = "timeout"


class SiteType(str, Enum):
    STATIC      = "static"       # server-rendered HTML
    SPA         = "spa"          # React / Vue / Angular
    SINGLE_PAGE = "single_page"  # all content on one URL
    MULTI_PAGE  = "multi_page"   # multiple distinct pages
    LIMITED     = "limited"      # minimal content available


class ColorPalette(BaseModel):
    primary:    Optional[str] = None
    secondary:  list[str] = Field(default_factory=list)
    accent:     list[str] = Field(default_factory=list)
    all_colors: list[str] = Field(default_factory=list)
    background: Optional[str] = None
    text_color: Optional[str] = None


class Typography(BaseModel):
    primary_font:   Optional[str] = None
    secondary_font: Optional[str] = None
    all_fonts:      list[str] = Field(default_factory=list)
    google_fonts:   list[str] = Field(default_factory=list)
    custom_fonts:   list[str] = Field(default_factory=list)


class VisualAssets(BaseModel):
    logo_url:          Optional[str] = None
    favicon_url:       Optional[str] = None
    og_image:          Optional[str] = None
    hero_images:       list[str] = Field(default_factory=list)   # top 3
    all_images:        list[str] = Field(default_factory=list)   # up to 20
    colors:            ColorPalette = Field(default_factory=ColorPalette)
    typography:        Typography   = Field(default_factory=Typography)
    visual_style_hints: list[str]  = Field(default_factory=list)


class PageData(BaseModel):
    url:              str
    title:            str = ""
    meta_description: str = ""
    og_title:         Optional[str] = None
    og_description:   Optional[str] = None
    h1_tags:          list[str] = Field(default_factory=list)
    h2_tags:          list[str] = Field(default_factory=list)
    text_content:     str = ""          # clean text, max 5 000 chars
    internal_links:   list[str] = Field(default_factory=list)
    word_count:       int = 0
    is_about_page:    bool = False
    is_home_page:     bool = False


class RawWebsiteData(BaseModel):
    """
    Complete raw output from the Website Scraper Engine.
    Passed directly to the AI Enrichment Layer.
    """
    url:               str
    snapshot_path:     Optional[str] = None    # absolute path to screenshot PNG

    pages:             list[PageData] = Field(default_factory=list)
    pages_crawled:     int = 0
    pages_attempted:   int = 0

    visual_assets:     VisualAssets = Field(default_factory=VisualAssets)
    raw_html_preview:  str = ""                # first 10 000 chars of home page

    site_type:         SiteType    = SiteType.STATIC
    crawl_status:      CrawlStatus = CrawlStatus.SUCCESS
    error:             Optional[str] = None
    error_type:        Optional[str] = None

    crawl_duration_seconds: float = 0.0
    crawled_at:        datetime = Field(default_factory=datetime.utcnow)

    # ------------------------------------------------------------------ helpers

    def full_text(self) -> str:
        """Merge all page text for LLM processing (capped at 12 000 chars)."""
        parts = []
        for page in self.pages:
            if page.text_content:
                label = "(home)" if page.is_home_page else ("(about)" if page.is_about_page else "")
                parts.append(f"[Page{label}: {page.url}]\n{page.text_content}")
        return "\n\n---\n\n".join(parts)[:12000]

    def all_headings(self) -> list[str]:
        """Deduplicated H1/H2 headings across all pages."""
        seen: dict[str, None] = {}
        for page in self.pages:
            for h in page.h1_tags + page.h2_tags:
                seen[h] = None
        return list(seen.keys())
