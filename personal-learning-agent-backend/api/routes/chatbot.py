"""Chatbot API – /chat, /chat/history."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.dependencies import tutor_dep
from chatbot.tutor_bot import TutorBot

router = APIRouter(prefix="/api/chat", tags=["chatbot"])


class ChatRequest(BaseModel):
    user_id: str
    message: str


@router.post("")
@router.post("/")
def chat(body: ChatRequest, tutor: TutorBot = Depends(tutor_dep)):
    return tutor.chat(body.user_id, body.message)


@router.get("/history/{user_id}")
def chat_history(user_id: str, tutor: TutorBot = Depends(tutor_dep)):
    return tutor.history(user_id)
