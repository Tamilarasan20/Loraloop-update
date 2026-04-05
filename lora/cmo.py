"""
Lora — AI Autonomous CMO Agent
The top-level orchestrator. One Lora instance per user.
Thinks and acts like a Chief Marketing Officer — autonomously.

Full CMO Loop:
  Analyze Business → Build ICP → Map Competitors
      → Decide Strategy → Create Weekly Plan
          → Execute via Nova → Measure → Adapt → Repeat

Multi-Tenancy:
  Each user has an isolated UserCMOContext stored in ProfileStore.
  Lora is instantiated once and serves any number of users.
"""

from __future__ import annotations

import os
from datetime import datetime

import anthropic

from lora.models import (
    UserCMOContext,
    PerformanceSnapshot,
    PerformanceMetric,
    StrategyUpdate,
    CampaignPlan,
)
from lora.intelligence.website_analyzer import WebsiteAnalyzer
from lora.intelligence.icp_builder import ICPBuilder
from lora.intelligence.competitor_intel import CompetitorAnalyzer
from lora.strategy.growth_engine import GrowthEngine
from lora.strategy.decision_engine import DecisionEngine
from lora.execution.content_orchestrator import ContentOrchestrator
from lora.feedback.optimizer import PerformanceOptimizer
from lora.storage.profile_store import ProfileStore
from nova import Nova
from nova.models import ContentOutput


