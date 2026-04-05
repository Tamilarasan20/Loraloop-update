"""
Nova — Entry Point / Demo
Run: python main.py

Demonstrates all supported formats and regeneration controls.
Requires: ANTHROPIC_API_KEY environment variable (or .env file).
"""

from __future__ import annotations

import os
import sys
from dotenv import load_dotenv

load_dotenv()

from nova import Nova, BrandGuidelines, ContentFormat, RegenerationType


# ---------------------------------------------------------------------------
# Sample brand — replace with real T6 settings
# ---------------------------------------------------------------------------

LORALOOP_BRAND = BrandGuidelines(
    brand_name="Loraloop",
    brand_description="AI-powered content creation platform for modern creators and businesses",
    language="English",
    tone="bold, direct, empowering — like a senior creative director",
    audience_age_range="22-40",
    audience_gender="all",
    audience_location="India, US",
    avoid_words=["synergy", "leverage", "game-changer", "revolutionary", "In today's world"],
    style_rules=[
        "Lead with value, not with company name",
        "Use short sentences. Paragraphs max 3 lines.",
        "Never use passive voice",
    ],
    cta_default="Try Loraloop free →",
)


def demo_instagram_image(nova: Nova) -> None:
    print("\n" + "=" * 60)
    print("DEMO 1 — Instagram Image")
    print("=" * 60)

    output = nova.create_from_chat(
        topic="How AI is helping small business owners create content 10x faster",
        format=ContentFormat.INSTAGRAM_IMAGE,
        brand=LORALOOP_BRAND,
        verbose=True,
    )
    print(nova.render(output))


def demo_instagram_carousel(nova: Nova) -> None:
    print("\n" + "=" * 60)
    print("DEMO 2 — Instagram Carousel")
    print("=" * 60)

    output = nova.create_from_trending(
        trending_topic="5 content mistakes killing your engagement on Instagram",
        format=ContentFormat.INSTAGRAM_CAROUSEL,
        brand=LORALOOP_BRAND,
        verbose=True,
    )
    print(nova.render(output))


def demo_blog(nova: Nova) -> None:
    print("\n" + "=" * 60)
    print("DEMO 3 — Blog Post")
    print("=" * 60)

    output = nova.create_from_plan(
        plan_item="Why consistent brand voice matters for growing businesses",
        format=ContentFormat.BLOG,
        brand=LORALOOP_BRAND,
        extra_context="Target: business owners who post inconsistently. Angle: brand voice = competitive advantage.",
        verbose=True,
    )
    print(nova.render(output))


def demo_email(nova: Nova) -> None:
    print("\n" + "=" * 60)
    print("DEMO 4 — Email")
    print("=" * 60)

    output = nova.create_from_chat(
        topic="Product launch: Loraloop's new AI carousel builder feature",
        format=ContentFormat.EMAIL,
        brand=LORALOOP_BRAND,
        extra_context="Feature: generates full carousels from a single prompt. Launch date: next week.",
        verbose=True,
    )
    print(nova.render(output))


def demo_regeneration(nova: Nova) -> None:
    print("\n" + "=" * 60)
    print("DEMO 5 — Regeneration Controls")
    print("=" * 60)

    # Create base content
    print("\n[Step 1] Creating original Instagram Image...")
    original = nova.create_from_chat(
        topic="The ROI of AI content tools for e-commerce brands",
        format=ContentFormat.INSTAGRAM_IMAGE,
        brand=LORALOOP_BRAND,
        verbose=True,
    )
    print("\n--- Original Output ---")
    print(nova.render(original))

    # Improve
    print("\n[Step 2] Improving overall quality...")
    improved = nova.improve(original, verbose=True)
    print("\n--- Improved Output ---")
    print(nova.render(improved))

    # Rewrite hook
    print("\n[Step 3] Rewriting the hook only...")
    new_hook = nova.rewrite_hook(improved, verbose=True)
    print("\n--- New Hook Output ---")
    print(nova.render(new_hook))

    # Adjust tone
    print("\n[Step 4] Adjusting tone to 'casual and conversational'...")
    adjusted = nova.adjust_tone(improved, new_tone="casual and conversational", verbose=True)
    print("\n--- Tone-Adjusted Output ---")
    print(nova.render(adjusted))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

DEMOS = {
    "1": ("Instagram Image",    demo_instagram_image),
    "2": ("Instagram Carousel", demo_instagram_carousel),
    "3": ("Blog Post",          demo_blog),
    "4": ("Email",              demo_email),
    "5": ("Regeneration",       demo_regeneration),
}


def main() -> None:
    if not os.environ.get("GOOGLE_API_KEY"):
        print("ERROR: GOOGLE_API_KEY is not set.")
        print("Create a .env file with: GOOGLE_API_KEY=your-key-here")
        sys.exit(1)

    nova = Nova()

    # If a demo number is passed as argument, run just that one
    if len(sys.argv) > 1:
        choice = sys.argv[1]
        if choice in DEMOS:
            name, fn = DEMOS[choice]
            print(f"\n🚀 Nova — Running demo: {name}")
            fn(nova)
        else:
            print(f"Unknown demo: {choice}. Choose from: {', '.join(DEMOS.keys())}")
        return

    # Otherwise, run all demos
    print("\n🚀 Nova — AI Autonomous Creator Agent")
    print("Loraloop AI Content Creation Engine (WI-4)\n")
    print("Available demos:")
    for k, (name, _) in DEMOS.items():
        print(f"  {k}. {name}")
    print("\nRunning all demos...\n")

    for _, (name, fn) in DEMOS.items():
        try:
            fn(nova)
        except Exception as e:
            print(f"\n[Nova] Demo '{name}' failed: {e}")
            continue


if __name__ == "__main__":
    main()
