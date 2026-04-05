"""
Nova — AI Autonomous Creator Agent
Core agent class. Accepts a ContentRequest and produces one excellent ContentOutput.

Architecture:
  ContentRequest
      │
      ▼
  PromptTemplate (per format)   ← Brand Guidelines injected
      │
      ▼
  Gemini gemini-2.0-flash (streaming)
      │
      ▼
  FormatParser   →  ContentOutput
      │
      ▼
  RegenerationControls (optional)
"""

from __future__ import annotations

import os
from google import genai
from google.genai import types

from nova.models import (
    BrandGuidelines,
    ContentFormat,
    ContentOutput,
    ContentRequest,
    InputSource,
    RegenerationType,
)
from nova.prompts.templates import NOVA_SYSTEM_PROMPT, get_creation_prompt
from nova.formats.parser import parse_output
from nova.formats.renderer import render
from nova.regeneration import regenerate


class Nova:
    """
    Nova — AI Autonomous Creator Agent.

    One request → one high-quality content asset.
    Supports: Instagram Image, Instagram Carousel, Blog, Email.
    """

    MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str | None = None):
        self._client = genai.Client(
            api_key=api_key or os.environ.get("GOOGLE_API_KEY")
        )

    # ------------------------------------------------------------------
    # Primary creation method
    # ------------------------------------------------------------------

    def create(self, request: ContentRequest, verbose: bool = False) -> ContentOutput:
        """
        Generate one content asset from a ContentRequest.

        Args:
            request: The content creation request (topic, format, brand)
            verbose: Stream tokens to stdout while generating

        Returns:
            A fully parsed ContentOutput with the generated content.
        """
        prompt = get_creation_prompt(
            format=request.format,
            topic=request.topic,
            brand=request.brand,
            extra_context=request.extra_context or "",
        )

        if verbose:
            print(f"\n[Nova] Generating {request.format.value} for: {request.topic!r}")
            print("[Nova] Thinking and writing...\n")

        raw = self._stream_generate(prompt, verbose=verbose)
        output = parse_output(raw, request)
        output.model_used = self.MODEL
        return output

    # ------------------------------------------------------------------
    # Convenience factory methods (from different input sources)
    # ------------------------------------------------------------------

    def create_from_chat(
        self,
        topic: str,
        format: ContentFormat,
        brand: BrandGuidelines | None = None,
        extra_context: str = "",
        verbose: bool = False,
    ) -> ContentOutput:
        """Trigger content creation from a direct chat input (T3)."""
        return self.create(
            ContentRequest(
                topic=topic,
                format=format,
                source=InputSource.CHAT,
                brand=brand or BrandGuidelines(),
                extra_context=extra_context or None,
            ),
            verbose=verbose,
        )

    def create_from_trending(
        self,
        trending_topic: str,
        format: ContentFormat,
        brand: BrandGuidelines | None = None,
        verbose: bool = False,
    ) -> ContentOutput:
        """Trigger content creation from a trending topic selection (T4)."""
        return self.create(
            ContentRequest(
                topic=trending_topic,
                format=format,
                source=InputSource.TRENDING,
                brand=brand or BrandGuidelines(),
            ),
            verbose=verbose,
        )

    def create_from_plan(
        self,
        plan_item: str,
        format: ContentFormat,
        brand: BrandGuidelines | None = None,
        extra_context: str = "",
        verbose: bool = False,
    ) -> ContentOutput:
        """Trigger content creation from a content plan item (T5)."""
        return self.create(
            ContentRequest(
                topic=plan_item,
                format=format,
                source=InputSource.CONTENT_PLAN,
                brand=brand or BrandGuidelines(),
                extra_context=extra_context or None,
            ),
            verbose=verbose,
        )

    # ------------------------------------------------------------------
    # Regeneration controls
    # ------------------------------------------------------------------

    def improve(self, output: ContentOutput, verbose: bool = False) -> ContentOutput:
        """Enhance the overall quality of the content."""
        if verbose:
            print(f"\n[Nova] Improving {output.format.value} content...")
        return regenerate(self._client, output, RegenerationType.IMPROVE)

    def rewrite_hook(self, output: ContentOutput, verbose: bool = False) -> ContentOutput:
        """Regenerate only the opening hook of the content."""
        if verbose:
            print(f"\n[Nova] Rewriting hook for {output.format.value} content...")
        return regenerate(self._client, output, RegenerationType.REWRITE_HOOK)

    def adjust_tone(
        self,
        output: ContentOutput,
        new_tone: str,
        verbose: bool = False,
    ) -> ContentOutput:
        """
        Shift the content voice without changing substance.

        Args:
            output:   The existing ContentOutput
            new_tone: Description of the target tone (e.g. "bold and edgy", "warm and casual")
        """
        if verbose:
            print(f"\n[Nova] Adjusting tone to '{new_tone}'...")
        return regenerate(self._client, output, RegenerationType.ADJUST_TONE, new_tone=new_tone)

    # ------------------------------------------------------------------
    # Rendering
    # ------------------------------------------------------------------

    @staticmethod
    def render(output: ContentOutput) -> str:
        """Return a pretty-printed string of the content output."""
        return render(output)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _stream_generate(self, user_prompt: str, verbose: bool = False) -> str:
        """
        Call Gemini with streaming.
        Returns the complete text response.
        """
        full_text = ""
        for chunk in self._client.models.generate_content_stream(
            model=self.MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=NOVA_SYSTEM_PROMPT,
                max_output_tokens=4096,
            ),
        ):
            text = chunk.text or ""
            full_text += text
            if verbose:
                print(text, end="", flush=True)

        if verbose:
            print()  # newline after streaming
        return full_text.strip()
