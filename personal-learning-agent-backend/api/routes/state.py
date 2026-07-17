"""State API – /state/{user_id}, /state/update."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from agents.state_manager import StateManager
from api.dependencies import state_manager_dep
from state.models import LearnerState

router = APIRouter(prefix="/api/state", tags=["state"])


class StateUpdateRequest(BaseModel):
    user_id: str
    fields: Dict[str, Any]


@router.get("/{user_id}")
def get_state(user_id: str, sm: StateManager = Depends(state_manager_dep)):
    """Matches grok_report: GET /api/state/user_123"""
    state = sm.load(user_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Learner state not found")
    return state.model_dump(mode="json")


@router.post("/update")
def update_state(body: StateUpdateRequest, sm: StateManager = Depends(state_manager_dep)):
    existing = sm.load(body.user_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Learner state not found")
    data = existing.model_dump(mode="json")
    data.update(body.fields)
    try:
        updated = LearnerState.model_validate(data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    saved = sm.save(updated)
    return saved.model_dump(mode="json")
