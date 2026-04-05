"""
Lora CMO — Data Models
Every object Lora thinks about, decides on, and acts upon.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Channel(str, Enum):
    INSTAGRAM  = "instagram"
    TWITTER_X  = "twitter_x"
    LINKEDIN   = "linkedin"
    TIKTOK     = "tiktok"
    SEO_BLOG   = "seo_blog"
    EMAIL      = "email"
    YOUTUBE    = "youtube"
    PINTEREST  = "pinterest"


class ContentPillar(str, Enum):
    EDUCATION    = "education"      # teach your audience
    AUTHORITY    = "authority"      # build credibility
    ENGAGEMENT   = "engagement"     # drive interaction
    CONVERSION   = "conversion"     # drive sales/sign-ups
    RETENTION    = "retention"      # keep existing users


class CampaignStatus(str, Enum):
    PLANNED    = "planned"
    ACTIVE     = "active"
    COMPLETED  = "completed"
    PAUSED     = "paused"


class FeedbackSignal(str, Enum):
    VIEWS        = "views"
    ENGAGEMENT   = "engagement"
    CONVERSIONS  = "conversions"
    FOLLOWER_GROWTH = "follower_growth"
    REVENUE      = "revenue"


# ---------------------------------------------------------------------------
# Business Intelligence
# ---------------------------------------------------------------------------

class BusinessProfile(BaseModel):
    """
    What Lora learns about the user's business from their website.
    This is the foundation for ALL CMO decisions.
    """
    user_id: str
    website_url: str

    # Core business understanding
    business_name: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None       # SaaS, e-commerce, service, etc.
    primary_product_or_service: Optional[str] = None
    value_proposition: Optional[str] = None
    key_features: list[str] = Field(default_factory=list)
    pricing_model: Optional[str] = None
    stage: Optional[str] = None               # early-stage, growth, scale

    # Market context
    market_size: Optional[str] = None
    main_problem_solved: Optional[str] = None
    existing_customers: Optional[str] = None  # description if found

    # Raw website content (for LLM context)
    website_text: str = ""

    # Metadata
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    raw_analysis: str = ""


class ICP(BaseModel):
    """
    Ideal Customer Profile — who Lora targets.
    """
    user_id: str

    # Demographics
    age_range: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    job_title_or_role: Optional[str] = None
    company_size: Optional[str] = None

    # Psychographics
    goals: list[str] = Field(default_factory=list)
    pain_points: list[str] = Field(default_factory=list)
    motivations: list[str] = Field(default_factory=list)
    buying_triggers: list[str] = Field(default_factory=list)

    # Positioning
    positioning_statement: str = ""
    unique_differentiators: list[str] = Field(default_factory=list)
    messaging_angles: list[str] = Field(
        default_factory=list,
        description="Top 3-5 angles to hit repeatedly in content"
    )
    tone_of_voice: str = "professional yet approachable"
    brand_personality: list[str] = Field(default_factory=list)

    raw_analysis: str = ""
    built_at: datetime = Field(default_factory=datetime.utcnow)


class CompetitorProfile(BaseModel):
    name: str
    website: Optional[str] = None
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    content_strategy: Optional[str] = None
    key_messages: list[str] = Field(default_factory=list)
    channels: list[str] = Field(default_factory=list)


class CompetitiveReport(BaseModel):
    user_id: str
    competitors: list[CompetitorProfile] = Field(default_factory=list)
    market_gaps: list[str] = Field(default_factory=list)
    winning_angles: list[str] = Field(default_factory=list)
    threats: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    raw_analysis: str = ""


# ---------------------------------------------------------------------------
# Growth Strategy
# ---------------------------------------------------------------------------

class ChannelStrategy(BaseModel):
    channel: Channel
    priority: int = Field(..., description="1=highest, 5=lowest")
    rationale: str = ""
    posting_frequency: str = ""            # e.g. "3x per week"
    content_mix: dict[str, int] = Field(  # pillar → % allocation
        default_factory=dict,
        description="ContentPillar value → % (should sum to 100)"
    )
    kpi: str = ""                          # primary KPI for this channel


class GrowthStrategy(BaseModel):
    """
    Lora's autonomous strategic decision for this business.
    This is the CMO brain output.
    """
    user_id: str

    # Strategic direction
    growth_goal: str = ""                  # e.g. "1,000 → 5,000 followers in 90 days"
    primary_channel: Channel = Channel.INSTAGRAM
    channel_strategies: list[ChannelStrategy] = Field(default_factory=list)

    # Messaging framework
    core_narrative: str = ""              # the single story to tell
    content_pillars: list[ContentPillar] = Field(default_factory=list)
    hero_topics: list[str] = Field(       # top 10 content topics to own
        default_factory=list
    )

    # Execution cadence
    weekly_content_volume: int = 0       # total pieces/week across channels
    campaign_cadence: str = ""           # e.g. "1 campaign/month"

    # Success metrics
    primary_kpi: str = ""
    secondary_kpis: list[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    raw_analysis: str = ""


# ---------------------------------------------------------------------------
# Campaign & Content Planning
# ---------------------------------------------------------------------------

class ContentTask(BaseModel):
    """A single piece of content to be created by Nova."""
    task_id: str
    user_id: str
    channel: Channel
    content_format: str             # maps to nova.models.ContentFormat value
    topic: str
    angle: str = ""
    pillar: ContentPillar = ContentPillar.EDUCATION
    priority: int = 1
    scheduled_for: Optional[datetime] = None
    status: str = "pending"         # pending | generating | done | failed
    nova_output_ref: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CampaignPlan(BaseModel):
    """
    A time-bound marketing campaign with content tasks.
    Lora creates one per week/month.
    """
    campaign_id: str
    user_id: str
    name: str
    objective: str
    channel: Channel
    start_date: datetime
    end_date: datetime
    status: CampaignStatus = CampaignStatus.PLANNED
    content_tasks: list[ContentTask] = Field(default_factory=list)
    target_kpi: str = ""
    raw_plan: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Performance & Feedback
# ---------------------------------------------------------------------------

class PerformanceMetric(BaseModel):
    channel: Channel
    signal: FeedbackSignal
    value: float
    period: str    # e.g. "last_7_days"
    note: Optional[str] = None


class PerformanceSnapshot(BaseModel):
    user_id: str
    metrics: list[PerformanceMetric] = Field(default_factory=list)
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class StrategyUpdate(BaseModel):
    """Output of Lora's optimization loop."""
    user_id: str
    summary: str
    changes: list[str] = Field(default_factory=list)
    new_directives: list[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    raw_analysis: str = ""


# ---------------------------------------------------------------------------
# Per-user CMO Context (the full state Lora carries per user)
# ---------------------------------------------------------------------------

class UserCMOContext(BaseModel):
    """
    Complete CMO context for one user.
    Stored & reloaded per user — this is what makes Lora multi-tenant.
    """
    user_id: str
    website_url: str

    business_profile: Optional[BusinessProfile] = None
    icp: Optional[ICP] = None
    competitive_report: Optional[CompetitiveReport] = None
    growth_strategy: Optional[GrowthStrategy] = None
    active_campaigns: list[CampaignPlan] = Field(default_factory=list)
    performance_history: list[PerformanceSnapshot] = Field(default_factory=list)
    strategy_updates: list[StrategyUpdate] = Field(default_factory=list)

    onboarded_at: Optional[datetime] = None
    last_active: datetime = Field(default_factory=datetime.utcnow)

    @property
    def is_onboarded(self) -> bool:
        return (
            self.business_profile is not None
            and self.icp is not None
            and self.growth_strategy is not None
        )
