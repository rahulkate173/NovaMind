"""Shared helpers."""

from __future__ import annotations

import hashlib
import re
import uuid
from datetime import date
from typing import Iterable, List


def new_id(prefix: str = "id") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def stable_hash(*parts: str) -> str:
    payload = "|".join(parts)
    return hashlib.sha256(payload.encode()).hexdigest()[:12]


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def unique_extend(base: List[str], items: Iterable[str]) -> List[str]:
    seen = set(base)
    out = list(base)
    for item in items:
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


def today_iso() -> str:
    return date.today().isoformat()
