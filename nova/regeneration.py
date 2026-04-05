"""
Nova Agent — Regeneration Controls
Handles: improve, rewrite_hook, adjust_tone
Each operation takes a completed ContentOutput and returns an updated one.
"""

from __future__ import annotations

from google.genai import types

from nova.models import ContentOutput, RegenerationType
from nova.formats.parser import parse_output
from nova.prompts.templates import (
    NOVA_SYSTEM_PROMPT,
    improve_prompt,
    rewrite_hook_prompt,
    adjust_tone_prompt,
)

_MODEL = "gemini-2.5-flash"


def _call_nova(client, user_prompt: str) -> str:
    """
    Call Gemini with streaming and return the full text response.
    """
    full_text = ""
    for chunk in client.models.generate_content_stream(
        model=_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=NOVA_SYSTEM_PROMPT,
            max_output_tokens=4096,
        ),
    ):
        full_text += chunk.text or ""
    return full_text.strip()


def regenerate(
    client,
    output: ContentOutput,
    regen_type: RegenerationType,
    new_tone: str = "bold and energetic",
) -> ContentOutput:
    """
    Apply a regeneration operation to an existing ContentOutput.

    Args:
        client:     Anthropic client
        output:     The previously generated ContentOutput
        regen_type: Type of regeneration to perform
        new_tone:   Required when regen_type == ADJUST_TONE

    Returns:
        A new ContentOutput with the updated content.
    """
    format_name = output.format.value.replace("_", " ").title()
    original_json = output.raw_text

    if regen_type == RegenerationType.IMPROVE:
        prompt = improve_prompt(original_json, format_name, output.request.brand)

    elif regen_type == RegenerationType.REWRITE_HOOK:
        prompt = rewrite_hook_prompt(original_json, format_name, output.request.brand)

    elif regen_type == RegenerationType.ADJUST_TONE:
        prompt = adjust_tone_prompt(original_json, format_name, output.request.brand, new_tone)

    else:
        raise ValueError(f"Unknown regeneration type: {regen_type}")

    raw = _call_nova(client, prompt)
    updated_output = parse_output(raw, output.request)
    updated_output.model_used = _MODEL
    return updated_output
