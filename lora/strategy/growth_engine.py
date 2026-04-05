"""
Lora CMO — Growth Strategy Engine
The brain that decides WHERE to play, HOW to play, and WHAT to say.
Channel selection, content pillars, weekly cadence — all autonomous CMO decisions.
"""

from __future__ import annotations

import json
import re
from datetime import datetime

import anthropic

from lora.models import (
    BusinessProfile,
    ICP,
    CompetitiveReport,
    Channel,
    ChannelStrategy,
    ContentPillar,
    GrowthStrategy,
)


_SYSTEM = """You are Lora, an autonomous AI CMO.
You make strategic decisions about where a business should invest its marketing energy,
what channels to prioritize, and what content to create — based on their business stage,
ICP, competitive landscape, and growth goals.
You are decisive. You pick winners, not safe answers."""


_STRATEGY_PROMPT = """Build a complete CMO-level growth strategy for this business.

BUSINESS CONTEXT:
- Name: {name}
- Stage: {stage}
- Model: {model}
- Value Prop: {value_prop}
- Main Problem Solved: {problem}

ICP CONTEXT:
- Role: {icp_role}
- Age: {age}
- Location: {location}
- Top Pain: {pain}
- Top Motivation: {motivation}
- Positioning: {positioning}
- Tone: {tone}

COMPETITIVE CONTEXT:
- Market Gaps: {gaps}
- Winning Angles: {winning_angles}
- Competitor Threats: {threats}

STRATEGIC DECISIONS TO MAKE:
1. Which 2-3 channels to dominate (not spread thin)
2. Primary growth goal (specific, time-bound)
3. Core narrative (the single story to own)
4. Content pillars and weekly volume
5. KPIs to track

Return EXACTLY this JSON:
{{
  "growth_goal": "<specific measurable goal — e.g. '500 → 5,000 Instagram followers in 90 days' or '10 demo bookings/week'>",
  "primary_channel": "<channel from: instagram | twitter_x | linkedin | tiktok | seo_blog | email | youtube>",
  "core_narrative": "<the single story/theme to repeat across all content — 1-2 sentences>",
  "content_pillars": ["<pillar from: education | authority | engagement | conversion | retention>", ...],
  "hero_topics": [
    "<topic 1: specific content territory to own>",
    "<topic 2>",
    "<topic 3>",
    "<topic 4>",
    "<topic 5>",
    "<topic 6>",
    "<topic 7>",
    "<topic 8>",
    "<topic 9>",
    "<topic 10>"
  ],
  "weekly_content_volume": <integer — total pieces across all channels>,
  "campaign_cadence": "<e.g. '1 campaign/month, 4 weekly themes'>",
  "primary_kpi": "<the one metric that proves growth strategy is working>",
  "secondary_kpis": ["<kpi 2>", "<kpi 3>"],
  "channel_strategies": [
    {{
      "channel": "<channel name>",
      "priority": <1-3>,
      "rationale": "<why this channel for this ICP>",
      "posting_frequency": "<e.g. '5x/week'>",
      "content_mix": {{
        "education": <percentage>,
        "authority": <percentage>,
        "engagement": <percentage>,
        "conversion": <percentage>
      }},
      "kpi": "<channel-specific KPI>"
    }}
  ]
}}"""


def _stream_analyze(client: anthropic.Anthropic, prompt: str) -> str:
    full_text = ""
    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=3000,
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


def _safe_channel(val: str) -> Channel:
    try:
        return Channel(val.lower())
    except ValueError:
        return Channel.INSTAGRAM


def _safe_pillar(val: str) -> ContentPillar:
    try:
        return ContentPillar(val.lower())
    except ValueError:
        return ContentPillar.EDUCATION


class GrowthEngine:
    """Builds the complete autonomous CMO growth strategy."""

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def build_strategy(
        self,
        profile: BusinessProfile,
        icp: ICP,
        competitive_report: CompetitiveReport,
        verbose: bool = False,
    ) -> GrowthStrategy:
        if verbose:
            print("[Lora/Strategy] Building CMO growth strategy...")

        prompt = _STRATEGY_PROMPT.format(
            name=profile.business_name or "Unknown",
            stage=profile.stage or "Unknown",
            model=profile.business_model or "Unknown",
            value_prop=profile.value_proposition or "Unknown",
            problem=profile.main_problem_solved or "Unknown",
            icp_role=icp.job_title_or_role or "Unknown",
            age=icp.age_range or "Unknown",
            location=icp.location or "Unknown",
            pain=icp.pain_points[0] if icp.pain_points else "Unknown",
            motivation=icp.motivations[0] if icp.motivations else "Unknown",
            positioning=icp.positioning_statement or "Unknown",
            tone=icp.tone_of_voice,
            gaps="\n".join(f"- {g}" for g in competitive_report.market_gaps) or "None identified",
            winning_angles="\n".join(f"- {a}" for a in competitive_report.winning_angles) or "None identified",
            threats="\n".join(f"- {t}" for t in competitive_report.threats) or "None identified",
        )

        raw = _stream_analyze(self._client, prompt)

        try:
            data = _parse_json(raw)
        except Exception:
            data = {}

        channel_strategies = [
            ChannelStrategy(
                channel=_safe_channel(cs.get("channel", "instagram")),
                priority=cs.get("priority", 1),
                rationale=cs.get("rationale", ""),
                posting_frequency=cs.get("posting_frequency", ""),
                content_mix=cs.get("content_mix", {}),
                kpi=cs.get("kpi", ""),
            )
            for cs in data.get("channel_strategies", [])
        ]

        pillars = [_safe_pillar(p) for p in data.get("content_pillars", [])]
        if not pillars:
            pillars = [ContentPillar.EDUCATION, ContentPillar.AUTHORITY, ContentPillar.CONVERSION]

        strategy = GrowthStrategy(
            user_id=profile.user_id,
            growth_goal=data.get("growth_goal", "Grow brand presence and generate leads"),
            primary_channel=_safe_channel(data.get("primary_channel", "instagram")),
            channel_strategies=channel_strategies,
            core_narrative=data.get("core_narrative", ""),
            content_pillars=pillars,
            hero_topics=data.get("hero_topics", []),
            weekly_content_volume=data.get("weekly_content_volume", 7),
            campaign_cadence=data.get("campaign_cadence", "1 campaign/month"),
            primary_kpi=data.get("primary_kpi", "Engagement rate"),
            secondary_kpis=data.get("secondary_kpis", []),
            raw_analysis=raw,
            created_at=datetime.utcnow(),
        )

        if verbose:
            print(f"[Lora/Strategy] ✓ Goal: {strategy.growth_goal}")
            print(f"[Lora/Strategy] ✓ Primary channel: {strategy.primary_channel.value}")
            print(f"[Lora/Strategy] ✓ Weekly volume: {strategy.weekly_content_volume} pieces")

        return strategy
