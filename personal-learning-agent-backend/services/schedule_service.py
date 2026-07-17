"""Resolve tasks from learner plan and build daily/weekly schedules for the frontend."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from agents.progress_tracker import days_inactive
from state.models import LearnerState, Task, TaskStatus, WeeklyPlan


def find_task(state: LearnerState, task_id: str) -> Tuple[Optional[Task], Optional[WeeklyPlan]]:
    if not state.plan:
        return None, None
    for week in state.plan.weeks:
        for task in week.tasks:
            if task.id == task_id:
                return task, week
    return None, None


def _week_plan(state: LearnerState) -> Optional[WeeklyPlan]:
    if not state.plan:
        return None
    for week in state.plan.weeks:
        if week.week == state.current_week:
            return week
    return state.plan.weeks[0] if state.plan.weeks else None


def _study_tasks(week: WeeklyPlan) -> List[Task]:
    return [t for t in week.tasks if not t.is_quiz and not t.is_project]


def _focus_day(week: WeeklyPlan, completed_ids: set[str]) -> int:
    pending = [t for t in _study_tasks(week) if t.id not in completed_ids and t.status != TaskStatus.COMPLETED]
    if not pending:
        return max((t.day or 1 for t in _study_tasks(week)), default=1)
    return min(t.day or 1 for t in pending)


def _update_reason(state: LearnerState) -> Optional[str]:
    if state.last_plan_update_reason:
        return state.last_plan_update_reason
    if state.plan and state.plan.version > 1:
        weak = ", ".join(state.weak_areas[:3]) if state.weak_areas else "performance gap"
        return f"Plan v{state.plan.version} – adjusted after: {weak}"
    if state.weak_areas:
        return f"Focus areas updated: {', '.join(state.weak_areas[:3])}"
    return None


def _serialize_task(task: Task, state: LearnerState) -> Dict[str, Any]:
    payload = task.model_dump(mode="json")
    payload["completed"] = task.id in state.completed_tasks or task.status == TaskStatus.COMPLETED
    payload["goal"] = state.current_goal
    payload["current_week"] = state.current_week
    if task.quiz:
        payload["quiz"] = task.quiz.model_dump(mode="json")
    return payload


def get_daily_schedule(state: LearnerState) -> Dict[str, Any]:
    week = _week_plan(state)
    if not week or not state.plan:
        return {
            "user_id": state.user_id,
            "view": "daily",
            "goal": state.current_goal,
            "current_week": state.current_week,
            "focus_day": 1,
            "plan_version": 0,
            "update_reason": _update_reason(state),
            "tasks": [],
            "quizzes": [],
            "message": "No plan found. Start workflow first.",
        }

    completed = set(state.completed_tasks)
    day = _focus_day(week, completed)

    # Today's study tasks + checkpoint quiz if study done
    daily_tasks: List[Dict[str, Any]] = []
    daily_quizzes: List[Dict[str, Any]] = []

    for task in week.tasks:
        if task.is_project:
            continue
        on_day = (task.day or 1) == day
        is_due_quiz = task.is_quiz and _study_tasks_done_for_day(week, day, completed)

        if task.is_quiz:
            if is_due_quiz and task.id not in completed and task.status != TaskStatus.COMPLETED:
                daily_quizzes.append(
                    {
                        "task_id": task.id,
                        "title": task.title,
                        "week": task.week,
                        "day": day,
                        "description": task.description or f"Checkpoint quiz for week {task.week}, day {day}.",
                        "topics": task.topics,
                        "quiz": task.quiz.model_dump(mode="json") if task.quiz else None,
                        "due_reason": "Complete today's study tasks, then take this quiz.",
                    }
                )
            continue

        if on_day and task.id not in completed and task.status != TaskStatus.COMPLETED:
            item = _serialize_task(task, state)
            item["schedule_reason"] = (
                f"Day {day} focus for week {state.current_week} toward: {state.current_goal}"
            )
            daily_tasks.append(item)
            if task.quiz:
                daily_quizzes.append(
                    {
                        "task_id": task.id,
                        "title": f"Quiz: {task.topics[0] if task.topics else task.title}",
                        "week": task.week,
                        "day": day,
                        "description": task.description,
                        "topics": task.topics,
                        "quiz": task.quiz.model_dump(mode="json"),
                        "due_reason": "Take after completing this study task (or at start if reviewing).",
                    }
                )

    overdue = _overdue_pending_tasks(week, day, completed)
    reason = _update_reason(state)
    if overdue and not reason:
        reason = f"{len(overdue)} earlier task(s) still pending – plan may update after quiz/progress sync."

    return {
        "user_id": state.user_id,
        "view": "daily",
        "goal": state.current_goal,
        "current_week": state.current_week,
        "focus_day": day,
        "plan_version": state.plan.version,
        "plan_title": state.plan.title,
        "state_inference": state.state_inference,
        "overall_progress": state.overall_progress,
        "next_milestone": state.next_milestone,
        "update_reason": reason,
        "overdue_task_ids": [t.id for t in overdue],
        "days_inactive": days_inactive(state),
        "tasks": daily_tasks,
        "quizzes": daily_quizzes,
    }


def get_weekly_schedule(state: LearnerState) -> Dict[str, Any]:
    week = _week_plan(state)
    if not week or not state.plan:
        return {
            "user_id": state.user_id,
            "view": "weekly",
            "goal": state.current_goal,
            "current_week": state.current_week,
            "plan_version": 0,
            "update_reason": _update_reason(state),
            "theme": "",
            "topics": [],
            "tasks": [],
            "quizzes": [],
            "message": "No plan found. Start workflow first.",
        }

    tasks = [_serialize_task(t, state) for t in week.tasks if not t.is_quiz]
    quizzes = [
        {
            "task_id": t.id,
            "title": t.title,
            "week": t.week,
            "description": t.description,
            "topics": t.topics,
            "quiz": t.quiz.model_dump(mode="json") if t.quiz else None,
            "due_reason": "Weekly checkpoint – complete after the week's study tasks.",
            "completed": t.id in state.completed_tasks,
        }
        for t in week.tasks
        if t.is_quiz
    ]

    return {
        "user_id": state.user_id,
        "view": "weekly",
        "goal": state.current_goal,
        "current_week": state.current_week,
        "plan_version": state.plan.version,
        "plan_title": state.plan.title,
        "state_inference": state.state_inference,
        "overall_progress": state.overall_progress,
        "next_milestone": state.next_milestone,
        "update_reason": _update_reason(state),
        "theme": week.theme,
        "topics": week.topics,
        "hours_allocated": week.hours_allocated,
        "tasks": tasks,
        "quizzes": quizzes,
    }


def _study_tasks_done_for_day(week: WeeklyPlan, day: int, completed: set[str]) -> bool:
    study = [t for t in _study_tasks(week) if (t.day or 1) == day]
    if not study:
        return True
    return all(t.id in completed or t.status == TaskStatus.COMPLETED for t in study)


def _overdue_pending_tasks(week: WeeklyPlan, focus_day: int, completed: set[str]) -> List[Task]:
    overdue: List[Task] = []
    for task in _study_tasks(week):
        if (task.day or 1) < focus_day and task.id not in completed and task.status != TaskStatus.COMPLETED:
            overdue.append(task)
    return overdue


def count_pending_in_week(state: LearnerState) -> int:
    week = _week_plan(state)
    if not week:
        return 0
    completed = set(state.completed_tasks)
    return sum(
        1
        for t in week.tasks
        if t.id not in completed and t.status != TaskStatus.COMPLETED and not t.is_quiz
    )
