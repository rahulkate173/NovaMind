"""Chatbot unit tests."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("USE_MOCK_LLM", "true")

from chatbot.memory import ChatMemory
from state.models import LearnerState
from state.repository import StateRepository
from state.vector_store import VectorStore
from agents.state_manager import StateManager


def test_memory_injects_state(tmp_path):
    repo = StateRepository(database_url=f"sqlite:///{(tmp_path / 't.db').as_posix()}")
    vs = VectorStore(persist_dir=str(tmp_path / "chroma"))
    sm = StateManager(repository=repo, vector_store=vs)
    sm.save(
        LearnerState(
            user_id="u1",
            current_goal="Backend in 12 weeks",
            current_week=3,
            overall_progress=20,
            weak_areas=["SQL Joins"],
            next_milestone="Databases",
        )
    )
    mem = ChatMemory()
    mem.state_manager = sm
    ctx = mem.inject_state_context("u1")
    assert "Week" in ctx or "current_week: 3" in ctx
    assert "SQL Joins" in ctx
