"""Quiz schedule endpoints – separate from study tasks."""

from __future__ import annotations

from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from agents.main_agent import MainAgent
from api.dependencies import agent_dep

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


class QuizSubmitRequest(BaseModel):
    user_id: str
    task_id: str
    score: float = Field(ge=0, le=100)
    weak_topics: List[str] = Field(default_factory=list)


@router.get("/daily/{user_id}")
def get_daily_quizzes(
    user_id: str,
    sync: bool = Query(True, description="Run dynamic workflow check before returning quizzes"),
    agent: MainAgent = Depends(agent_dep),
):
    """Today's quizzes with sub-questions (no study task content)."""
    try:
        return agent.get_quizzes(user_id, view="daily", sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/weekly/{user_id}")
def get_weekly_quizzes(
    user_id: str,
    sync: bool = Query(True, description="Run dynamic workflow check before returning quizzes"),
    agent: MainAgent = Depends(agent_dep),
):
    """Current week quizzes with sub-questions."""
    try:
        return agent.get_quizzes(user_id, view="weekly", sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/schedule/{user_id}")
def get_quiz_schedule(
    user_id: str,
    view: Literal["daily", "weekly"] = Query("daily"),
    sync: bool = Query(True),
    agent: MainAgent = Depends(agent_dep),
):
    """Unified quiz schedule – daily or weekly."""
    try:
        return agent.get_quizzes(user_id, view=view, sync=sync)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/submit")
def submit_quiz(body: QuizSubmitRequest, agent: MainAgent = Depends(agent_dep)):
    """
    Submit quiz answers for a task_id.
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
