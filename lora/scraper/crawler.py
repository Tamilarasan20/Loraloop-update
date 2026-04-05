"""
Loraloop — Web Crawler
Multi-page crawler with SPA detection and graceful error handling.
"""

from __future__ import annotations

import re
import time
from urllib.parse import urlparse, urljoin
from typing import Optional

import requests
from bs4 import BeautifulSoup

from lora.scraper.models import SiteType

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Pages worth crawling first (ordered by brand-content value)
_PRIORITY_PATHS = [
    "about", "about-us", "about_us", "our-story", "story",
    "mission", "values", "team", "who-we-are",
    "services", "products", "solutions", "platform", "features",
    "home",
]

# SPA framework fingerprints in raw HTML
_SPA_SIGNALS = [
    r'data-reactroot',
    r'__NEXT_DATA__',
    r'ng-version\s*=',
    r'<div\s+id=["\']root["\']',
    r'<div\s+id=["\']app["\']',
    r'<div\s+id=["\']__nuxt["\']',
    r'nuxt\.js',
    r'vue(?:\.min)?\.js',
    r'angular(?:\.min)?\.js',
    r'_nuxt/',
    r'gatsby',
]


class WebCrawler:
    """
    Polite multi-page crawler.

    - Follows internal links (up to max_pages)
    - Prioritises about/mission/values pages
    - Detects SPA frameworks
    - Delays 0.4 s between requests (polite crawl)
    """

    def __init__(self, max_pages: int = 5, timeout: int = 15):
        self.max_pages = max_pages
        self.timeout   = timeout

    # ------------------------------------------------------------------ public

    def crawl(
        self,
        start_url: str,
    ) -> tuple[list[tuple[str, str]], SiteType, str]:
        """
        Crawl the site from start_url.

        Returns:
            pages     – list of (url, html) for each crawled page
            site_type – SiteType enum
            error     – non-empty string if the crawl fully failed
        """
        visited:  set[str]          = set()
        queue:    list[str]         = [start_url]
        pages:    list[tuple[str, str]] = []
        first_html = ""

        while queue and len(pages) < self.max_pages:
            url = queue.pop(0)
            norm = self._normalize(url)
            if norm in visited:
                continue
            visited.add(norm)

            try:
                html, status = self._fetch(url)
            except requests.Timeout:
                if not pages:
                    return [], SiteType.LIMITED, "timeout"
                break
            except requests.ConnectionError as exc:
                if not pages:
                    return [], SiteType.LIMITED, f"connection_error: {exc}"
                break
            except Exception as exc:
                if not pages:
                    return [], SiteType.LIMITED, str(exc)
                continue

            if status >= 400:
                continue

            pages.append((url, html))
            if not first_html:
                first_html = html

            # Enqueue more internal links
            if len(pages) < self.max_pages:
                new_links = self._extract_links(html, url, start_url, visited)
                queue.extend(self._prioritize(new_links)[:8])

            time.sleep(0.4)   # polite delay

        site_type = self._classify(first_html, len(pages))
        return pages, site_type, ""

    # ------------------------------------------------------------------ helpers

    def _fetch(self, url: str) -> tuple[str, int]:
        resp = requests.get(
            url, headers=_HEADERS, timeout=self.timeout, allow_redirects=True
        )
        return resp.text, resp.status_code

    def _normalize(self, url: str) -> str:
        p = urlparse(url)
        return f"{p.scheme}://{p.netloc}{p.path.rstrip('/') or '/'}"

    def _extract_links(
        self,
        html: str,
        current_url: str,
        base_url: str,
        visited: set[str],
    ) -> list[str]:
        base_domain = urlparse(base_url).netloc
        soup  = BeautifulSoup(html, "html.parser")
        links: dict[str, None] = {}

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            full   = urljoin(current_url, href)
            parsed = urlparse(full)
            if parsed.netloc != base_domain or parsed.scheme not in ("http", "https"):
                continue
            clean = self._normalize(full)
            if clean not in visited:
                links[clean] = None

        return list(links.keys())

    def _prioritize(self, links: list[str]) -> list[str]:
        priority, other = [], []
        for link in links:
            path = urlparse(link).path.lower()
            if any(p in path for p in _PRIORITY_PATHS):
                priority.append(link)
            else:
                other.append(link)
        return priority + other

    def _classify(self, html: str, pages_found: int) -> SiteType:
        if not html:
            return SiteType.LIMITED

        for pattern in _SPA_SIGNALS:
            if re.search(pattern, html, re.IGNORECASE):
                return SiteType.SPA

        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        word_count = len(soup.get_text().split())

        if word_count < 80:
            return SiteType.LIMITED
        if pages_found <= 1:
            return SiteType.SINGLE_PAGE
        return SiteType.MULTI_PAGE
