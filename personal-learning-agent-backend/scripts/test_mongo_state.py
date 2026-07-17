"""Live MongoDB integration test – state save + failed quiz replan."""

from __future__ import annotations

import json
import os
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Load .env before config
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
os.environ.setdefault("USE_MOCK_LLM", "true")

from config import get_settings
from state.mongo_repository import MongoStateRepository
from state.repository import reset_repository
from agents.state_manager import StateManager
from workflow.executor import WorkflowExecutor
from services.task_progress_service import TaskProgressService
from state.models import QuizResult

TEST_USER = "mongo_integration_test_user"


def _first_study_task(state) -> dict | None:
    if not state.plan:
        return None
    for week in state.plan.weeks:
        for task in week.tasks:
            if not task.is_quiz and not task.is_project:
                return task.model_dump(mode="json")
    return None


def _first_quiz_task(state) -> dict | None:
    if not state.plan:
        return None
    for week in state.plan.weeks:
        for task in week.tasks:
            if task.is_quiz:
                return task.model_dump(mode="json")
    return None


def main() -> int:
    settings = get_settings()
    print("=== MongoDB State Integration Test ===\n")
    print(f"STATE_STORE:     {settings.state_store}")
    print(f"MONGODB_DATABASE: {settings.mongodb_database}")
    print(f"MONGODB_COLLECTION: {settings.mongodb_collection}")
    print(f"TEST_USER:       {TEST_USER}\n")

    if settings.state_store.lower() != "mongodb":
        print("ERROR: STATE_STORE is not mongodb in .env")
        return 1

    reset_repository()
    repo = MongoStateRepository()
    if not repo.ping():
        print("ERROR: Cannot ping MongoDB – check MONGODB_URI and network/IP whitelist")
        return 1
    print("OK: MongoDB ping successful\n")

    # Clean prior test doc
    repo.delete(TEST_USER)

    sm = StateManager(repository=repo)
    executor = WorkflowExecutor()
    executor.state_manager = sm
    tasks_svc = TaskProgressService(state_manager=sm, executor=executor)

    print("1) Starting workflow (creates learner state)...")
    result = executor.start(
        user_id=TEST_USER,
        goal="Become a Junior Backend Developer in 12 weeks",
        current_level="Beginner",
        available_hours_per_week=20,
        target_date=date(2026, 10, 10),
    )
    assert result.get("learner_state"), "Workflow did not return learner_state"
    plan_v1 = result["learner_state"]["plan"]["version"]
    print(f"   Plan created: v{plan_v1}")

    doc = repo._collection.find_one({"user_id": TEST_USER})
    assert doc is not None, "Document not found in MongoDB after workflow start"
    print(f"   OK: Document stored in '{settings.mongodb_database}.{settings.mongodb_collection}'")
    print(f"   Document keys: {list(doc.keys())}")
    print(f"   user_id in doc: {doc['user_id']}")
    print(f"   goal in payload: {doc['payload']['current_goal'][:60]}...\n")

    state = sm.load(TEST_USER)
    study = _first_study_task(state)
    quiz = _first_quiz_task(state)
    assert study, "No study task in plan"
    assert quiz, "No quiz task in plan"

    print("2) Completing first study task...")
    complete = tasks_svc.complete_task(TEST_USER, study["id"])
    assert complete["ok"]
    doc2 = repo._collection.find_one({"user_id": TEST_USER})
    completed_count = len(doc2["payload"]["completed_tasks"])
    print(f"   OK: completed_tasks in MongoDB = {completed_count}\n")

    print("3) Submitting FAILED quiz (score 40) – should trigger replan...")
    quiz_submit = tasks_svc.submit_task_quiz(
        user_id=TEST_USER,
        task_id=quiz["id"],
        score=40,
        weak_topics=["SQL Joins", "Indexing"],
    )
    assert quiz_submit["replan_triggered"] is True
    assert quiz_submit["passed"] is False

    doc3 = repo._collection.find_one({"user_id": TEST_USER})
    payload = doc3["payload"]
    plan_v2 = payload["plan"]["version"]
    weak = payload.get("weak_areas", [])
    reason = payload.get("last_plan_update_reason", "")

    print(f"   replan_triggered: {quiz_submit['replan_triggered']}")
    print(f"   Plan version: v{plan_v1} -> v{plan_v2}")
    print(f"   weak_areas in MongoDB: {weak}")
    print(f"   last_plan_update_reason: {reason}")
    print(f"   quiz_history entries: {len(payload.get('quiz_history', []))}")

    assert plan_v2 >= plan_v1, "Plan version should increase or stay after replan"
    assert "SQL Joins" in weak, "weak_areas should include failed topics"
    assert reason, "last_plan_update_reason should be set after replan"
    print("\n   OK: Failed quiz updated user state in MongoDB (replan + weak_areas)\n")

    print("4) Loading state by user_id via API path (StateManager)...")
    reloaded = sm.load(TEST_USER)
    assert reloaded is not None
    assert reloaded.user_id == TEST_USER
    assert reloaded.plan.version == plan_v2
    print(f"   OK: State reloads correctly for user_id={TEST_USER}\n")

    print("=== ALL TESTS PASSED ===")
    print(f"\nAtlas location:")
    print(f"  Database:   {settings.mongodb_database}")
    print(f"  Collection: {settings.mongodb_collection}")
    print(f"  Filter:     {{ user_id: \"{TEST_USER}\" }}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
