"""
Loraloop — Content Extractor
Pulls structured text data from a single HTML page.
"""

from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from lora.scraper.models import PageData

_ABOUT_KEYWORDS = {
    "about", "story", "mission", "values", "team",
    "who-we-are", "who_we_are", "company", "founders",
}
_HOME_PATHS = {"", "/", "/home", "/index", "/index.html"}

# Tags that add noise rather than content
_NOISE_TAGS = [
    "script", "style", "noscript", "nav", "footer", "header",
    "aside", "iframe", "svg", "button", "form", "input",
    "select", "textarea", "dialog",
]


class ContentExtractor:
    """Extracts clean structured content from a single HTML page."""

    def extract(self, html: str, url: str) -> PageData:
        soup = BeautifulSoup(html, "html.parser")

        for tag in soup(_NOISE_TAGS):
            tag.decompose()

        page = PageData(url=url)
        page.title            = self._get_title(soup)
        page.meta_description = self._get_meta(soup, "description")
        page.og_title         = self._get_og(soup, "og:title")
        page.og_description   = self._get_og(soup, "og:description")
        page.h1_tags          = self._get_tags(soup, "h1", limit=10)
        page.h2_tags          = self._get_tags(soup, "h2", limit=15)
        page.text_content     = self._get_text(soup)
        page.word_count       = len(page.text_content.split())
        page.internal_links   = self._get_internal_links(soup, url)

        path = urlparse(url).path.lower().rstrip("/")
        page.is_home_page  = path in _HOME_PATHS
        page.is_about_page = any(kw in path for kw in _ABOUT_KEYWORDS)

        return page

    # ------------------------------------------------------------------ helpers

    def _get_title(self, soup: BeautifulSoup) -> str:
        tag = soup.find("title")
        return tag.get_text(strip=True) if tag else ""

    def _get_meta(self, soup: BeautifulSoup, name: str) -> str:
        tag = soup.find("meta", attrs={"name": name})
        return tag.get("content", "") if tag else ""

    def _get_og(self, soup: BeautifulSoup, prop: str) -> str | None:
        tag = soup.find("meta", attrs={"property": prop})
        return tag.get("content") if tag else None

    def _get_tags(self, soup: BeautifulSoup, tag_name: str, limit: int = 15) -> list[str]:
        return [
            t.get_text(strip=True)
            for t in soup.find_all(tag_name)
            if t.get_text(strip=True)
        ][:limit]

    def _get_text(self, soup: BeautifulSoup) -> str:
        text = soup.get_text(separator="\n", strip=True)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text[:5000]

    def _get_internal_links(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        base_domain = urlparse(base_url).netloc
        links: dict[str, None] = {}

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            full = urljoin(base_url, href)
            parsed = urlparse(full)
            if parsed.netloc == base_domain and parsed.scheme in ("http", "https"):
                # Normalize — drop fragment and query
                clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/') or '/'}"
                if clean != base_url.rstrip("/"):
                    links[clean] = None

        return list(links.keys())[:30]
