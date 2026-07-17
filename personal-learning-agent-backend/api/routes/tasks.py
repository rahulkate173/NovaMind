"""Task schedule + completion endpoints (study tasks only – no quizzes)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from agents.main_agent import MainAgent
from api.dependencies import agent_dep

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class CompleteTaskRequest(BaseModel):
    user_id: str
    task_id: str


@router.get("/daily/{user_id}")
def get_daily_tasks(
    user_id: str,
    sync: bool = Query(True, description="Run dynamic workflow check before returning tasks"),
    agent: MainAgent = Depends(agent_dep),
):
    """Today's study tasks: task_id, task title, description, resources only."""
    try:
        return agent.get_tasks(user_id, view="daily", sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/weekly/{user_id}")
def get_weekly_tasks(
    user_id: str,
    sync: bool = Query(True, description="Run dynamic workflow check before returning tasks"),
    agent: MainAgent = Depends(agent_dep),
):
    """Current week study tasks: task_id, task title, description, resources only."""
    try:
        return agent.get_tasks(user_id, view="weekly", sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/schedule/{user_id}")
def get_schedule(
    user_id: str,
    view: Literal["daily", "weekly"] = Query("daily"),
    sync: bool = Query(True),
    agent: MainAgent = Depends(agent_dep),
):
    """Unified task schedule – daily or weekly (no quizzes)."""
    try:
        return agent.get_tasks(user_id, view=view, sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/complete")
def complete_task(body: CompleteTaskRequest, agent: MainAgent = Depends(agent_dep)):
    """Mark a study task complete by user_id + task_id."""
    try:
        result = agent.complete_task(body.user_id, body.task_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "Task not found"))
    return result
