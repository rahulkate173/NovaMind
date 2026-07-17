"""Task completion, quiz submission, and dynamic replan triggers."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional

from agents.progress_tracker import compute_progress, days_inactive, track_activity
from agents.state_manager import StateManager
from config import get_settings
from services.schedule_service import find_task, get_daily_schedule, get_weekly_schedule
from state.models import LearnerState, QuizResult, TaskStatus
from utils.helpers import clamp, unique_extend
from workflow.executor import WorkflowExecutor


class TaskProgressService:
    def __init__(
        self,
        state_manager: StateManager,
        executor: Optional[WorkflowExecutor] = None,
    ) -> None:
        self.state_manager = state_manager
        self.executor = executor or WorkflowExecutor()
        self.executor.state_manager = state_manager

    def get_schedule(self, user_id: str, view: str = "daily", sync: bool = True) -> Dict[str, Any]:
        state = self._require_state(user_id)
        replan_result = None
        if sync:
            state, replan_result = self._sync_if_needed(state)
        schedule = get_daily_schedule(state) if view == "daily" else get_weekly_schedule(state)
        if replan_result:
            schedule["workflow"] = {
                "triggered": True,
                "status": replan_result.get("status"),
                "route": replan_result.get("route"),
                "messages": replan_result.get("messages"),
            }
            schedule["update_reason"] = replan_result.get("update_reason") or schedule.get("update_reason")
            schedule["plan_version"] = (
                replan_result.get("learner_state", {}).get("plan", {}).get("version")
                or schedule.get("plan_version")
            )
        schedule["synced"] = sync
        return schedule

    def complete_task(self, user_id: str, task_id: str) -> Dict[str, Any]:
        state = self._require_state(user_id)
        task, week = find_task(state, task_id)
        if task is None:
            return {"ok": False, "error": f"Task {task_id} not found"}

        if task.id not in state.completed_tasks:
            state.completed_tasks.append(task.id)
        task.status = TaskStatus.COMPLETED
        state = track_activity(state)
        state = self._refresh_progress(state)
        self.state_manager.save(state)

        next_task = self._next_pending_task(state)
        return {
            "ok": True,
            "user_id": user_id,
            "task_id": task_id,
            "task": task.model_dump(mode="json"),
            "week": week.week if week else state.current_week,
            "overall_progress": state.overall_progress,
            "completed_tasks_count": len(state.completed_tasks),
            "next_task_id": next_task.id if next_task else None,
            "daily": get_daily_schedule(state),
        }

    def submit_task_quiz(
        self,
        user_id: str,
        task_id: str,
        score: float,
        weak_topics: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        state = self._require_state(user_id)
        task, week = find_task(state, task_id)
        if task is None:
            return {"ok": False, "error": f"Task {task_id} not found"}

        weak_topics = list(weak_topics or [])
        settings = get_settings()
        passed = score >= settings.default_quiz_pass_score

        quiz = QuizResult(
            user_id=user_id,
            week=task.week,
            score=score,
            weak_topics=weak_topics,
            passed=passed,
        )
        state.quiz_history.append(quiz)

        if task.id not in state.completed_tasks:
            state.completed_tasks.append(task.id)
        task.status = TaskStatus.COMPLETED
        state = track_activity(state)

        replan_result: Optional[Dict[str, Any]] = None
        if not passed:
            state.weak_areas = unique_extend(state.weak_areas, weak_topics or task.topics)
            state.overall_progress = clamp(state.overall_progress - 5.0)
            state.last_plan_update_reason = (
                f"Quiz score {score}% on '{task.title}' – remedial replan triggered."
            )
            self.state_manager.save(state)
            replan_result = self.executor.handle_quiz(quiz)
            state = self._require_state(user_id)
        else:
            state.overall_progress = clamp(state.overall_progress + 5.0)
            state = self._refresh_progress(state)
            self.state_manager.save(state)

        response: Dict[str, Any] = {
            "ok": True,
            "user_id": user_id,
            "task_id": task_id,
            "score": score,
            "passed": passed,
            "weak_topics": weak_topics,
            "replan_triggered": not passed,
            "learner_state": state.model_dump(mode="json"),
            "daily": get_daily_schedule(state),
        }
        if replan_result:
            response["workflow"] = replan_result
            response["update_reason"] = state.last_plan_update_reason
            response["plan"] = replan_result.get("plan")
        return response

    def _sync_if_needed(self, state: LearnerState) -> tuple[LearnerState, Optional[Dict[str, Any]]]:
        """Run dynamic workflow when user missed tasks or was inactive."""
        settings = get_settings()
        inactive = days_inactive(state)
        week = None
        if state.plan:
            from services.schedule_service import _week_plan, _overdue_pending_tasks, _focus_day, _study_tasks

            week = _week_plan(state)
        overdue_count = 0
        if week:
            completed = set(state.completed_tasks)
            day = _focus_day(week, completed)
            overdue_count = len(_overdue_pending_tasks(week, day, completed))

        should_sync = inactive >= settings.inactivity_nudge_days or (
            overdue_count > 0 and state.quiz_history and not state.quiz_history[-1].passed
        )

        if not should_sync:
            return state, None

        reason = (
            f"Inactivity ({inactive} days) – checking progress and updating plan."
            if inactive >= settings.inactivity_nudge_days
            else f"{overdue_count} overdue task(s) with recent quiz miss – replanning."
        )
        state.last_plan_update_reason = reason
        self.state_manager.save(state)
        result = self.executor.resume(state.user_id)
        result["update_reason"] = reason
        updated = self.state_manager.load(state.user_id)
        return updated or state, result

    def _next_pending_task(self, state: LearnerState):
        if not state.plan:
            return None
        for week in state.plan.weeks:
            if week.week != state.current_week:
                continue
            for task in week.tasks:
                if task.is_quiz or task.is_project:
                    continue
                if task.id not in state.completed_tasks and task.status != TaskStatus.COMPLETED:
                    return task
        return None

    def _refresh_progress(self, state: LearnerState) -> LearnerState:
        metrics = compute_progress(state)
        state.overall_progress = metrics.overall_progress
        if state.plan and state.completed_tasks:
            total = sum(len(w.tasks) for w in state.plan.weeks)
            if total and len(state.completed_tasks) >= total * (state.current_week / state.plan.total_weeks):
                pass  # week advance handled by quiz/workflow
        return state

    def _require_state(self, user_id: str) -> LearnerState:
        state = self.state_manager.load(user_id)
        if state is None:
            raise ValueError(f"No learner state for user {user_id}")
        return state
