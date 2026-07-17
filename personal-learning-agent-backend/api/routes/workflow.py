"""Workflow API – /start, /resume, /get-plan, quiz feedback loop."""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from agents.main_agent import MainAgent
from api.dependencies import agent_dep

router = APIRouter(prefix="/api/workflow", tags=["workflow"])


class StartRequest(BaseModel):
    user_id: str
    goal: str
    current_level: str = "Beginner"
    available_hours_per_week: float = 20
    target_date: Optional[str] = None


class ResumeRequest(BaseModel):
    user_id: str
    clarification: Optional[str] = None


class QuizFeedbackRequest(BaseModel):
    user_id: str
    week: int
    score: float
    weak_topics: List[str] = Field(default_factory=list)


@router.post("/start")
def start_workflow(body: StartRequest, agent: MainAgent = Depends(agent_dep)):
    """Frontend → Backend start (matches grok_report Section 1)."""
    if body.target_date:
        try:
            date.fromisoformat(body.target_date)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="target_date must be YYYY-MM-DD") from exc
    return agent.start(
        user_id=body.user_id,
        goal=body.goal,
        current_level=body.current_level,
        available_hours_per_week=body.available_hours_per_week,
        target_date=body.target_date,
    )


@router.post("/resume")
def resume_workflow(body: ResumeRequest, agent: MainAgent = Depends(agent_dep)):
    return agent.resume(user_id=body.user_id, clarification=body.clarification)


@router.get("/get-plan/{user_id}")
def get_plan(user_id: str, agent: MainAgent = Depends(agent_dep)):
    plan = agent.get_plan(user_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"user_id": user_id, "plan": plan}


# Alias path used in grok_report Section 4
feedback_router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@feedback_router.post("/quiz")
def submit_quiz(body: QuizFeedbackRequest, agent: MainAgent = Depends(agent_dep)):
    """Dynamic update example – low score triggers remediation + replan."""
    return agent.submit_quiz(body.model_dump())
