"""
Loraloop — Visual Extractor
Extracts brand colors, fonts, and images from HTML + CSS.
"""

from __future__ import annotations

import re
from collections import Counter
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from lora.scraper.models import ColorPalette, Typography, VisualAssets

# ── Regex patterns ─────────────────────────────────────────────────────────────

_HEX_RE         = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
_FONT_FAMILY_RE = re.compile(r'font-family\s*:\s*([^;{}!\n]+)', re.IGNORECASE)
_GFONT_RE       = re.compile(
    r'fonts\.googleapis\.com/css2?\?family=([^&\'")\s]+)', re.IGNORECASE
)
_FONT_FACE_RE   = re.compile(
    r"@font-face\s*\{[^}]*font-family\s*:\s*['\"]?([^;'\"{}]+)['\"]?",
    re.IGNORECASE,
)
_CSS_VAR_COLOR_RE = re.compile(
    r'--[\w-]*color[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[^;]+)',
    re.IGNORECASE,
)

# ── Noise filters ──────────────────────────────────────────────────────────────

_NOISE_HEX = {
    "#fff", "#ffffff", "#000", "#000000",
    "#333", "#333333", "#666", "#666666",
    "#999", "#999999", "#ccc", "#cccccc",
    "#eee", "#eeeeee", "#f0f0f0", "#f5f5f5",
    "#fafafa", "#e5e7eb", "#d1d5db", "#9ca3af",
}

_SYSTEM_FONTS = {
    "serif", "sans-serif", "monospace", "cursive", "fantasy",
    "system-ui", "-apple-system", "BlinkMacSystemFont",
    "Helvetica Neue", "Helvetica", "Arial", "Georgia",
    "Times New Roman", "Verdana", "inherit", "initial", "unset",
}

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}


