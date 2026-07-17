"""LangGraph workflow state + node implementations (Excalidraw flowchart)."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional, TypedDict

from agents.feedback_analyzer import analyze_quiz, apply_quiz_to_state
from agents.intent_parser import clarify_goal, parse_intent
from agents.nudge_generator import generate_nudge
from agents.plan_generator import generate_plan, suggest_next_milestone
from agents.progress_tracker import compute_progress, days_inactive, track_activity
from agents.roadmap_fetcher import fetch_for_goal
from agents.state_manager import get_state_manager
from config import get_settings
from state.models import (
    ContentSource,
    FinalMetrics,
    GoalClarity,
    LearnerState,
    QuizResult,
    SkillLevel,
)
from tools.calendar import schedule_plan
from tools.web_search import web_search
from utils.helpers import new_id


class WorkflowState(TypedDict, total=False):
    user_id: str
    goal: str
    current_level: str
    available_hours_per_week: float
    target_date: Optional[str]
    clarification: Optional[str]

    learner: Dict[str, Any]
    parsed_intent: Dict[str, Any]
    goal_valid: bool
    clarification_question: Optional[str]

    content_source: str
    roadmap_data: Dict[str, Any]
    search_context: str

    calendar_sync: Dict[str, Any]
    route: str  # nudge | feedback | replan | final | wait
    quiz: Dict[str, Any]
    analysis: Dict[str, Any]
    nudge_message: Optional[str]
    interrupt: bool
    status: str
    messages: List[str]


def _learner_from_dict(data: Dict[str, Any]) -> LearnerState:
    return LearnerState.model_validate(data)


def _learner_to_dict(state: LearnerState) -> Dict[str, Any]:
    return state.model_dump(mode="json")


def intent_parser_node(state: WorkflowState) -> WorkflowState:
    goal = state.get("clarification") or state.get("goal") or ""
    intent = parse_intent(
        goal=goal,
        current_level=state.get("current_level", "Beginner"),
        available_hours_per_week=float(state.get("available_hours_per_week") or 20),
    )
    messages = list(state.get("messages") or [])
    messages.append("intent_parser: parsed goal")
    return {
        **state,
        "goal": intent.goal,
        "parsed_intent": intent.model_dump(mode="json"),
        "goal_valid": intent.is_valid and intent.clarity == GoalClarity.TRUE,
        "clarification_question": intent.clarification_question,
        "status": "intent_parsed",
        "messages": messages,
    }


def clarify_goal_node(state: WorkflowState) -> WorkflowState:
    question = state.get("clarification_question") or clarify_goal(state.get("goal", ""))
    messages = list(state.get("messages") or [])
    messages.append("clarify_goal: awaiting human clarification")
    return {
        **state,
        "clarification_question": question,
        "interrupt": True,
        "status": "awaiting_clarification",
        "goal_valid": False,
        "messages": messages,
    }


def content_retriever_node(state: WorkflowState) -> WorkflowState:
    intent = state.get("parsed_intent") or {}
    roadmap_key = intent.get("roadmap_key")
    domain = intent.get("domain", "")
    goal = state.get("goal", "")
    roadmap = fetch_for_goal(goal, domain=domain, roadmap_key=roadmap_key)
    messages = list(state.get("messages") or [])

    if roadmap.get("matched") and roadmap.get("steps"):
        source = ContentSource.ROADMAP.value
        search_context = ""
        messages.append(f"content_retriever: roadmap.sh/{roadmap.get('key')}")
    else:
        source = ContentSource.WEBSEARCH.value
        search = web_search(goal)
        snippets = [r.get("snippet") or r.get("title") or "" for r in search.get("results", [])]
        search_context = " | ".join(snippets)
        messages.append("content_retriever: websearch")

    return {
        **state,
        "content_source": source,
        "roadmap_data": roadmap if source == ContentSource.ROADMAP.value else {},
        "search_context": search_context,
        "status": "content_retrieved",
        "messages": messages,
    }


def plan_generator_node(state: WorkflowState) -> WorkflowState:
    intent = state.get("parsed_intent") or {}
    existing = state.get("learner")
    learner = _learner_from_dict(existing) if existing else None

    state_inference = 1
    weak_areas: List[str] = []
    start_week = 1
    if learner and learner.plan and learner.state_inference >= 1 and state.get("route") == "replan":
        state_inference = learner.state_inference + 1
        weak_areas = list(learner.weak_areas)
        start_week = learner.current_week

    hours = float(state.get("available_hours_per_week") or (learner.available_hours_per_week if learner else 20))
    weeks = int(intent.get("timeline_weeks") or (learner.plan.total_weeks if learner and learner.plan else 12))
    source = ContentSource(state.get("content_source") or ContentSource.ROADMAP.value)

    plan = generate_plan(
        goal=state.get("goal") or (learner.current_goal if learner else ""),
        hours_per_week=hours,
        total_weeks=weeks,
        roadmap_data=state.get("roadmap_data") or (learner.roadmap_data if learner else None),
        search_context=state.get("search_context") or (learner.search_context if learner else None),
        source=source,
        state_inference=state_inference,
        weak_areas=weak_areas,
        start_week=start_week,
    )

    if learner is None:
        target = state.get("target_date")
        learner = LearnerState(
            user_id=state["user_id"],
            current_goal=state.get("goal", ""),
            skill_level=SkillLevel(intent.get("skill_level", "Beginner")),
            available_hours_per_week=hours,
            target_date=date.fromisoformat(target) if target else None,
            thread_id=new_id("thread"),
        )

    learner.plan = plan
    if state.get("parsed_intent"):
        from state.models import ParsedIntent

        learner.parsed_intent = ParsedIntent.model_validate(state["parsed_intent"])
    learner.content_source = source
    learner.roadmap_data = state.get("roadmap_data") or learner.roadmap_data
    learner.search_context = state.get("search_context") or learner.search_context
    learner.state_inference = state_inference
    learner.next_milestone = suggest_next_milestone(plan) if plan.weeks else ""
    learner = track_activity(learner)
    metrics = compute_progress(learner)
    learner.overall_progress = metrics.overall_progress

    messages = list(state.get("messages") or [])
    messages.append(f"plan_generator: v{plan.version} state_inference={state_inference}")
    return {
        **state,
        "learner": _learner_to_dict(learner),
        "status": "plan_generated",
        "interrupt": False,
        "messages": messages,
    }


def plan_updater_node(state: WorkflowState) -> WorkflowState:
    learner = _learner_from_dict(state["learner"])
    assert learner.plan is not None
    calendar = schedule_plan(learner.plan)
    messages = list(state.get("messages") or [])
    messages.append("plan_updater: calendar schedule prepared")
    return {
        **state,
        "calendar_sync": calendar,
        "status": "plan_updated",
        "messages": messages,
    }


def persist_state_node(state: WorkflowState) -> WorkflowState:
    learner = _learner_from_dict(state["learner"])
    sm = get_state_manager()
    sm.save(learner)
    messages = list(state.get("messages") or [])
    messages.append("persist_learning_state: saved to DB + vector store")
    # Interrupt: human navigates to learning tools (HITL)
    return {
        **state,
        "learner": _learner_to_dict(learner),
        "interrupt": True,
        "status": "persisted_waiting_for_learner",
        "route": "wait",
        "messages": messages,
    }


def conditional_router_node(state: WorkflowState) -> WorkflowState:
    """Progress tracker hub – decide nudge vs feedback vs final vs replan."""
    learner = _learner_from_dict(state["learner"])
    settings = get_settings()
    messages = list(state.get("messages") or [])

    if learner.goal_achieved or learner.overall_progress >= 100:
        route = "final"
        messages.append("conditional_router: goal achieved → final")
    elif state.get("quiz"):
        quiz = QuizResult.model_validate(state["quiz"])
        analysis = analyze_quiz(learner, quiz)
        learner = apply_quiz_to_state(learner, quiz, analysis)
        if analysis.get("needs_remediation"):
            route = "nudge"
            messages.append("conditional_router: quiz fail → nudge")
        else:
            route = "feedback"
            messages.append("conditional_router: quiz pass → feedback")
        return {
            **state,
            "learner": _learner_to_dict(learner),
            "analysis": analysis,
            "route": route,
            "status": "routed",
            "messages": messages,
        }
    elif days_inactive(learner) >= settings.inactivity_nudge_days:
        route = "nudge"
        messages.append("conditional_router: inactivity → nudge")
    else:
        route = "feedback"
        messages.append("conditional_router: on-track feedback path")

    return {
        **state,
        "learner": _learner_to_dict(learner),
        "route": route,
        "status": "routed",
        "messages": messages,
    }


def nudge_generator_node(state: WorkflowState) -> WorkflowState:
    learner = _learner_from_dict(state["learner"])
    reason = "failed quiz / missing feedback"
    if state.get("analysis"):
        reason = state["analysis"].get("summary") or reason
    elif days_inactive(learner) >= get_settings().inactivity_nudge_days:
        reason = f"{days_inactive(learner)} days of inactivity"
    nudge = generate_nudge(learner, reason)
    learner.nudges.append(nudge)
    messages = list(state.get("messages") or [])
    messages.append("nudge_generator: created contextual nudge")
    return {
        **state,
        "learner": _learner_to_dict(learner),
        "nudge_message": nudge,
        "status": "nudged",
        "messages": messages,
    }


def feedback_node(state: WorkflowState) -> WorkflowState:
    learner = _learner_from_dict(state["learner"])
    analysis = state.get("analysis") or {"summary": "Progress recorded."}
    learner.observations.append(str(analysis.get("summary")))
    messages = list(state.get("messages") or [])
    messages.append("feedback: quiz/progress recorded")
    return {
        **state,
        "learner": _learner_to_dict(learner),
        "status": "feedback_recorded",
        "messages": messages,
    }


def state_analyzer_node(state: WorkflowState) -> WorkflowState:
    learner = _learner_from_dict(state["learner"])
    analysis = state.get("analysis") or {}
    # Mark tasks / record problems
    if analysis.get("needs_remediation"):
        learner.observations.append("State score low – invoke new plan generation")
        learner.last_plan_update_reason = str(
            analysis.get("summary") or "Quiz performance triggered remedial replan."
        )
        next_route = "replan"
    elif learner.overall_progress >= 100 or (
        learner.plan and learner.current_week >= learner.plan.total_weeks and analysis.get("passed")
    ):
        next_route = "final"
    else:
        # Continue learning; persist and wait
        next_route = "wait"

    metrics = compute_progress(learner)
    learner.overall_progress = metrics.overall_progress
    sm = get_state_manager()
    sm.save(learner)

    messages = list(state.get("messages") or [])
    messages.append(f"state_analyzer: next={next_route}")
    return {
        **state,
        "learner": _learner_to_dict(learner),
        "route": next_route,
        "status": "analyzed",
        "interrupt": next_route == "wait",
        "messages": messages,
    }


def final_state_node(state: WorkflowState) -> WorkflowState:
    learner = _learner_from_dict(state["learner"])
    learner.goal_achieved = True
    learner.overall_progress = 100.0
    planned = (
        learner.plan.hours_per_week * learner.plan.total_weeks if learner.plan else 0
    )
    learner.final_metrics = FinalMetrics(
        total_time_spent=f"{int(planned)} hours",
        streak=learner.streak,
        certificates=[f"Completed: {learner.current_goal}"],
        completion_date=date.today(),
    )
    learner.next_milestone = "Suggest portfolio projects / job prep"
    sm = get_state_manager()
    sm.save(learner)
    messages = list(state.get("messages") or [])
    messages.append("final_state: goal achieved")
    return {
        **state,
        "learner": _learner_to_dict(learner),
        "status": "completed",
        "interrupt": False,
        "route": "final",
        "messages": messages,
    }
