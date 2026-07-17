"""Tests for daily/weekly schedule, task completion, and dynamic replan."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("USE_MOCK_LLM", "true")


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db = tmp_path / "learner.db"
    chroma = tmp_path / "chroma"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db.as_posix()}")
    monkeypatch.setenv("CHROMA_PERSIST_DIR", str(chroma))
    monkeypatch.setenv("USE_MOCK_LLM", "true")

    import api.dependencies as deps
    import config as cfg
    import state.repository as repo
    import state.vector_store as vs
    import workflow.nodes as nodes

    cfg.get_settings.cache_clear()
    deps.get_main_agent.cache_clear()
    repo._repo = None
    vs._store = None

    from agents.main_agent import MainAgent
    from agents.state_manager import StateManager
    from state.repository import StateRepository
    from state.vector_store import VectorStore
    from workflow.executor import WorkflowExecutor

    new_repo = StateRepository(database_url=f"sqlite:///{db.as_posix()}")
    new_vs = VectorStore(persist_dir=str(chroma))
    manager = StateManager(repository=new_repo, vector_store=new_vs)
    executor = WorkflowExecutor()
    executor.state_manager = manager
    agent = MainAgent(executor=executor, state_manager=manager)

    monkeypatch.setattr(deps, "get_main_agent", lambda: agent)
    monkeypatch.setattr(deps, "get_state_manager", lambda: manager)
    monkeypatch.setattr("agents.state_manager.get_state_manager", lambda: manager)
    monkeypatch.setattr(nodes, "get_state_manager", lambda: manager)

    from main import app

    app.dependency_overrides[deps.agent_dep] = lambda: agent
    app.dependency_overrides[deps.state_manager_dep] = lambda: manager
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _start(client: TestClient, user_id: str = "u_tasks") -> dict:
    resp = client.post(
        "/api/workflow/start",
        json={
            "user_id": user_id,
            "goal": "Become a Junior Backend Developer in 12 weeks",
            "current_level": "Beginner",
            "available_hours_per_week": 20,
            "target_date": "2026-10-10",
        },
    )
    assert resp.status_code == 200
    return resp.json()


def _first_study_task(plan: dict) -> dict:
    for week in plan["weeks"]:
        for task in week["tasks"]:
            if not task.get("is_quiz") and not task.get("is_project"):
                return task
    raise AssertionError("No study task found")


def test_daily_schedule_has_rich_tasks(client: TestClient):
    _start(client)
    resp = client.get("/api/tasks/daily/u_tasks?sync=false")
    assert resp.status_code == 200
    data = resp.json()
    assert data["view"] == "daily"
    assert data["goal"]
    assert data["current_week"] >= 1
    assert isinstance(data["tasks"], list)
    if data["tasks"]:
        task = data["tasks"][0]
        assert "description" in task
        assert "resources" in task
        assert "sub_skills" in task
        assert "schedule_reason" in task
    assert "quizzes" in data


def test_weekly_schedule_has_theme_and_quizzes(client: TestClient):
    _start(client)
    resp = client.get("/api/tasks/weekly/u_tasks?sync=false")
    assert resp.status_code == 200
    data = resp.json()
    assert data["view"] == "weekly"
    assert data["theme"]
    assert data["topics"]
    assert len(data["tasks"]) >= 1


def test_complete_task_updates_state(client: TestClient):
    start = _start(client)
    task = _first_study_task(start["plan"])
    resp = client.post("/api/tasks/complete", json={"user_id": "u_tasks", "task_id": task["id"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["task"]["status"] == "completed"
    state = client.get("/api/state/u_tasks").json()
    assert task["id"] in state["completed_tasks"]


def test_failed_task_quiz_triggers_dynamic_replan(client: TestClient):
    start = _start(client)
    plan_v1 = start["plan"]["version"]
    week1 = start["plan"]["weeks"][0]
    quiz_task = next(t for t in week1["tasks"] if t.get("is_quiz"))
    study = _first_study_task(start["plan"])
    client.post("/api/tasks/complete", json={"user_id": "u_tasks", "task_id": study["id"]})

    resp = client.post(
        "/api/tasks/quiz/submit",
        json={
            "user_id": "u_tasks",
            "task_id": quiz_task["id"],
            "score": 40,
            "weak_topics": ["SQL Joins", "Indexing"],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["replan_triggered"] is True
    assert body["passed"] is False
    assert "workflow" in body

    state = client.get("/api/state/u_tasks").json()
    assert "SQL Joins" in state["weak_areas"]
    assert state["plan"]["version"] >= plan_v1
    assert state.get("last_plan_update_reason")
