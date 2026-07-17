"""Google Calendar integration (optional / stub-friendly)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from config import get_settings
from state.models import LearningPlan


def schedule_plan(plan: LearningPlan, start: datetime | None = None) -> Dict[str, Any]:
    """Create calendar event descriptors for each week. Real Google API only if enabled."""
    settings = get_settings()
    start = start or datetime.now(timezone.utc)
    events: List[Dict[str, Any]] = []
    for week in plan.weeks:
        event_start = start + timedelta(weeks=week.week - 1)
        events.append(
            {
                "summary": f"Week {week.week}: {week.theme}",
                "description": ", ".join(week.topics),
                "start": event_start.isoformat(),
                "end": (event_start + timedelta(hours=week.hours_allocated or plan.hours_per_week)).isoformat(),
                "hours": week.hours_allocated or plan.hours_per_week,
            }
        )

    if not settings.google_calendar_enabled:
        return {
            "provider": "stub",
            "synced": False,
            "message": "Google Calendar disabled – returning local schedule preview.",
            "events": events,
        }

    # Placeholder for real Google Calendar API wiring
    return {
        "provider": "google",
        "synced": False,
        "message": "Credentials configured but live sync not wired in MVP; schedule preview returned.",
        "events": events,
    }
