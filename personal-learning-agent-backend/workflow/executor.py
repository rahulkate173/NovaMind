"""Entry point to start / resume / drive the learning workflow."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, Optional

from agents.state_manager import get_state_manager
from state.models import LearnerState, QuizResult, SkillLevel
from workflow.graph import get_graph
from workflow.nodes import (
    conditional_router_node,
    feedback_node,
    final_state_node,
    nudge_generator_node,
    persist_state_node,
    plan_generator_node,
    plan_updater_node,
    state_analyzer_node,
    WorkflowState,
)


class WorkflowExecutor:
    def __init__(self) -> None:
        self.graph = get_graph()
        self.state_manager = get_state_manager()

    def start(
        self,
        user_id: str,
        goal: str,
        current_level: SkillLevel | str = SkillLevel.BEGINNER,
        available_hours_per_week: float = 20.0,
        target_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        level = current_level.value if isinstance(current_level, SkillLevel) else str(current_level)
        initial: WorkflowState = {
            "user_id": user_id,
            "goal": goal,
            "current_level": level,
            "available_hours_per_week": available_hours_per_week,
            "target_date": target_date.isoformat() if target_date else None,
            "messages": [],
            "interrupt": False,
            "status": "started",
        }
        result = self.graph.invoke(initial)
        return self._format(result)

    def resume(self, user_id: str, clarification: Optional[str] = None) -> Dict[str, Any]:
        existing = self.state_manager.load(user_id)
        if clarification:
            # Re-enter from intent parser with clarified goal
            initial: WorkflowState = {
                "user_id": user_id,
                "goal": clarification,
                "clarification": clarification,
                "current_level": existing.skill_level.value if existing else "Beginner",
                "available_hours_per_week": existing.available_hours_per_week if existing else 20.0,
                "target_date": existing.target_date.isoformat() if existing and existing.target_date else None,
                "learner": existing.model_dump(mode="json") if existing else None,
                "messages": [],
            }
            result = self.graph.invoke(initial)
            return self._format(result)

        if not existing:
            return {"status": "error", "detail": f"No state for user {user_id}"}

        # Resume at conditional router (timeline / feedback check)
        state: WorkflowState = {
            "user_id": user_id,
            "goal": existing.current_goal,
            "learner": existing.model_dump(mode="json"),
            "messages": ["resume: conditional_router"],
        }
        state = conditional_router_node(state)
        route = state.get("route")
        if route == "final":
            state = final_state_node(state)
        elif route == "nudge":
            state = nudge_generator_node(state)
            state = state_analyzer_node(state)
            if state.get("route") == "replan":
                state = self._replan_cycle(state)
        else:
            state = feedback_node(state)
            state = state_analyzer_node(state)
            if state.get("route") == "replan":
                state = self._replan_cycle(state)
        return self._format(state)

    def handle_quiz(self, quiz: QuizResult) -> Dict[str, Any]:
        existing = self.state_manager.load(quiz.user_id)
        if not existing:
            return {"status": "error", "detail": f"No state for user {quiz.user_id}"}

        state: WorkflowState = {
            "user_id": quiz.user_id,
            "goal": existing.current_goal,
            "learner": existing.model_dump(mode="json"),
            "quiz": quiz.model_dump(mode="json"),
            "parsed_intent": existing.parsed_intent.model_dump(mode="json")
            if existing.parsed_intent
            else {},
            "content_source": existing.content_source.value if existing.content_source else "roadmap.sh",
            "roadmap_data": existing.roadmap_data or {},
            "search_context": existing.search_context or "",
            "available_hours_per_week": existing.available_hours_per_week,
            "messages": ["quiz_submitted"],
        }
        state = conditional_router_node(state)
        if state.get("route") == "nudge":
            state = nudge_generator_node(state)
        else:
            state = feedback_node(state)
        state = state_analyzer_node(state)
        if state.get("route") == "replan":
            state = self._replan_cycle(state)
        elif state.get("route") == "final":
            state = final_state_node(state)
        return self._format(state)

    def _replan_cycle(self, state: WorkflowState) -> WorkflowState:
        # Iterative loop → plan generator → updater → persist
        state = plan_generator_node(state)
        state = plan_updater_node(state)
        state = persist_state_node(state)
        return state

    def _format(self, result: Dict[str, Any]) -> Dict[str, Any]:
        learner_data = result.get("learner")
        learner = None
        if learner_data:
            learner = LearnerState.model_validate(learner_data)
        return {
            "status": result.get("status"),
            "interrupt": bool(result.get("interrupt")),
            "route": result.get("route"),
            "clarification_question": result.get("clarification_question"),
            "nudge_message": result.get("nudge_message"),
            "calendar_sync": result.get("calendar_sync"),
            "messages": result.get("messages") or [],
            "learner_state": learner.model_dump(mode="json") if learner else None,
            "plan": learner.plan.model_dump(mode="json") if learner and learner.plan else None,
        }


_executor: Optional[WorkflowExecutor] = None


def get_executor() -> WorkflowExecutor:
    global _executor
    if _executor is None:
        _executor = WorkflowExecutor()
    return _executor
