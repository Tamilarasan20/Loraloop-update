"""
Lora CMO — ICP + Positioning + Messaging Engine
From BusinessProfile → deep ICP, brand positioning, messaging angles.
This is what separates Lora from a content tool.
"""

from __future__ import annotations

import json
import re
from datetime import datetime

import anthropic

from lora.models import BusinessProfile, ICP


_SYSTEM = """You are Lora, an AI CMO with deep expertise in brand positioning and
customer psychology. You build ICPs that are razor-sharp — not generic personas,
but real human beings with specific frustrations, ambitions, and decision triggers.
Your positioning statements make companies impossible to ignore."""


_ICP_PROMPT = """Build a complete ICP + Positioning framework for this business.

BUSINESS INTELLIGENCE:
- Name: {name}
- Industry: {industry}
- Business Model: {model}
- Product/Service: {product}
- Value Proposition: {value_prop}
- Problem Solved: {problem}
- Key Features: {features}
- Pricing: {pricing}
- Existing Customers: {customers}
- Stage: {stage}

CMO TASK:
1. Define the EXACT ideal customer (not a broad category — a specific human)
2. Identify their real pain (not surface level — the emotional frustration underneath)
3. Build a positioning statement that makes this business unmissable
4. Define 5 messaging angles to own relentlessly in content

Return EXACTLY this JSON:
{{
  "age_range": "<e.g. 28-42>",
  "gender": "<all | primarily female | primarily male>",
  "location": "<geographic focus>",
  "job_title_or_role": "<specific role, not just 'business owner'>",
  "company_size": "<if B2B: employee count range>",
  "goals": [
    "<goal 1 — specific and outcome-focused>",
    "<goal 2>",
    "<goal 3>"
  ],
  "pain_points": [
    "<pain 1 — emotional, not just functional>",
    "<pain 2>",
    "<pain 3>",
    "<pain 4>"
  ],
  "motivations": [
    "<what drives their decisions — deeper than goals>",
    "<motivation 2>",
    "<motivation 3>"
  ],
  "buying_triggers": [
    "<event or situation that makes them buy NOW>",
    "<trigger 2>",
    "<trigger 3>"
  ],
  "positioning_statement": "<For [ICP], [brand] is the [category] that [key benefit] because [proof]. Unlike [competitors], we [differentiator].>",
  "unique_differentiators": [
    "<what no competitor can honestly claim>",
    "<differentiator 2>",
    "<differentiator 3>"
  ],
  "messaging_angles": [
    "<angle 1: the core narrative to repeat everywhere>",
    "<angle 2: a specific fear/pain to address>",
    "<angle 3: an aspiration to amplify>",
    "<angle 4: a proof/credibility angle>",
    "<angle 5: a challenger/contrarian angle>"
  ],
  "tone_of_voice": "<3-word description e.g. 'direct, bold, empowering'>",
  "brand_personality": ["<trait 1>", "<trait 2>", "<trait 3>"]
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


class ICPBuilder:
    """Builds ICP + Positioning + Messaging from a BusinessProfile."""

    def __init__(self, client: anthropic.Anthropic):
        self._client = client

    def build(self, profile: BusinessProfile, verbose: bool = False) -> ICP:
        if verbose:
            print("[Lora/ICP] Building ICP + positioning framework...")

        prompt = _ICP_PROMPT.format(
            name=profile.business_name or "Unknown",
            industry=profile.industry or "Unknown",
            model=profile.business_model or "Unknown",
            product=profile.primary_product_or_service or "Unknown",
            value_prop=profile.value_proposition or "Unknown",
            problem=profile.main_problem_solved or "Unknown",
            features=", ".join(profile.key_features) or "Unknown",
            pricing=profile.pricing_model or "Unknown",
            customers=profile.existing_customers or "Unknown",
            stage=profile.stage or "Unknown",
        )

        raw = _stream_analyze(self._client, prompt)

        try:
            data = _parse_json(raw)
        except Exception:
            data = {}

        icp = ICP(
            user_id=profile.user_id,
            age_range=data.get("age_range"),
            gender=data.get("gender"),
            location=data.get("location"),
            job_title_or_role=data.get("job_title_or_role"),
            company_size=data.get("company_size"),
            goals=data.get("goals", []),
            pain_points=data.get("pain_points", []),
            motivations=data.get("motivations", []),
            buying_triggers=data.get("buying_triggers", []),
            positioning_statement=data.get("positioning_statement", ""),
            unique_differentiators=data.get("unique_differentiators", []),
            messaging_angles=data.get("messaging_angles", []),
            tone_of_voice=data.get("tone_of_voice", "professional yet approachable"),
            brand_personality=data.get("brand_personality", []),
            raw_analysis=raw,
            built_at=datetime.utcnow(),
        )

        if verbose:
            print(f"[Lora/ICP] ✓ ICP: {icp.job_title_or_role} | Tone: {icp.tone_of_voice}")

        return icp
