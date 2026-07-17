"""Roadmap fetcher agent – wraps roadmap tool / service."""

from __future__ import annotations

from typing import Any, Dict, Optional

from tools.roadmap import fetch_roadmap, resolve_roadmap_key


def fetch_for_goal(goal: str, domain: str = "", roadmap_key: Optional[str] = None) -> Dict[str, Any]:
    key = roadmap_key or resolve_roadmap_key(domain, goal)
    if not key:
        return {"key": None, "title": None, "steps": [], "matched": False}
    data = fetch_roadmap(key)
    data["matched"] = True
    data["key"] = data.get("key") or key
    return data
