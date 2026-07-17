"""Intent parser – validates and structures human learning goals."""

from __future__ import annotations

from state.models import GoalClarity, ParsedIntent, SkillLevel
from tools.roadmap import resolve_roadmap_key
from utils.llm import get_llm
from utils.prompts import INTENT_PARSER_SYSTEM


def parse_intent(
    goal: str,
    current_level: str = "Beginner",
    available_hours_per_week: float = 20.0,
    timeline_hint_weeks: int | None = None,
) -> ParsedIntent:
    llm = get_llm()
    user_msg = (
        f"Goal: {goal}\n"
        f"Stated level: {current_level}\n"
        f"Hours/week: {available_hours_per_week}\n"
        f"Timeline hint weeks: {timeline_hint_weeks}"
    )
    data = llm.chat_json(INTENT_PARSER_SYSTEM, user_msg)

    clarity_raw = str(data.get("clarity", "true")).lower()
    clarity = GoalClarity.TRUE if clarity_raw in {"true", "valid", "clear"} else GoalClarity.FALSE
    is_valid = bool(data.get("is_valid", clarity == GoalClarity.TRUE))

    try:
        skill = SkillLevel(data.get("skill_level", current_level))
    except ValueError:
        skill = SkillLevel.BEGINNER

    roadmap_key = data.get("roadmap_key") or resolve_roadmap_key(
        str(data.get("domain", "")), goal
    )
    weeks = int(data.get("timeline_weeks") or timeline_hint_weeks or 12)

    return ParsedIntent(
        is_valid=is_valid and clarity == GoalClarity.TRUE,
        clarity=clarity if is_valid else GoalClarity.FALSE,
        goal=str(data.get("goal") or goal).strip(),
        domain=str(data.get("domain") or "general"),
        skill_level=skill,
        timeline_weeks=max(1, weeks),
        target_outcome=str(data.get("target_outcome") or goal).strip(),
        clarification_question=data.get("clarification_question"),
        roadmap_key=roadmap_key,
    )


def clarify_goal(goal: str, previous_question: str | None = None) -> str:
    llm = get_llm()
    from utils.prompts import CLARIFY_GOAL_SYSTEM

    return llm.chat(
        CLARIFY_GOAL_SYSTEM,
        f"Vague goal: {goal}\nPrevious question: {previous_question}",
    )
