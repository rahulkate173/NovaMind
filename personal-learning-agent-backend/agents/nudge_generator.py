"""Nudge generator – contextual interventions on failure/inactivity."""

from __future__ import annotations

from state.models import LearnerState
from utils.llm import get_llm
from utils.prompts import NUDGE_GENERATOR_SYSTEM


def generate_nudge(state: LearnerState, reason: str) -> str:
    llm = get_llm()
    user = (
        f"Goal: {state.current_goal}\n"
        f"Week: {state.current_week}\n"
        f"Progress: {state.overall_progress}%\n"
        f"Weak areas: {state.weak_areas}\n"
        f"Next milestone: {state.next_milestone}\n"
        f"Reason for nudge: {reason}\n"
        f"Streak: {state.streak}"
    )
    if llm.is_mock:
        weak = state.weak_areas[0] if state.weak_areas else state.next_milestone or "your next topic"
        return (
            f"We noticed {reason}. To keep \"{state.current_goal}\" on track, "
            f"let's review '{weak}'. Shall we start with a short focused session?"
        )
    return llm.chat(NUDGE_GENERATOR_SYSTEM, user)
