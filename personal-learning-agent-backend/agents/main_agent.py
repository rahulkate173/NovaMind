"""High-level orchestrator coordinating the full learning workflow."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Literal, Optional

from agents.state_manager import StateManager, get_state_manager
from services.task_progress_service import TaskProgressService
from state.models import LearnerState, QuizResult, SkillLevel
from workflow.executor import WorkflowExecutor, get_executor


class MainAgent:
    def __init__(
        self,
        executor: Optional[WorkflowExecutor] = None,
        state_manager: Optional[StateManager] = None,
        task_service: Optional[TaskProgressService] = None,
    ) -> None:
        self.executor = executor or get_executor()
        self.state_manager = state_manager or get_state_manager()
        self.executor.state_manager = self.state_manager
        self.tasks = task_service or TaskProgressService(
            state_manager=self.state_manager,
            executor=self.executor,
        )

    def start(
        self,
        user_id: str,
        goal: str,
        current_level: str = "Beginner",
        available_hours_per_week: float = 20.0,
        target_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        try:
            level = SkillLevel(current_level)
        except ValueError:
            level = SkillLevel.BEGINNER
        td = date.fromisoformat(target_date) if target_date else None
        return self.executor.start(
            user_id=user_id,
            goal=goal,
            current_level=level,
            available_hours_per_week=available_hours_per_week,
            target_date=td,
        )

    def resume(self, user_id: str, clarification: Optional[str] = None) -> Dict[str, Any]:
        return self.executor.resume(user_id=user_id, clarification=clarification)

    def submit_quiz(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        quiz = QuizResult(
            user_id=payload["user_id"],
            week=int(payload["week"]),
            score=float(payload["score"]),
            weak_topics=list(payload.get("weak_topics") or []),
        )
        return self.executor.handle_quiz(quiz)

    def get_schedule(
        self,
        user_id: str,
        view: Literal["daily", "weekly"] = "daily",
        sync: bool = True,
    ) -> Dict[str, Any]:
        return self.tasks.get_schedule(user_id, view=view, sync=sync)

    def complete_task(self, user_id: str, task_id: str) -> Dict[str, Any]:
        return self.tasks.complete_task(user_id, task_id)

    def submit_task_quiz(
        self,
        user_id: str,
        task_id: str,
        score: float,
        weak_topics: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        return self.tasks.submit_task_quiz(user_id, task_id, score, weak_topics)

    def get_state(self, user_id: str) -> Optional[LearnerState]:
        return self.state_manager.load(user_id)

    def get_plan(self, user_id: str) -> Optional[Dict[str, Any]]:
        state = self.state_manager.load(user_id)
        if not state or not state.plan:
            return None
        return state.plan.model_dump()
