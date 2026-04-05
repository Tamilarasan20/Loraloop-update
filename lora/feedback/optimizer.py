"""
Lora CMO — Feedback & Optimization Loop
Reads performance metrics → updates strategy.
This is what makes Lora adaptive like a real CMO.

Flow:
  PerformanceSnapshot → Lora analyzes → StrategyUpdate
  → GrowthStrategy is updated → next CampaignPlan is smarter
"""

from __future__ import annotations

import json
import re
from datetime import datetime

import anthropic

from lora.models import (
    GrowthStrategy,
    ICP,
    PerformanceSnapshot,
    PerformanceMetric,
    StrategyUpdate,
)


_SYSTEM = """You are Lora, an adaptive AI CMO.
You analyze marketing performance data and update strategy in real-time.
You don't just describe what happened — you make specific directional decisions:
double down on what's working, cut what isn't, and pivot where needed."""


_OPTIMIZE_PROMPT = """Analyze these marketing performance metrics and update the strategy.

CURRENT STRATEGY:
- Goal: {goal}
- Primary Channel: {channel}
- Core Narrative: {narrative}
- Weekly Volume: {volume} pieces/week
- Primary KPI: {kpi}

PERFORMANCE METRICS:
{metrics}

CURRENT ICP MESSAGING ANGLES:
{angles}

CMO ANALYSIS REQUIRED:
1. What's working? (double down)
2. What's failing? (cut or pivot)
3. What specific changes to make to strategy?
4. Any messaging angle adjustments?

Return EXACTLY this JSON:
{{
  "summary": "<2-3 sentence CMO assessment of overall performance>",
  "changes": [
    "<specific change 1 — e.g. 'Reduce Instagram image posts from 3x to 2x/week'>",
    "<change 2>",
    "<change 3>"
  ],
  "new_directives": [
    "<directive 1: specific action to take this week>",
    "<directive 2>",
    "<directive 3>"
  ],
  "channel_adjustments": {{
    "<channel>": "<increase|decrease|maintain|pivot> — with reason"
  }},
  "messaging_update": "<if messaging angles should change, describe the new angle>",
  "confidence": "<high|medium|low — based on data quality>"
}}"""


def _stream_analyze(client: anthropic.Anthropic, prompt: str) -> str:
    full_text = ""
    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2000,
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


def _format_metrics(snapshot: PerformanceSnapshot) -> str:
    if not snapshot.metrics:
        return "No metrics provided yet."
    lines = []
    for m in snapshot.metrics:
        lines.append(
            f"- [{m.channel.value}] {m.signal.value}: {m.value} ({m.period})"
            + (f" — {m.note}" if m.note else "")
        )
    return "\n".join(lines)


class PerformanceOptimizer:
    """
    Reads performance data and produces strategy updates.
    Called after each campaign cycle completes.
    """

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def optimize(
        self,
        strategy: GrowthStrategy,
        icp: ICP,
        snapshot: PerformanceSnapshot,
        verbose: bool = False,
    ) -> StrategyUpdate:
        """
        Analyze performance and produce strategy update directives.

        Args:
            strategy: Current growth strategy
            icp:      ICP for messaging context
            snapshot: Performance metrics snapshot
            verbose:  Print progress

        Returns:
            StrategyUpdate with specific changes and directives.
        """
        if verbose:
            print("\n[Lora/Optimizer] Analyzing performance and updating strategy...")

        prompt = _OPTIMIZE_PROMPT.format(
            goal=strategy.growth_goal,
            channel=strategy.primary_channel.value,
            narrative=strategy.core_narrative,
            volume=strategy.weekly_content_volume,
            kpi=strategy.primary_kpi,
            metrics=_format_metrics(snapshot),
            angles="\n".join(f"- {a}" for a in icp.messaging_angles[:5]),
        )

        raw = _stream_analyze(self._client, prompt)

        try:
            data = _parse_json(raw)
        except Exception:
            data = {}

        update = StrategyUpdate(
            user_id=strategy.user_id,
            summary=data.get("summary", "Performance analysis complete."),
            changes=data.get("changes", []),
            new_directives=data.get("new_directives", []),
            raw_analysis=raw,
            updated_at=datetime.utcnow(),
        )

        if verbose:
            print(f"[Lora/Optimizer] ✓ {len(update.changes)} changes | {len(update.new_directives)} directives")
            print(f"[Lora/Optimizer]   {update.summary[:120]}...")

        return update

    def apply_update(
        self,
        strategy: GrowthStrategy,
        update: StrategyUpdate,
        verbose: bool = False,
    ) -> GrowthStrategy:
        """
        Apply a StrategyUpdate to the current GrowthStrategy.
        Returns the updated strategy (immutable style — creates new object).
        """
        # For now: log the changes and return the strategy
        # In production: parse update.changes and mutate strategy fields
        if verbose:
            print("\n[Lora/Optimizer] Applying strategy updates:")
            for change in update.changes:
                print(f"  → {change}")
            print("\n[Lora/Optimizer] New directives for next week:")
            for directive in update.new_directives:
                print(f"  ★ {directive}")

        # Update narrative if needed (extend to full mutation as product grows)
        updated_strategy = strategy.model_copy(deep=True)
        if update.new_directives:
            # Prepend latest directive to hero topics for next cycle
            new_topics = update.new_directives[:3] + updated_strategy.hero_topics
            updated_strategy.hero_topics = new_topics[:10]

        return updated_strategy
