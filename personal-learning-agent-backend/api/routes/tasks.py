"""Task schedule + completion + quiz endpoints for the frontend."""

from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from agents.main_agent import MainAgent
from api.dependencies import agent_dep

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class CompleteTaskRequest(BaseModel):
    user_id: str
    task_id: str


class TaskQuizSubmitRequest(BaseModel):
    user_id: str
    task_id: str
    score: float = Field(ge=0, le=100)
    weak_topics: List[str] = Field(default_factory=list)


@router.get("/daily/{user_id}")
def get_daily_tasks(
    user_id: str,
    sync: bool = Query(True, description="Run dynamic workflow check before returning schedule"),
    agent: MainAgent = Depends(agent_dep),
):
    """Today's tasks + quizzes with description, resources, sub_skills. Auto-syncs replan if needed."""
    try:
        return agent.get_schedule(user_id, view="daily", sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/weekly/{user_id}")
def get_weekly_tasks(
    user_id: str,
    sync: bool = Query(True, description="Run dynamic workflow check before returning schedule"),
    agent: MainAgent = Depends(agent_dep),
):
    """Current week tasks + checkpoint quizzes with full details."""
    try:
        return agent.get_schedule(user_id, view="weekly", sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/schedule/{user_id}")
def get_schedule(
    user_id: str,
    view: Literal["daily", "weekly"] = Query("daily"),
    sync: bool = Query(True),
    agent: MainAgent = Depends(agent_dep),
):
    """Unified schedule endpoint – daily or weekly."""
    try:
        return agent.get_schedule(user_id, view=view, sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/complete")
def complete_task(body: CompleteTaskRequest, agent: MainAgent = Depends(agent_dep)):
    """Mark a task complete by user_id + task_id."""
    try:
        result = agent.complete_task(body.user_id, body.task_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "Task not found"))
    return result


@router.post("/quiz/submit")
def submit_task_quiz(body: TaskQuizSubmitRequest, agent: MainAgent = Depends(agent_dep)):
    """
    Submit quiz for a specific task (daily/weekly quiz).
    Low score triggers dynamic replan from roadmap + updated state.
    """
    try:
        result = agent.submit_task_quiz(
            user_id=body.user_id,
            task_id=body.task_id,
            score=body.score,
            weak_topics=body.weak_topics,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "Task not found"))
    return result
