"""
Lora CMO — Multi-Tenant Profile Store
Stores and loads per-user CMO context.
Default: JSON files (swap to PostgreSQL/Redis in production with zero code change —
just replace this class, interface stays identical).

Each user gets their own isolated CMO context: business profile, ICP, strategy, campaigns.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from lora.models import UserCMOContext


class ProfileStore:
    """
    Multi-tenant persistent store for UserCMOContext.

    File layout:
        {base_dir}/
            {user_id}/
                context.json

    To scale to a real DB: replace load/save with DB calls.
    Interface is identical — callers don't change.
    """

    def __init__(self, base_dir: str = ".lora_data"):
        self._base = Path(base_dir)
        self._base.mkdir(parents=True, exist_ok=True)

    def _user_dir(self, user_id: str) -> Path:
        d = self._base / user_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _context_path(self, user_id: str) -> Path:
        return self._user_dir(user_id) / "context.json"

    # ------------------------------------------------------------------
    # Core CRUD
    # ------------------------------------------------------------------

    def save(self, context: UserCMOContext) -> None:
        """Persist the full CMO context for a user."""
        context.last_active = datetime.utcnow()
        path = self._context_path(context.user_id)
        with open(path, "w", encoding="utf-8") as f:
            f.write(context.model_dump_json(indent=2))

    def load(self, user_id: str) -> Optional[UserCMOContext]:
        """Load the CMO context for a user. Returns None if not found."""
        path = self._context_path(user_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return UserCMOContext.model_validate(data)

    def exists(self, user_id: str) -> bool:
        """Check if a user has a stored context."""
        return self._context_path(user_id).exists()

    def delete(self, user_id: str) -> None:
        """Delete all CMO context for a user (GDPR / reset)."""
        path = self._context_path(user_id)
        if path.exists():
            path.unlink()

    def list_users(self) -> list[str]:
        """List all user IDs with stored context."""
        return [
            d.name
            for d in self._base.iterdir()
            if d.is_dir() and (d / "context.json").exists()
        ]

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    def get_or_create(self, user_id: str, website_url: str) -> UserCMOContext:
        """Load existing context or create a fresh one for a new user."""
        existing = self.load(user_id)
        if existing:
            return existing
        return UserCMOContext(
            user_id=user_id,
            website_url=website_url,
        )

    def update_strategy(self, user_id: str, **kwargs) -> Optional[UserCMOContext]:
        """Patch specific fields on the stored context."""
        context = self.load(user_id)
        if not context:
            return None
        for key, value in kwargs.items():
            if hasattr(context, key):
                setattr(context, key, value)
        self.save(context)
        return context

    def stats(self) -> dict:
        """Return store-level stats for monitoring."""
        users = self.list_users()
        onboarded = sum(
            1 for uid in users
            if (ctx := self.load(uid)) and ctx.is_onboarded
        )
        return {
            "total_users": len(users),
            "onboarded_users": onboarded,
            "pending_onboarding": len(users) - onboarded,
        }
