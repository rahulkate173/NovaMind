"""End-to-end simulation matching grok_report (1).pdf."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("USE_MOCK_LLM", "true")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./data/test_learner.db")
os.environ.setdefault("CHROMA_PERSIST_DIR", "./data/test_chroma")

from main import app  # noqa: E402


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db = tmp_path / "learner.db"
    chroma = tmp_path / "chroma"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db.as_posix()}")
    monkeypatch.setenv("CHROMA_PERSIST_DIR", str(chroma))
    monkeypatch.setenv("USE_MOCK_LLM", "true")

    # Reset singletons
    import agents.state_manager as sm
    import state.repository as repo
    import state.vector_store as vs
    import workflow.executor as ex
    import chatbot.memory as mem
    import chatbot.tutor_bot as tb
    import api.dependencies as deps
    import config as cfg

    cfg.get_settings.cache_clear()
    deps.get_main_agent.cache_clear()
    repo._repo = None
    vs._store = None
    sm._repo = None if False else None
    # force new repo/store
    from state.repository import StateRepository
    from state.vector_store import VectorStore
    from agents.state_manager import StateManager
    from workflow.executor import WorkflowExecutor
    from agents.main_agent import MainAgent

    new_repo = StateRepository(database_url=f"sqlite:///{db.as_posix()}")
    new_vs = VectorStore(persist_dir=str(chroma))
    manager = StateManager(repository=new_repo, vector_store=new_vs)
    executor = WorkflowExecutor()
    executor.state_manager = manager
    agent = MainAgent(executor=executor, state_manager=manager)

    monkeypatch.setattr(deps, "get_main_agent", lambda: agent)
    monkeypatch.setattr(deps, "get_state_manager", lambda: manager)
    monkeypatch.setattr("agents.state_manager.get_state_manager", lambda: manager)
    monkeypatch.setattr("workflow.nodes.get_state_manager", lambda: manager)

    # reset chat memory
    mem._memory = None
    tb._bot = None

    with TestClient(app) as c:
        # Override dependencies on app
        from api.dependencies import agent_dep, state_manager_dep

        app.dependency_overrides[agent_dep] = lambda: agent
        app.dependency_overrides[state_manager_dep] = lambda: manager
        yield c
        app.dependency_overrides.clear()


def test_grok_report_start_plan_and_state(client: TestClient):
    payload = {
        "user_id": "user_123",
        "goal": "Become a Junior Backend Developer in 12 weeks",
        "current_level": "Beginner",
        "available_hours_per_week": 20,
        "target_date": "2026-10-10",
    }
    resp = client.post("/api/workflow/start", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in {"persisted_waiting_for_learner", "plan_generated", "plan_updated"}
    assert data["learner_state"] is not None
    state = data["learner_state"]
    assert state["user_id"] == "user_123"
    assert state["current_goal"] == "Become a Junior Backend Developer in 12 weeks"
    assert state["current_week"] == 1
    assert state["overall_progress"] == 0.0 or state["overall_progress"] >= 0
    assert "plan" in state and state["plan"] is not None
    assert state["plan"]["total_weeks"] == 12
    assert state["plan"]["hours_per_week"] == 20
    # Week 1–2 style topics present
    week1_topics = state["plan"]["weeks"][0]["topics"]
    assert any("Git" in t or "Linux" in t or "HTTP" in t for t in week1_topics)

    get_state = client.get("/api/state/user_123")
    assert get_state.status_code == 200
    assert get_state.json()["user_id"] == "user_123"


def test_grok_report_quiz_feedback_loop(client: TestClient):
    client.post(
        "/api/workflow/start",
        json={
            "user_id": "user_123",
            "goal": "Become a Junior Backend Developer in 12 weeks",
            "current_level": "Beginner",
            "available_hours_per_week": 20,
            "target_date": "2026-10-10",
        },
    )
    quiz = {
        "user_id": "user_123",
        "week": 3,
        "score": 45,
        "weak_topics": ["SQL Joins", "Indexing"],
    }
    resp = client.post("/api/feedback/quiz", json=quiz)
    assert resp.status_code == 200
    data = resp.json()
    state = data["learner_state"]
    assert "SQL Joins" in state["weak_areas"]
    assert "Indexing" in state["weak_areas"]
    assert state["current_week"] == 3
    # Remedial tasks added via replan
    week3 = next(w for w in state["plan"]["weeks"] if w["week"] == 3)
    assert any(t.get("is_remedial") for t in week3["tasks"])


def test_grok_report_tutor_chat_uses_state(client: TestClient):
    client.post(
        "/api/workflow/start",
        json={
            "user_id": "user_123",
            "goal": "Become a Junior Backend Developer in 12 weeks",
            "current_level": "Beginner",
            "available_hours_per_week": 20,
            "target_date": "2026-10-10",
        },
    )
    client.post(
        "/api/feedback/quiz",
        json={
            "user_id": "user_123",
            "week": 3,
            "score": 45,
            "weak_topics": ["SQL Joins", "Indexing"],
        },
    )
    chat = client.post(
        "/api/chat/",
        json={"user_id": "user_123", "message": "I'm stuck on SQL Joins"},
    )
    assert chat.status_code == 200
    body = chat.json()
    assert body["state_injected"] is True
    assert "SQL Joins" in body["reply"] or "Week 3" in body["reply"] or "45" in body["reply"]