class Lora:
    """
    Lora — AI Autonomous CMO Agent.

    Usage (single user):
        lora = Lora()
        ctx = lora.onboard("user_123", "https://example.com")
        plan = lora.plan_week("user_123")
        outputs = lora.execute("user_123", plan, max_tasks=3)

    Usage (multi-user, scalable):
        lora = Lora()
        for user_id, url in user_list:
            ctx = lora.onboard(user_id, url)
            plan = lora.plan_week(user_id)
            lora.execute(user_id, plan)
    """

    def __init__(
        self,
        api_key: str | None = None,
        store_dir: str = ".lora_data",
    ):
        self._client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )
        self._store       = ProfileStore(base_dir=store_dir)
        self._analyzer    = WebsiteAnalyzer(self._client)
        self._icp_builder = ICPBuilder(self._client)
        self._comp_intel  = CompetitorAnalyzer(self._client)
        self._growth      = GrowthEngine(self._client)
        self._decisions   = DecisionEngine(self._client)
        self._executor    = ContentOrchestrator(self._client)
        self._optimizer   = PerformanceOptimizer(self._client)

    # ------------------------------------------------------------------
    # Step 1 — Onboard a new user (or re-analyze an existing one)
    # ------------------------------------------------------------------

    def onboard(
        self,
        user_id: str,
        website_url: str,
        force_reanalyze: bool = False,
        verbose: bool = True,
    ) -> UserCMOContext:
        """
        Full CMO onboarding for one user.

        Fetches their website, builds BusinessProfile + ICP +
        CompetitiveReport + GrowthStrategy.
        Idempotent — if already onboarded, returns cached context
        unless force_reanalyze=True.

        Args:
            user_id:         Unique user identifier
            website_url:     The user's business website
            force_reanalyze: Re-run full analysis even if already onboarded
            verbose:         Print step-by-step progress

        Returns:
            Fully populated UserCMOContext
        """
        ctx = self._store.get_or_create(user_id, website_url)

        if ctx.is_onboarded and not force_reanalyze:
            if verbose:
                print(f"[Lora] ✓ User {user_id} already onboarded. Loading from store.")
            return ctx

        if verbose:
            print(f"\n{'='*60}")
            print(f"[Lora] 🧠 Starting CMO onboarding for user: {user_id}")
            print(f"[Lora] Website: {website_url}")
            print(f"{'='*60}")

        # ── Step 1.1: Business Intelligence ──────────────────────────
        ctx.business_profile = self._analyzer.analyze(user_id, website_url, verbose=verbose)

        # ── Step 1.2: ICP + Positioning ──────────────────────────────
        ctx.icp = self._icp_builder.build(ctx.business_profile, verbose=verbose)

        # ── Step 1.3: Competitive Intelligence ───────────────────────
        ctx.competitive_report = self._comp_intel.analyze(
            ctx.business_profile, ctx.icp, verbose=verbose
        )

        # ── Step 1.4: Growth Strategy ────────────────────────────────
        ctx.growth_strategy = self._growth.build_strategy(
            ctx.business_profile,
            ctx.icp,
            ctx.competitive_report,
            verbose=verbose,
        )

        ctx.onboarded_at = datetime.utcnow()
        self._store.save(ctx)

        if verbose:
            self._print_onboarding_summary(ctx)

        return ctx

    # ------------------------------------------------------------------
    # Step 2 — Plan the next week of content
    # ------------------------------------------------------------------

    def plan_week(
        self,
        user_id: str,
        week_start: datetime | None = None,
        verbose: bool = True,
    ) -> CampaignPlan:
        """
        Autonomously decide the content plan for the coming week.
        Returns a CampaignPlan with prioritized ContentTasks for Nova.
        """
        ctx = self._require_context(user_id)

        plan = self._decisions.create_weekly_plan(
            ctx.business_profile,
            ctx.icp,
            ctx.growth_strategy,
            week_start=week_start,
            verbose=verbose,
        )

        ctx.active_campaigns.append(plan)
        self._store.save(ctx)

        return plan

    # ------------------------------------------------------------------
    # Step 3 — Execute plan via Nova
    # ------------------------------------------------------------------

    def execute(
        self,
        user_id: str,
        plan: CampaignPlan,
        max_tasks: int | None = None,
        verbose: bool = True,
    ) -> list[ContentOutput]:
        """
        Execute a CampaignPlan — calls Nova for each content task.
        Returns all generated ContentOutput objects.
        """
        ctx = self._require_context(user_id)

        outputs = self._executor.execute_plan(
            plan=plan,
            profile=ctx.business_profile,
            icp=ctx.icp,
            max_tasks=max_tasks,
            verbose=verbose,
        )

        self._store.save(ctx)
        return outputs

    # ------------------------------------------------------------------
    # Step 4 — Feedback & optimization
    # ------------------------------------------------------------------

    def optimize(
        self,
        user_id: str,
        metrics: list[PerformanceMetric],
        verbose: bool = True,
    ) -> StrategyUpdate:
        """
        Feed performance metrics back to Lora.
        Lora analyzes and updates strategy for the next cycle.

        Args:
            user_id:  User to optimize for
            metrics:  List of PerformanceMetric objects
            verbose:  Print analysis

        Returns:
            StrategyUpdate with specific changes and directives.
        """
        ctx = self._require_context(user_id)

        snapshot = PerformanceSnapshot(
            user_id=user_id,
            metrics=metrics,
        )
        ctx.performance_history.append(snapshot)

        update = self._optimizer.optimize(
            ctx.growth_strategy, ctx.icp, snapshot, verbose=verbose
        )
        ctx.strategy_updates.append(update)

        # Apply the update to the live strategy
        ctx.growth_strategy = self._optimizer.apply_update(
            ctx.growth_strategy, update, verbose=verbose
        )

        self._store.save(ctx)
        return update

    # ------------------------------------------------------------------
    # Full autonomous CMO loop (convenience method)
    # ------------------------------------------------------------------

    def run_cmo_loop(
        self,
        user_id: str,
        website_url: str,
        max_content_tasks: int = 3,
        verbose: bool = True,
    ) -> dict:
        """
        Run the complete CMO loop for one user end-to-end:
        Onboard → Plan → Execute → Return results.

        Args:
            user_id:           User identifier
            website_url:       User's website
            max_content_tasks: Limit content creation for demo/testing
            verbose:           Print all progress

        Returns:
            Dict with ctx, plan, and outputs
        """
        ctx     = self.onboard(user_id, website_url, verbose=verbose)
        plan    = self.plan_week(user_id, verbose=verbose)
        outputs = self.execute(user_id, plan, max_tasks=max_content_tasks, verbose=verbose)

        return {
            "context": ctx,
            "plan":    plan,
            "outputs": outputs,
        }

    # ------------------------------------------------------------------
    # Multi-user batch processing (scalable)
    # ------------------------------------------------------------------

    def run_batch(
        self,
        users: list[tuple[str, str]],
        max_content_tasks: int = 2,
        verbose: bool = True,
    ) -> dict[str, dict]:
        """
        Run the CMO loop for multiple users sequentially.
        In production: parallelize with ThreadPoolExecutor or Celery tasks.

        Args:
            users:             List of (user_id, website_url) tuples
            max_content_tasks: Content tasks to generate per user
            verbose:           Print progress

        Returns:
            Dict of {user_id: {context, plan, outputs}}
        """
        results = {}
        for i, (user_id, url) in enumerate(users, 1):
            if verbose:
                print(f"\n{'#'*60}")
                print(f"# USER {i}/{len(users)}: {user_id}")
                print(f"{'#'*60}")
            try:
                results[user_id] = self.run_cmo_loop(
                    user_id=user_id,
                    website_url=url,
                    max_content_tasks=max_content_tasks,
                    verbose=verbose,
                )
            except Exception as e:
                if verbose:
                    print(f"[Lora] ✗ Failed for {user_id}: {e}")
                results[user_id] = {"error": str(e)}

        return results

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------

    def get_context(self, user_id: str) -> UserCMOContext | None:
        """Load the current CMO context for a user."""
        return self._store.load(user_id)

    def store_stats(self) -> dict:
        """Return multi-tenant store statistics."""
        return self._store.stats()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _require_context(self, user_id: str) -> UserCMOContext:
        ctx = self._store.load(user_id)
        if not ctx or not ctx.is_onboarded:
            raise RuntimeError(
                f"User '{user_id}' is not onboarded. Call lora.onboard(user_id, url) first."
            )
        return ctx

    def _print_onboarding_summary(self, ctx: UserCMOContext) -> None:
        bp = ctx.business_profile
        icp = ctx.icp
        st = ctx.growth_strategy

        print(f"\n{'='*60}")
        print("🎯  LORA CMO ONBOARDING COMPLETE")
        print(f"{'='*60}")
        print(f"  Business:    {bp.business_name} ({bp.industry})")
        print(f"  Model:       {bp.business_model} | Stage: {bp.stage}")
        print(f"  Value Prop:  {bp.value_proposition}")
        print()
        print(f"  ICP:         {icp.job_title_or_role}, {icp.age_range}")
        print(f"  Top Pain:    {icp.pain_points[0] if icp.pain_points else '—'}")
        print(f"  Positioning: {icp.positioning_statement[:80]}...")
        print()
        print(f"  Goal:        {st.growth_goal}")
        print(f"  Channel:     {st.primary_channel.value}")
        print(f"  Narrative:   {st.core_narrative[:80]}...")
        print(f"  Vol/week:    {st.weekly_content_volume} pieces")
        print(f"{'='*60}\n")
