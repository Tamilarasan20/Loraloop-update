"""
Lora CMO — Decision Engine
The autonomous CMO brain.
Given a growth strategy → decides exactly WHAT to create, WHEN, and WHY.
Produces a concrete weekly CampaignPlan with content tasks for Nova to execute.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta

import anthropic

from lora.models import (
    BusinessProfile,
    ICP,
    GrowthStrategy,
    CampaignPlan,
    ContentTask,
    Channel,
    ContentPillar,
    CampaignStatus,
)


_SYSTEM = """You are Lora, the AI CMO decision engine.
You translate growth strategy into a concrete weekly content execution plan.
Every decision you make has a strategic reason.
You don't just say 'post more content' — you say EXACTLY what to post, on which day,
with what angle, for what strategic purpose."""


_PLAN_PROMPT = """Create a concrete weekly content plan for this business.

GROWTH STRATEGY:
- Goal: {goal}
- Core Narrative: {narrative}
- Primary Channel: {channel}
- Weekly Volume: {volume} pieces
- Content Pillars: {pillars}
- Hero Topics: {topics}
- Posting Frequency: {frequency}

BRAND CONTEXT:
- Business: {name}
- Value Prop: {value_prop}
- ICP: {icp_role}
- Top Pain: {pain}
- Tone: {tone}
- Messaging Angles: {angles}

WEEK STARTING: {week_start}

Create a 7-day content plan. Each item is a specific piece of content to create.
Be specific about topic and angle — not generic.

Return EXACTLY this JSON:
{{
  "campaign_name": "<theme for this week>",
  "objective": "<what this week's content is designed to achieve>",
  "content_tasks": [
    {{
      "day": "<Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday>",
      "channel": "<channel from: instagram | twitter_x | linkedin | tiktok | seo_blog | email>",
      "content_format": "<instagram_image | instagram_carousel | blog | email>",
      "topic": "<specific topic — not generic>",
      "angle": "<the specific messaging angle or hook to use>",
      "pillar": "<education | authority | engagement | conversion | retention>",
      "priority": <1-5, 1=highest>,
      "strategic_reason": "<why this piece serves the growth goal>"
    }}
  ],
  "target_kpi": "<what success looks like this week>"
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


_DAY_OFFSETS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}


class DecisionEngine:
    """
    The CMO brain.
    Autonomously decides what content to create each week.
    """

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def create_weekly_plan(
        self,
        profile: BusinessProfile,
        icp: ICP,
        strategy: GrowthStrategy,
        week_start: datetime | None = None,
        verbose: bool = False,
    ) -> CampaignPlan:
        if verbose:
            print("[Lora/Decision] Creating weekly content plan...")

        week_start = week_start or datetime.utcnow()

        # Find frequency for primary channel
        freq = "5x/week"
        for cs in strategy.channel_strategies:
            if cs.channel == strategy.primary_channel:
                freq = cs.posting_frequency
                break

        prompt = _PLAN_PROMPT.format(
            goal=strategy.growth_goal,
            narrative=strategy.core_narrative,
            channel=strategy.primary_channel.value,
            volume=strategy.weekly_content_volume,
            pillars=", ".join(p.value for p in strategy.content_pillars),
            topics="\n".join(f"- {t}" for t in strategy.hero_topics[:10]),
            frequency=freq,
            name=profile.business_name or "Unknown",
            value_prop=profile.value_proposition or "Unknown",
            icp_role=icp.job_title_or_role or "Unknown",
            pain=icp.pain_points[0] if icp.pain_points else "Unknown",
            tone=icp.tone_of_voice,
            angles="\n".join(f"- {a}" for a in icp.messaging_angles[:5]),
            week_start=week_start.strftime("%B %d, %Y"),
        )

        raw = _stream_analyze(self._client, prompt)

        try:
            data = _parse_json(raw)
        except Exception:
            data = {}

        tasks = []
        for item in data.get("content_tasks", []):
            day = item.get("day", "Monday").lower()
            offset = _DAY_OFFSETS.get(day, 0)
            scheduled = week_start + timedelta(days=offset)

            tasks.append(ContentTask(
                task_id=str(uuid.uuid4()),
                user_id=profile.user_id,
                channel=_safe_channel(item.get("channel", "instagram")),
                content_format=item.get("content_format", "instagram_image"),
                topic=item.get("topic", ""),
                angle=item.get("angle", ""),
                pillar=_safe_pillar(item.get("pillar", "education")),
                priority=item.get("priority", 3),
                scheduled_for=scheduled,
                status="pending",
            ))

        # Sort by priority then date
        tasks.sort(key=lambda t: (t.priority, t.scheduled_for or datetime.max))

        plan = CampaignPlan(
            campaign_id=str(uuid.uuid4()),
            user_id=profile.user_id,
            name=data.get("campaign_name", f"Week of {week_start.strftime('%b %d')}"),
            objective=data.get("objective", strategy.growth_goal),
            channel=strategy.primary_channel,
            start_date=week_start,
            end_date=week_start + timedelta(days=6),
            status=CampaignStatus.PLANNED,
            content_tasks=tasks,
            target_kpi=data.get("target_kpi", strategy.primary_kpi),
            raw_plan=raw,
            created_at=datetime.utcnow(),
        )

        if verbose:
            print(f"[Lora/Decision] ✓ Plan: '{plan.name}' | {len(tasks)} content tasks")

        return plan
