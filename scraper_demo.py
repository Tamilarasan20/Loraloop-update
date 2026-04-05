"""
Loraloop — Website Scraper + AI Enrichment Demo
================================================
Run:
    python scraper_demo.py https://stripe.com
    python scraper_demo.py https://notion.so --no-snapshot
    python scraper_demo.py                    # uses default demo URL

Requires GOOGLE_API_KEY in .env or environment.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from lora.scraper    import ScraperEngine
from lora.enrichment import BrandEnricher


# ── Default demo URL ───────────────────────────────────────────────────────────
DEFAULT_URL = "https://loraloop.in"

# ── Output directory for JSON profiles ────────────────────────────────────────
OUTPUT_DIR  = Path(".lora_profiles")


def _section(title: str) -> None:
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


def _kv(label: str, value, indent: int = 4) -> None:
    pad = " " * indent
    if isinstance(value, list):
        if not value:
            return
        print(f"{pad}{label}:")
        for item in value:
            print(f"{pad}  • {item}")
    else:
        if value:
            print(f"{pad}{label}: {value}")


def print_raw_data_summary(data) -> None:
    _section("SCRAPER RESULTS")
    _kv("URL",           data.url)
    _kv("Status",        data.crawl_status.value)
    _kv("Site type",     data.site_type.value)
    _kv("Pages crawled", data.pages_crawled)
    _kv("Duration",      f"{data.crawl_duration_seconds}s")
    _kv("Snapshot",      data.snapshot_path or "not captured")

    if data.error:
        print(f"    ⚠  Error: {data.error}")

    print(f"\n  {'─'*56}")
    print("  PAGES")
    for page in data.pages:
        flag = "(home)" if page.is_home_page else ("(about)" if page.is_about_page else "")
        print(f"    • {page.url} {flag}  [{page.word_count} words]")
        if page.h1_tags:
            print(f"      H1: {page.h1_tags[0]}")

    print(f"\n  {'─'*56}")
    print("  VISUAL IDENTITY")
    va = data.visual_assets
    _kv("Logo URL",       va.logo_url)
    _kv("Primary color",  va.colors.primary)
    _kv("Secondary",      va.colors.secondary)
    _kv("Accent",         va.colors.accent)
    _kv("Primary font",   va.typography.primary_font)
    _kv("Google Fonts",   va.typography.google_fonts)
    _kv("Visual hints",   va.visual_style_hints)


def print_enriched_profile(profile) -> None:
    _section("AI ENRICHMENT RESULTS")

    print(f"\n  BUSINESS IDENTITY")
    _kv("Name",             profile.business_name)
    _kv("Tagline",          profile.tagline)
    _kv("Industry",         profile.industry)
    _kv("Business model",   profile.business_model)
    _kv("Market segment",   profile.market_segment)
    _kv("Location",         profile.business_location)

    print(f"\n  {'─'*56}")
    print("  OVERVIEW")
    if profile.business_overview:
        for line in profile.business_overview.split(". "):
            if line.strip():
                print(f"    {line.strip()}.")

    print(f"\n  {'─'*56}")
    print("  BRAND")
    _kv("Elevator pitch",    profile.elevator_pitch)
    _kv("Value proposition", profile.value_proposition)
    _kv("Brand values",      profile.brand_values)
    _kv("USPs",              profile.unique_selling_points)
    _kv("Aesthetic",         profile.brand_aesthetic)
    _kv("Archetype",         profile.brand_descriptors.brand_archetype)
    _kv("Visual aesthetics", profile.brand_descriptors.visual_aesthetics)
    _kv("Brand keywords",    profile.brand_descriptors.brand_personality_keywords)

    print(f"\n  {'─'*56}")
    print("  BRAND VOICE")
    _kv("Formality",      profile.brand_voice.formality_level)
    _kv("Style",          profile.brand_voice.communication_style)
    _kv("Tone",           profile.brand_voice.tone_descriptors)
    _kv("Themes",         profile.brand_voice.key_messaging_themes)
    _kv("Personality",    profile.brand_voice.brand_personality_dimensions)

    print(f"\n  {'─'*56}")
    print("  BRAND GUIDELINES")
    bg = profile.brand_guidelines
    _kv("Primary color",   bg.primary_color)
    _kv("Secondary colors", bg.secondary_colors)
    _kv("Accent colors",   bg.accent_colors)
    _kv("Primary font",    bg.primary_font)
    _kv("Secondary font",  bg.secondary_font)
    _kv("Logo URL",        bg.logo_url)

    print(f"\n  {'─'*56}")
    print("  TARGET AUDIENCE")
    ta = profile.target_audience
    _kv("Primary segments",  ta.primary_segments)
    _kv("Pain points",       ta.audience_pain_points)
    _kv("Needs",             ta.audience_needs)
    if ta.buyer_personas:
        print(f"    Buyer Personas:")
        for persona in ta.buyer_personas:
            print(f"      › {persona.name} ({persona.role}, {persona.age_range})")
            if persona.buying_trigger:
                print(f"        Trigger: {persona.buying_trigger}")

    print(f"\n  {'─'*56}")
    print(f"  COMPETITIVE LANDSCAPE ({len(profile.competitors)} competitors)")
    for c in profile.competitors[:5]:
        print(f"    • {c.name}" + (f" — {c.positioning}" if c.positioning else ""))
    if len(profile.competitors) > 5:
        print(f"    ... and {len(profile.competitors) - 5} more")
    _kv("Market gaps",            profile.market_gaps)
    _kv("Competitive advantages", profile.competitive_advantages)

    print(f"\n  {'─'*56}")
    print("  CONFIDENCE & COMPLETENESS")
    print(f"    Confidence score: {profile.enrichment_confidence * 100:.0f}%")
    complete = profile.data_completeness
    done   = [k for k, v in complete.items() if v]
    missing = [k for k, v in complete.items() if not v]
    if done:
        print(f"    Complete fields ({len(done)}): {', '.join(done)}")
    if missing:
        print(f"    Missing fields  ({len(missing)}): {', '.join(missing)}")


def save_output(url: str, raw_data, profile) -> Path:
    OUTPUT_DIR.mkdir(exist_ok=True)
    safe = url.replace("://", "_").replace("/", "_").replace(".", "_")[:50]

    # Save full JSON profile
    profile_path = OUTPUT_DIR / f"{safe}_profile.json"
    profile_path.write_text(
        profile.model_dump_json(indent=2), encoding="utf-8"
    )

    # Save raw scrape data
    raw_path = OUTPUT_DIR / f"{safe}_raw.json"
    raw_path.write_text(
        raw_data.model_dump_json(indent=2), encoding="utf-8"
    )

    return profile_path


def main() -> None:
    # ── Parse args ─────────────────────���──────────────────────────────
    args        = sys.argv[1:]
    url         = DEFAULT_URL
    no_snapshot = False

    for arg in args:
        if arg == "--no-snapshot":
            no_snapshot = True
        elif arg.startswith("http") or arg.startswith("www"):
            url = arg
        elif not arg.startswith("--"):
            url = arg

    # ── Check API key ──────────────────────────────────────────────────
    if not os.environ.get("GOOGLE_API_KEY"):
        print("ERROR: GOOGLE_API_KEY is not set.")
        print("Add it to .env: GOOGLE_API_KEY=your-key-here")
        sys.exit(1)

    print(f"\n{'═' * 60}")
    print(f"  LORALOOP — Website Scraper + AI Enrichment Engine")
    print(f"{'═' * 60}")
    print(f"  URL: {url}")
    print(f"  Snapshot: {'disabled' if no_snapshot else 'enabled (requires Playwright)'}")

    # ── Phase 1: Scrape ────────────────────────────────────────────────
    _section("PHASE 1 — WEBSITE SCRAPER ENGINE")
    scraper  = ScraperEngine(
        max_pages=5,
        enable_snapshot=not no_snapshot,
    )
    raw_data = scraper.scrape(url)

    print_raw_data_summary(raw_data)

    if raw_data.crawl_status.value == "failed":
        print(f"\n✗ Scraping failed: {raw_data.error}")
        sys.exit(1)

    # ── Phase 2: AI Enrichment ────────────────────────────────��────────
    _section("PHASE 2 — AI ENRICHMENT LAYER")
    enricher = BrandEnricher()
    profile  = enricher.enrich(raw_data)

    print_enriched_profile(profile)

    # ── Save output ────────────────────────────────────────────────────
    profile_path = save_output(url, raw_data, profile)

    print(f"\n{'═' * 60}")
    print(f"  DONE")
    print(f"{'═' * 60}")
    print(f"  Profile saved → {profile_path}")
    print(f"  Total duration ≈ {raw_data.crawl_duration_seconds}s (scrape)")
    print()


if __name__ == "__main__":
    main()
