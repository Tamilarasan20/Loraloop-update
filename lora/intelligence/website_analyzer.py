"""
Lora CMO — Website Intelligence Analyzer
User pastes URL → Lora fetches, reads, and deeply analyzes the business.
Output: BusinessProfile (the foundation for ALL CMO decisions).
"""

from __future__ import annotations

import re
import json
from datetime import datetime
from urllib.parse import urlparse

import anthropic

from lora.models import BusinessProfile

try:
    import requests
    from bs4 import BeautifulSoup
    _WEB_AVAILABLE = True
except ImportError:
    _WEB_AVAILABLE = False


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM = """You are Lora, an AI CMO with 20 years of experience analyzing businesses.
You read a company's website and instantly understand their business model,
value proposition, market position, and growth opportunities.
You are precise, strategic, and never generic."""


_ANALYZE_PROMPT = """Analyze this business based on their website content below.
You are performing a CMO-level business intelligence analysis.

WEBSITE URL: {url}

WEBSITE CONTENT:
{content}

Return a JSON object with EXACTLY this structure:
{{
  "business_name": "<company name>",
  "industry": "<specific industry/vertical>",
  "business_model": "<SaaS | e-commerce | marketplace | agency | media | hardware | other>",
  "primary_product_or_service": "<one sentence description>",
  "value_proposition": "<their core promise to customers — what transformation do they offer?>",
  "key_features": ["<feature 1>", "<feature 2>", ...],
  "pricing_model": "<free | freemium | subscription | one-time | usage-based | enterprise | unknown>",
  "stage": "<pre-launch | early-stage | growth | scale | enterprise>",
  "market_size": "<description of market they're going after>",
  "main_problem_solved": "<the #1 problem they eliminate for customers>",
  "existing_customers": "<who their current customers appear to be, based on site>",
  "cmo_first_impression": "<your honest 2-sentence CMO assessment of their marketing positioning>"
}}

Be specific. Avoid generic descriptions. Extract exactly what makes THIS business unique."""


def _fetch_website(url: str, timeout: int = 10) -> str:
    """Fetch and clean website text content."""
    if not _WEB_AVAILABLE:
        return f"[Website content unavailable — install requests + beautifulsoup4]\nURL: {url}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove script/style noise
        for tag in soup(["script", "style", "noscript", "nav", "footer"]):
            tag.decompose()

        # Extract meaningful text
        text = soup.get_text(separator="\n", strip=True)
        # Collapse whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Limit to ~8,000 chars (enough for Claude to understand the business)
        return text[:8000]

    except Exception as e:
        return f"[Failed to fetch website: {e}]\nURL: {url}"


def _stream_analyze(client: anthropic.Anthropic, prompt: str) -> str:
    """Run Claude with streaming and adaptive thinking."""
    full_text = ""
    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2048,
        thinking={"type": "adaptive"},
        system=_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for event in stream:
            if (
                event.type == "content_block_delta"
                and event.delta.type == "text_delta"
            ):
                full_text += event.delta.text
    return full_text.strip()


def _parse_json(raw: str) -> dict:
    """Extract JSON from LLM output."""
    text = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start, end = text.find("{"), text.rfind("}") + 1
    if start == -1 or end == 0:
        return {}
    return json.loads(text[start:end])


class WebsiteAnalyzer:
    """
    Fetches and deeply analyzes a user's website.
    Returns a structured BusinessProfile ready for CMO strategy.
    """

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def analyze(self, user_id: str, url: str, verbose: bool = False) -> BusinessProfile:
        """
        Full website intelligence pass.

        Args:
            user_id: Unique user identifier
            url:     Website URL the user provided
            verbose: Print progress

        Returns:
            BusinessProfile populated with CMO-level intelligence.
        """
        if verbose:
            print(f"[Lora/Intelligence] Fetching {url}...")

        # Ensure URL has scheme
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        website_text = _fetch_website(url)

        if verbose:
            print(f"[Lora/Intelligence] Analyzing business... ({len(website_text)} chars fetched)")

        prompt = _ANALYZE_PROMPT.format(url=url, content=website_text)
        raw = _stream_analyze(self._client, prompt)

        try:
            data = _parse_json(raw)
        except Exception:
            data = {}

        profile = BusinessProfile(
            user_id=user_id,
            website_url=url,
            website_text=website_text,
            business_name=data.get("business_name"),
            industry=data.get("industry"),
            business_model=data.get("business_model"),
            primary_product_or_service=data.get("primary_product_or_service"),
            value_proposition=data.get("value_proposition"),
            key_features=data.get("key_features", []),
            pricing_model=data.get("pricing_model"),
            stage=data.get("stage"),
            market_size=data.get("market_size"),
            main_problem_solved=data.get("main_problem_solved"),
            existing_customers=data.get("existing_customers"),
            raw_analysis=raw,
            analyzed_at=datetime.utcnow(),
        )

        if verbose:
            print(f"[Lora/Intelligence] ✓ Business: {profile.business_name} | {profile.industry}")

        return profile
