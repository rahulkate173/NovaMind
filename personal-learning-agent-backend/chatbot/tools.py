"""Tools the tutor chatbot can invoke."""

from __future__ import annotations

from typing import Any, Dict, List

from agents.state_manager import get_state_manager
from tools.quiz_generator import generate_quiz
from tools.web_search import web_search


def tool_search(query: str) -> Dict[str, Any]:
    return web_search(query)


def tool_quiz(user_id: str, topics: List[str] | None = None) -> Dict[str, Any]:
    state = get_state_manager().load(user_id)
    week = state.current_week if state else 1
    if not topics and state and state.weak_areas:
        topics = list(state.weak_areas)
    if not topics and state and state.plan:
        week_plan = next((w for w in state.plan.weeks if w.week == week), None)
        topics = week_plan.topics if week_plan else ["fundamentals"]
    return generate_quiz(topics or ["fundamentals"], week=week)


def tool_progress(user_id: str) -> Dict[str, Any]:
    state = get_state_manager().load(user_id)
    if not state:
        return {"error": "no state"}
    return {
        "overall_progress": state.overall_progress,
        "current_week": state.current_week,
        "streak": state.streak,
        "weak_areas": state.weak_areas,
        "next_milestone": state.next_milestone,
    }


CHAT_TOOLS = {
    "search": tool_search,
    "quiz": tool_quiz,
    "progress": tool_progress,
}