class VisualExtractor:
    """Extracts visual brand identity from HTML and associated CSS."""

    MAX_CSS_FILES = 4        # limit external stylesheet fetches
    MAX_CSS_BYTES = 60_000   # cap per stylesheet

    def extract(self, html: str, base_url: str) -> VisualAssets:
        soup = BeautifulSoup(html, "html.parser")
        css  = self._collect_css(soup, base_url)

        colors     = self._extract_colors(html, css)
        typography = self._extract_typography(html, css)
        images     = self._extract_images(soup, base_url)
        logo       = self._extract_logo(soup, base_url)
        favicon    = self._extract_favicon(soup, base_url)
        og_image   = self._get_og_image(soup)
        hints      = self._infer_visual_style(colors, typography, css)

        return VisualAssets(
            logo_url=logo,
            favicon_url=favicon,
            og_image=og_image,
            hero_images=images[:3],
            all_images=images[:20],
            colors=colors,
            typography=typography,
            visual_style_hints=hints,
        )

    # ── CSS collection ─────────────────────────────────────────────────────────

    def _collect_css(self, soup: BeautifulSoup, base_url: str) -> str:
        parts: list[str] = []

        # Inline <style> blocks
        for tag in soup.find_all("style"):
            parts.append(tag.string or "")

        # External <link rel="stylesheet">
        fetched = 0
        for link in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
            if fetched >= self.MAX_CSS_FILES:
                break
            href = link.get("href", "")
            if not href:
                continue
            css_url = urljoin(base_url, href)
            try:
                resp = requests.get(css_url, headers=_HEADERS, timeout=6)
                if resp.status_code == 200:
                    parts.append(resp.text[: self.MAX_CSS_BYTES])
                    fetched += 1
            except Exception:
                pass

        return "\n".join(parts)

    # ── Color extraction ───────────────────────────────────────────────────────

    def _extract_colors(self, html: str, css: str) -> ColorPalette:
        combined = html + "\n" + css

        raw_hex = _HEX_RE.findall(combined)
        # Expand 3-digit hex → 6-digit
        normalized = []
        for c in raw_hex:
            c = c.lower()
            if len(c) == 4:   # #rgb
                c = "#" + c[1] * 2 + c[2] * 2 + c[3] * 2
            if c not in _NOISE_HEX:
                normalized.append(c)

        # Also capture CSS custom property colors (brand tokens)
        var_colors = [
            m.group(1).strip().lower()
            for m in _CSS_VAR_COLOR_RE.finditer(css)
        ]
        for c in var_colors:
            if c.startswith("#") and len(c) in (4, 7) and c not in _NOISE_HEX:
                if len(c) == 4:
                    c = "#" + c[1] * 2 + c[2] * 2 + c[3] * 2
                normalized.append(c)

        counter = Counter(normalized)
        ranked  = [c for c, _ in counter.most_common(20)]

        return ColorPalette(
            primary=ranked[0] if ranked else None,
            secondary=ranked[1:4],
            accent=ranked[4:8],
            all_colors=ranked[:15],
        )

    # ── Typography extraction ──────────────────────────────────────────────────

    def _extract_typography(self, html: str, css: str) -> Typography:
        all_fonts:    list[str] = []
        google_fonts: list[str] = []
        custom_fonts: list[str] = []

        # font-family declarations
        for m in _FONT_FAMILY_RE.finditer(css):
            stack = m.group(1).strip()
            first = stack.split(",")[0].strip().strip("'\"")
            if first and first not in _SYSTEM_FONTS and len(first) > 1:
                all_fonts.append(first)

        # Google Fonts URL imports
        for m in _GFONT_RE.finditer(html + css):
            for part in m.group(1).split("|"):
                name = part.split(":")[0].replace("+", " ").strip()
                if name:
                    google_fonts.append(name)
                    all_fonts.append(name)

        # @font-face custom declarations
        for m in _FONT_FACE_RE.finditer(css):
            name = m.group(1).strip().strip("'\"")
            if name and name not in _SYSTEM_FONTS:
                custom_fonts.append(name)

        def dedup(lst: list[str]) -> list[str]:
            return list(dict.fromkeys(lst))

        all_fonts    = dedup(all_fonts)[:8]
        google_fonts = dedup(google_fonts)[:5]
        custom_fonts = dedup(custom_fonts)[:5]

        return Typography(
            primary_font=all_fonts[0] if all_fonts else None,
            secondary_font=all_fonts[1] if len(all_fonts) > 1 else None,
            all_fonts=all_fonts,
            google_fonts=google_fonts,
            custom_fonts=custom_fonts,
        )

    # ── Image extraction ───────────────────────────────────────────────────────

    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        seen: dict[str, None] = {}

        def add(src: str | None) -> None:
            if src and not src.startswith("data:"):
                full = urljoin(base_url, src)
                seen[full] = None

        # Social preview images first (highest quality brand assets)
        for prop in ("og:image", "twitter:image"):
            tag = soup.find("meta", attrs={"property": prop}) or \
                  soup.find("meta", attrs={"name": prop})
            if tag:
                add(tag.get("content"))

        # <img> tags
        for img in soup.find_all("img"):
            src = (img.get("src") or img.get("data-src") or
                   img.get("data-lazy-src") or img.get("data-original"))
            add(src)
            if len(seen) >= 25:
                break

        return list(seen.keys())

    # ── Logo detection ─────────────────────────────────────────────────────────

    def _extract_logo(self, soup: BeautifulSoup, base_url: str) -> str | None:
        logo_pattern = re.compile(r"logo", re.I)

        # 1. <img> with class/id/alt containing "logo"
        for img in soup.find_all("img"):
            attrs_str = " ".join([
                img.get("class", [""])[0] if img.get("class") else "",
                img.get("id", ""),
                img.get("alt", ""),
            ]).lower()
            if "logo" in attrs_str:
                src = img.get("src") or img.get("data-src")
                if src and not src.startswith("data:"):
                    return urljoin(base_url, src)

        # 2. Container element with "logo" class/id, containing an <img>
        for container in soup.find_all(attrs={"class": logo_pattern}):
            img = container.find("img")
            if img:
                src = img.get("src") or img.get("data-src")
                if src and not src.startswith("data:"):
                    return urljoin(base_url, src)

        # 3. First <img> inside <header> / <nav>
        for selector in ["header", "nav", '[class*="header"]', '[class*="navbar"]']:
            container = soup.find(selector)
            if container:
                img = container.find("img")
                if img:
                    src = img.get("src") or img.get("data-src")
                    if src and not src.startswith("data:"):
                        return urljoin(base_url, src)

        return None

    def _extract_favicon(self, soup: BeautifulSoup, base_url: str) -> str | None:
        for rel in ("shortcut icon", "icon", "apple-touch-icon"):
            link = soup.find("link", rel=re.compile(re.escape(rel), re.I))
            if link and link.get("href"):
                return urljoin(base_url, link["href"])
        return urljoin(base_url, "/favicon.ico")

    def _get_og_image(self, soup: BeautifulSoup) -> str | None:
        tag = soup.find("meta", attrs={"property": "og:image"})
        return tag.get("content") if tag else None

    # ── Visual style inference ─────────────────────────────────────────────────

    def _infer_visual_style(
        self, colors: ColorPalette, typography: Typography, css: str
    ) -> list[str]:
        hints: list[str] = []

        # Dark vs light theme
        primary = colors.primary or ""
        if primary and len(primary) == 7:
            try:
                r = int(primary[1:3], 16)
                g = int(primary[3:5], 16)
                b = int(primary[5:7], 16)
                brightness = (r * 299 + g * 587 + b * 114) / 1000
                hints.append("dark-themed" if brightness < 80 else "light-themed")
            except ValueError:
                pass

        # Color palette richness
        n = len(colors.all_colors)
        if n <= 2:
            hints.append("minimal color palette")
        elif n >= 8:
            hints.append("rich multi-color palette")

        # Font style
        font = (typography.primary_font or "").lower()
        if any(f in font for f in ("serif", "times", "garamond", "georgia", "playfair")):
            hints.append("editorial / serif typography")
        elif any(f in font for f in ("mono", "code", "courier", "ibm plex mono")):
            hints.append("technical / monospace typography")
        elif font:
            hints.append("modern sans-serif typography")

        # CSS animations = dynamic/modern
        if re.search(r'@keyframes|animation\s*:', css, re.IGNORECASE):
            hints.append("animated / dynamic UI")

        # Grid / Flex heavy = structured layout
        if len(re.findall(r'display\s*:\s*(?:grid|flex)', css, re.IGNORECASE)) > 5:
            hints.append("structured grid layout")

        return hints
