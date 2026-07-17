"""Web search tool – Tavily if configured, else lightweight stub."""

from __future__ import annotations

from typing import Any, Dict

from config import get_settings


def web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    settings = get_settings()
    if settings.tavily_api_key:
        try:
            import httpx

            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": settings.tavily_api_key,
                        "query": query,
                        "max_results": max_results,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = [
                        {
                            "title": r.get("title"),
                            "url": r.get("url"),
                            "snippet": r.get("content"),
                        }
                        for r in data.get("results", [])
                    ]
                    return {"query": query, "results": results, "source": "tavily"}
        except Exception as exc:
            return {
                "query": query,
                "results": [],
                "source": "tavily_error",
                "error": str(exc),
            }

    # Deterministic stub for offline / mock mode
    return {
        "query": query,
        "source": "stub",
        "results": [
            {
                "title": f"Learning path overview for: {query}",
                "url": "https://example.com/learn",
                "snippet": (
                    f"Curated topics and practice resources related to '{query}'. "
                    "Focus on fundamentals, projects, and weekly assessments."
                ),
            },
            {
                "title": "Milestone-based study plan template",
                "url": "https://example.com/study-plan",
                "snippet": "Break goals into weekly milestones with quizzes and projects.",
            },
        ],
    }
