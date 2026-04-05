"""
Loraloop — Snapshot
Captures a full-page screenshot using Playwright.
Gracefully degrades if Playwright is not installed.
"""

from __future__ import annotations

from pathlib import Path


def take_snapshot(url: str, output_dir: str = ".lora_snapshots") -> str | None:
    """
    Capture a full-page screenshot and save it as PNG.

    Args:
        url:        The website URL to screenshot.
        output_dir: Directory where the PNG is saved.

    Returns:
        Absolute path to the saved PNG, or None if capture failed.

    Install Playwright to enable this feature:
        pip install playwright
        playwright install chromium
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "[Scraper/Snapshot] Playwright not installed — skipping screenshot.\n"
            "  To enable: pip install playwright && playwright install chromium"
        )
        return None

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Build a filesystem-safe filename from the URL
    safe = (
        url.replace("://", "__")
           .replace("/", "_")
           .replace(".", "_")
           .replace("?", "_")[:80]
    )
    output_path = str(Path(output_dir).resolve() / f"{safe}.png")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page    = browser.new_page(viewport={"width": 1440, "height": 900})
            page.goto(url, wait_until="networkidle", timeout=30_000)
            # Brief pause for any lazy-load animations
            page.wait_for_timeout(1_500)
            page.screenshot(path=output_path, full_page=True)
            browser.close()
        print(f"[Scraper/Snapshot] Saved → {output_path}")
        return output_path

    except Exception as exc:
        print(f"[Scraper/Snapshot] Screenshot failed: {exc}")
        return None
