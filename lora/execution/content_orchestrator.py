"""
Lora CMO — Content Orchestrator (Execution Layer)
Bridges Lora's CMO decisions → Nova's content creation.
Lora decides WHAT and WHY. Nova executes HOW.

For each ContentTask in a CampaignPlan, this orchestrator:
  1. Translates the CMO task into a Nova ContentRequest
  2. Injects ICP-derived BrandGuidelines
  3. Calls Nova to generate the content
  4. Marks the task as done and stores the output reference
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Callable

import anthropic

from lora.models import (
    BusinessProfile,
    ICP,
    GrowthStrategy,
    CampaignPlan,
    ContentTask,
    Channel,
)
from nova import Nova
from nova.models import (
    BrandGuidelines,
    ContentFormat,
    ContentOutput,
    InputSource,
)


# ---------------------------------------------------------------------------
# Channel → Nova ContentFormat mapping
# ---------------------------------------------------------------------------

_FORMAT_MAP: dict[str, ContentFormat] = {
    "instagram_image":    ContentFormat.INSTAGRAM_IMAGE,
    "instagram_carousel": ContentFormat.INSTAGRAM_CAROUSEL,
    "blog":               ContentFormat.BLOG,
    "email":              ContentFormat.EMAIL,
}

_CHANNEL_TO_DEFAULT_FORMAT: dict[Channel, ContentFormat] = {
    Channel.INSTAGRAM:  ContentFormat.INSTAGRAM_IMAGE,
    Channel.TWITTER_X:  ContentFormat.INSTAGRAM_IMAGE,   # short-form caption
    Channel.LINKEDIN:   ContentFormat.BLOG,
    Channel.SEO_BLOG:   ContentFormat.BLOG,
    Channel.EMAIL:      ContentFormat.EMAIL,
    Channel.TIKTOK:     ContentFormat.INSTAGRAM_CAROUSEL,
    Channel.YOUTUBE:    ContentFormat.BLOG,
    Channel.PINTEREST:  ContentFormat.INSTAGRAM_IMAGE,
}


def _build_brand_guidelines(profile: BusinessProfile, icp: ICP) -> BrandGuidelines:
    """Translate CMO ICP context → Nova BrandGuidelines."""
    return BrandGuidelines(
        brand_name=profile.business_name,
        brand_description=profile.primary_product_or_service,
        language="English",
        tone=icp.tone_of_voice,
        audience_age_range=icp.age_range,
        audience_gender=icp.gender,
        audience_location=icp.location,
        avoid_words=[],
        style_rules=icp.brand_personality,
        cta_default=None,
    )


def _resolve_format(task: ContentTask) -> ContentFormat:
    """Resolve the content format from the task."""
    if task.content_format in _FORMAT_MAP:
        return _FORMAT_MAP[task.content_format]
    return _CHANNEL_TO_DEFAULT_FORMAT.get(task.channel, ContentFormat.INSTAGRAM_IMAGE)


class ContentOrchestrator:
    """
    Executes a CampaignPlan by calling Nova for each ContentTask.
    Supports sequential and concurrent execution.
    """

    def __init__(self, client: anthropic.Anthropic):
        self._client = client
        self._nova = Nova(api_key=client.api_key)

    def execute_task(
        self,
        task: ContentTask,
        profile: BusinessProfile,
        icp: ICP,
        verbose: bool = False,
    ) -> ContentOutput:
        """
        Execute a single ContentTask → returns ContentOutput from Nova.
        Updates task.status in-place.
        """
        task.status = "generating"

        brand = _build_brand_guidelines(profile, icp)
        content_format = _resolve_format(task)

        extra_context = f"Angle: {task.angle}" if task.angle else ""
        if task.pillar:
            extra_context += f" | Content pillar: {task.pillar.value}"

        if verbose:
            print(f"\n  [Nova] Creating {content_format.value}: {task.topic[:60]}...")

        try:
            from nova.models import ContentRequest
            output = self._nova.create(
                ContentRequest(
                    topic=task.topic,
                    format=content_format,
                    source=InputSource.CONTENT_PLAN,
                    brand=brand,
                    extra_context=extra_context or None,
                ),
                verbose=False,
            )
            task.status = "done"
            task.nova_output_ref = output.raw_text[:100]  # store ref
            return output

        except Exception as e:
            task.status = "failed"
            raise RuntimeError(f"Content generation failed for task '{task.topic}': {e}") from e

    def execute_plan(
        self,
        plan: CampaignPlan,
        profile: BusinessProfile,
        icp: ICP,
        max_tasks: int | None = None,
        on_task_done: Callable[[ContentTask, ContentOutput], None] | None = None,
        verbose: bool = True,
    ) -> list[ContentOutput]:
        """
        Execute all (or up to max_tasks) tasks in a CampaignPlan sequentially.

        Args:
            plan:         The CampaignPlan with content tasks
            profile:      Business profile for brand context
            icp:          ICP for audience/tone context
            max_tasks:    Limit execution (useful for demos)
            on_task_done: Optional callback after each task completes
            verbose:      Print progress

        Returns:
            List of ContentOutput objects (one per executed task)
        """
        tasks = plan.content_tasks
        if max_tasks:
            tasks = tasks[:max_tasks]

        if verbose:
            print(f"\n[Lora/Execution] Executing plan: '{plan.name}'")
            print(f"[Lora/Execution] {len(tasks)} content tasks | channel: {plan.channel.value}")

        outputs: list[ContentOutput] = []

        for i, task in enumerate(tasks, 1):
            if verbose:
                print(f"\n[Lora/Execution] Task {i}/{len(tasks)}: [{task.channel.value}] {task.topic[:70]}")

            try:
                output = self.execute_task(task, profile, icp, verbose=verbose)
                outputs.append(output)
                if on_task_done:
                    on_task_done(task, output)
                if verbose:
                    print(f"  ✓ Done — {task.content_format}")
            except Exception as e:
                if verbose:
                    print(f"  ✗ Failed: {e}")

        plan.status = "active" if outputs else "paused"

        if verbose:
            print(f"\n[Lora/Execution] ✓ Completed {len(outputs)}/{len(tasks)} tasks")

        return outputs
