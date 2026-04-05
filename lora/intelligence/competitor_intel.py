"""
Lora CMO — Competitive Intelligence Engine
Analyzes the competitive landscape from business context.
Finds gaps, winning angles, and positioning opportunities.
"""

from __future__ import annotations

import json
import re
from datetime import datetime

import anthropic

from lora.models import BusinessProfile, ICP, CompetitorProfile, CompetitiveReport


_SYSTEM = """You are Lora, an AI CMO specializing in competitive strategy.
You identify market gaps competitors are missing, angles they're weak on,
and positioning opportunities your client can dominate.
You think like a war room strategist, not a market researcher."""


_COMPETITOR_PROMPT = """Perform a competitive intelligence analysis for this business.

BUSINESS CONTEXT:
- Business: {name}
- Industry: {industry}
- Value Prop: {value_prop}
- Differentiators: {differentiators}
- ICP: {icp_role}, pain: {pain}
- Positioning: {positioning}

TASK: Based on this industry and business type, identify the likely top competitors
and analyze the competitive landscape from a CMO perspective.
Find gaps, vulnerabilities, and opportunities.

Return EXACTLY this JSON:
{{
  "competitors": [
    {{
      "name": "<competitor name>",
      "website": "<website if known>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "weaknesses": ["<weakness 1>", "<weakness 2>"],
      "content_strategy": "<how they market — brief description>",
      "key_messages": ["<message they repeat>", "<message 2>"],
      "channels": ["<channel 1>", "<channel 2>"]
    }}
  ],
  "market_gaps": [
    "<gap 1: what the entire market fails to address>",
    "<gap 2>",
    "<gap 3>"
  ],
  "winning_angles": [
    "<angle 1: where this business can dominate vs competitors>",
    "<angle 2>",
    "<angle 3>"
  ],
  "threats": [
    "<threat 1: what could hurt this business>",
    "<threat 2>"
  ],
  "recommendations": [
    "<CMO recommendation 1: specific action to out-position competitors>",
    "<recommendation 2>",
    "<recommendation 3>"
  ]
}}"""


def _stream_analyze(client: anthropic.Anthropic, prompt: str) -> str:
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
    text = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start, end = text.find("{"), text.rfind("}") + 1
    if start == -1 or end == 0:
        return {}
    return json.loads(text[start:end])


class CompetitorAnalyzer:
    """Generates competitive intelligence from business + ICP context."""

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def analyze(
        self,
        profile: BusinessProfile,
        icp: ICP,
        verbose: bool = False,
    ) -> CompetitiveReport:
        if verbose:
            print("[Lora/Competitive] Analyzing competitive landscape...")

        prompt = _COMPETITOR_PROMPT.format(
            name=profile.business_name or "Unknown",
            industry=profile.industry or "Unknown",
            value_prop=profile.value_proposition or "Unknown",
            differentiators=", ".join(icp.unique_differentiators) or "Unknown",
            icp_role=icp.job_title_or_role or "Unknown",
            pain=icp.pain_points[0] if icp.pain_points else "Unknown",
            positioning=icp.positioning_statement or "Unknown",
        )

        raw = _stream_analyze(self._client, prompt)

        try:
            data = _parse_json(raw)
        except Exception:
            data = {}

        competitors = [
            CompetitorProfile(
                name=c.get("name", "Unknown"),
                website=c.get("website"),
                strengths=c.get("strengths", []),
                weaknesses=c.get("weaknesses", []),
                content_strategy=c.get("content_strategy"),
                key_messages=c.get("key_messages", []),
                channels=c.get("channels", []),
            )
            for c in data.get("competitors", [])
        ]

        report = CompetitiveReport(
            user_id=profile.user_id,
            competitors=competitors,
            market_gaps=data.get("market_gaps", []),
            winning_angles=data.get("winning_angles", []),
            threats=data.get("threats", []),
            recommendations=data.get("recommendations", []),
            raw_analysis=raw,
            analyzed_at=datetime.utcnow(),
        )

        if verbose:
            print(f"[Lora/Competitive] ✓ {len(competitors)} competitors | {len(report.market_gaps)} gaps found")

        return report
