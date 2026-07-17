"""Feedback analyzer – quiz/performance signals → plan adaptations."""

from __future__ import annotations

from typing import Any, Dict, List

from config import get_settings
from state.models import LearnerState, QuizResult
from utils.helpers import clamp, unique_extend
from utils.llm import get_llm
from utils.prompts import FEEDBACK_ANALYZER_SYSTEM


def analyze_quiz(state: LearnerState, quiz: QuizResult) -> Dict[str, Any]:
    settings = get_settings()
    pass_score = settings.default_quiz_pass_score
    passed = quiz.score >= pass_score
    quiz.passed = passed

    llm = get_llm()
    analysis = llm.chat_json(
        FEEDBACK_ANALYZER_SYSTEM,
        (
            f"Score: {quiz.score}\nPass score: {pass_score}\n"
            f"Weak topics: {quiz.weak_topics}\nGoal: {state.current_goal}"
        ),
    )
    needs_remediation = bool(analysis.get("needs_remediation", not passed))
    if not passed:
        needs_remediation = True

    remedial_topics: List[str] = list(analysis.get("remedial_topics") or [])
    remedial_topics = unique_extend(remedial_topics, quiz.weak_topics)

    summary = str(
        analysis.get("summary")
        or (
            f"Quiz week {quiz.week} scored {quiz.score}%. "
            + ("Needs remediation." if needs_remediation else "On track.")
        )
    )

    return {
        "passed": passed,
        "needs_remediation": needs_remediation,
        "remedial_topics": remedial_topics,
        "summary": summary,
        "route": "nudge" if needs_remediation else "feedback_ok",
    }


def apply_quiz_to_state(state: LearnerState, quiz: QuizResult, analysis: Dict[str, Any]) -> LearnerState:
    state.quiz_history.append(quiz)
    state.weak_areas = unique_extend(state.weak_areas, analysis.get("remedial_topics") or [])
    state.observations.append(str(analysis.get("summary", "")))
    state.current_week = quiz.week  # stay on week until improved (grok_report)
    # Low score decreases overall progress slightly
    if not analysis.get("passed"):
        state.overall_progress = clamp(state.overall_progress - 5.0)
    else:
        state.overall_progress = clamp(state.overall_progress + 8.0)
        # clear remediated topics that were in this quiz if passed
        state.weak_areas = [w for w in state.weak_areas if w not in quiz.weak_topics]
    return state
