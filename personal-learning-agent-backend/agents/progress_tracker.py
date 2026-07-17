"""Progress tracker – honest comparison of planned vs actual metrics."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict

from state.models import LearnerState, ProgressMetrics
from utils.helpers import clamp


def compute_progress(state: LearnerState) -> ProgressMetrics:
    metrics = state.metrics()
    if state.plan and state.plan.total_weeks:
        # Progress from completed weeks + quiz signal
        week_ratio = (state.current_week - 1) / state.plan.total_weeks
        task_ratio = (
            len(state.completed_tasks) / max(metrics.tasks_total, 1)
            if metrics.tasks_total
            else 0.0
        )
        metrics.overall_progress = clamp((week_ratio * 0.6 + task_ratio * 0.4) * 100.0)
    else:
        metrics.overall_progress = clamp(state.overall_progress)
    return metrics


def track_activity(state: LearnerState, active_on: date | None = None) -> LearnerState:
    today = active_on or date.today()
    if state.last_active:
        delta = (today - state.last_active).days
        if delta == 1:
            state.streak += 1
        elif delta > 1:
            state.streak = 1
        # same day: keep streak
    else:
        state.streak = 1
    state.last_active = today
    metrics = compute_progress(state)
    state.overall_progress = metrics.overall_progress
    return state


def days_inactive(state: LearnerState, today: date | None = None) -> int:
    today = today or date.today()
    if not state.last_active:
        return 0
    return max(0, (today - state.last_active).days)


def snapshot(state: LearnerState) -> Dict[str, Any]:
    m = compute_progress(state)
    return {
        "user_id": state.user_id,
        "goal": state.current_goal,
        "overall_progress": m.overall_progress,
        "current_week": state.current_week,
        "streak": state.streak,
        "next_milestone": state.next_milestone,
        "weak_areas": state.weak_areas,
        "tasks_completed": m.tasks_completed,
        "tasks_total": m.tasks_total,
        "goal_achieved": state.goal_achieved,
    }
