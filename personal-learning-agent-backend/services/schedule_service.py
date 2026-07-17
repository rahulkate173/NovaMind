"""Resolve tasks from learner plan and build daily/weekly schedules for the frontend."""

from __future__ import annotations

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


def _serialize_task_item(task: Task) -> Dict[str, Any]:
    """Frontend task payload – title, description, resources only."""
    return {
        "task_id": task.id,
        "task": task.title,
        "description": task.description,
        "resources": [r.model_dump(mode="json") for r in task.resources],
    }


def _serialize_quiz_item(
    *,
    task_id: str,
    title: str,
    week: int,
    day: Optional[int],
    topics: List[str],
    quiz,
    due_reason: str,
    completed: bool,
) -> Dict[str, Any]:
    if quiz is None:
        return {
            "task_id": task_id,
            "title": title,
            "week": week,
            "day": day,
            "topics": topics,
            "quiz_id": None,
            "questions": [],
            "due_reason": due_reason,
            "completed": completed,
        }
    return {
        "task_id": task_id,
        "title": title,
        "week": week,
        "day": day,
        "topics": topics,
        "quiz_id": quiz.quiz_id,
        "questions": [q.model_dump(mode="json") for q in quiz.questions],
        "due_reason": due_reason,
        "completed": completed,
    }


def _schedule_meta(state: LearnerState, view: str, **extra) -> Dict[str, Any]:
    base = {
        "user_id": state.user_id,
        "view": view,
        "goal": state.current_goal,
        "current_week": state.current_week,
        "plan_version": state.plan.version if state.plan else 0,
        "plan_title": state.plan.title if state.plan else "",
        "update_reason": _update_reason(state),
    }
    base.update(extra)
    return base


def get_daily_tasks(state: LearnerState) -> Dict[str, Any]:
    week = _week_plan(state)
    if not week or not state.plan:
        return {
            **_schedule_meta(state, "daily", focus_day=1),
            "tasks": [],
            "message": "No plan found. Start workflow first.",
        }

    completed = set(state.completed_tasks)
    day = _focus_day(week, completed)
    daily_tasks: List[Dict[str, Any]] = []

    for task in week.tasks:
        if task.is_project or task.is_quiz:
            continue
        on_day = (task.day or 1) == day
        if on_day:
            is_done = task.id in completed or task.status == TaskStatus.COMPLETED
            item = _serialize_task_item(task)
            item["completed"] = is_done
            daily_tasks.append(item)

    overdue = _overdue_pending_tasks(week, day, completed)
    reason = _update_reason(state)
    if overdue and not reason:
        reason = f"{len(overdue)} earlier task(s) still pending – plan may update after quiz/progress sync."

    return {
        **_schedule_meta(state, "daily", focus_day=day, update_reason=reason),
        "overdue_task_ids": [t.id for t in overdue],
        "tasks": daily_tasks,
    }


def get_weekly_tasks(state: LearnerState) -> Dict[str, Any]:
    week = _week_plan(state)
    if not week or not state.plan:
        return {
            **_schedule_meta(state, "weekly", theme="", topics=[]),
            "tasks": [],
            "message": "No plan found. Start workflow first.",
        }

    tasks = [
        _serialize_task_item(t)
        for t in week.tasks
        if not t.is_quiz and not t.is_project
    ]

    return {
        **_schedule_meta(state, "weekly", theme=week.theme, topics=week.topics),
        "tasks": tasks,
    }


def get_daily_quizzes(state: LearnerState) -> Dict[str, Any]:
    week = _week_plan(state)
    if not week or not state.plan:
        return {
            **_schedule_meta(state, "daily", focus_day=1),
            "quizzes": [],
            "message": "No plan found. Start workflow first.",
        }

    completed = set(state.completed_tasks)
    day = _focus_day(week, completed)
    daily_quizzes: List[Dict[str, Any]] = []

    for task in week.tasks:
        if task.is_project:
            continue
        on_day = (task.day or 1) == day
        is_due_checkpoint = task.is_quiz and _study_tasks_done_for_day(week, day, completed)

        if task.is_quiz:
            is_completed = task.id in completed or task.status == TaskStatus.COMPLETED
            if is_due_checkpoint or is_completed:
                daily_quizzes.append(
                    _serialize_quiz_item(
                        task_id=task.id,
                        title=task.title,
                        week=task.week,
                        day=day,
                        topics=task.topics,
                        quiz=task.quiz,
                        due_reason="Complete today's study tasks, then take this checkpoint quiz.",
                        completed=is_completed,
                    )
                )
            continue

        is_completed = task.id in completed or task.status == TaskStatus.COMPLETED
        if on_day and task.quiz:
            daily_quizzes.append(
                _serialize_quiz_item(
                    task_id=task.id,
                    title=f"Quiz: {task.topics[0] if task.topics else task.title}",
                    week=task.week,
                    day=day,
                    topics=task.topics,
                    quiz=task.quiz,
                    due_reason="Take after completing the related study task (or at start if reviewing).",
                    completed=is_completed,
                )
            )

    return {
        **_schedule_meta(state, "daily", focus_day=day),
        "quizzes": daily_quizzes,
    }


def get_weekly_quizzes(state: LearnerState) -> Dict[str, Any]:
    week = _week_plan(state)
    if not week or not state.plan:
        return {
            **_schedule_meta(state, "weekly", theme="", topics=[]),
            "quizzes": [],
            "message": "No plan found. Start workflow first.",
        }

    completed = set(state.completed_tasks)
    quizzes: List[Dict[str, Any]] = []

    for task in week.tasks:
        if task.is_quiz:
            quizzes.append(
                _serialize_quiz_item(
                    task_id=task.id,
                    title=task.title,
                    week=task.week,
                    day=task.day,
                    topics=task.topics,
                    quiz=task.quiz,
                    due_reason="Weekly checkpoint – complete after the week's study tasks.",
                    completed=task.id in completed or task.status == TaskStatus.COMPLETED,
                )
            )
        elif task.quiz and not task.is_project:
            quizzes.append(
                _serialize_quiz_item(
                    task_id=task.id,
                    title=f"Quiz: {task.topics[0] if task.topics else task.title}",
                    week=task.week,
                    day=task.day,
                    topics=task.topics,
                    quiz=task.quiz,
                    due_reason="Subtask quiz for this week's study item.",
                    completed=task.id in completed or task.status == TaskStatus.COMPLETED,
                )
            )

    return {
        **_schedule_meta(state, "weekly", theme=week.theme, topics=week.topics),
        "quizzes": quizzes,
    }


# Backward-compatible aliases used internally
def get_daily_schedule(state: LearnerState) -> Dict[str, Any]:
    return get_daily_tasks(state)


def get_weekly_schedule(state: LearnerState) -> Dict[str, Any]:
    return get_weekly_tasks(state)


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
