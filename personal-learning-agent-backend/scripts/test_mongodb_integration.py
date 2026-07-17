"""Live MongoDB integration test – storage + failed quiz replan.

Run from personal-learning-agent-backend:
  python scripts/test_mongodb_integration.py
"""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from config import get_settings
from state.mongo_repository import MongoStateRepository
from state.repository import get_repository, reset_repository
from agents.state_manager import StateManager
from services.task_progress_service import TaskProgressService
from workflow.executor import WorkflowExecutor


def _first_study_task(plan: dict) -> dict:
    for week in plan["weeks"]:
        for task in week["tasks"]:
            if not task.get("is_quiz") and not task.get("is_project"):
                return task
    raise RuntimeError("No study task in plan")


def _first_quiz_task(plan: dict) -> dict:
    for week in plan["weeks"]:
        for task in week["tasks"]:
            if task.get("is_quiz"):
                return task
    raise RuntimeError("No quiz task in plan")


def main() -> int:
    get_settings.cache_clear()
    reset_repository()

    settings = get_settings()
    print("=== MongoDB integration test ===")
    print(f"STATE_STORE: {settings.state_store}")
    print(f"Database:    {settings.mongodb_database}")
    print(f"Collection:  {settings.mongodb_collection}")

    if settings.state_store.strip().lower() != "mongodb":
        print("ERROR: STATE_STORE must be 'mongodb' in .env")
        return 1
    if not settings.mongodb_uri.strip():
        print("ERROR: MONGODB_URI is empty")
        return 1

    mongo = MongoStateRepository()
    if not mongo.ping():
        print("ERROR: Cannot ping MongoDB cluster – check URI / network / IP whitelist")
        return 1
    print("OK: MongoDB ping succeeded")

    user_id = f"mongo_test_{uuid.uuid4().hex[:8]}"
    print(f"Test user_id: {user_id}")

    repo = get_repository()
    assert repo.__class__.__name__ == "MongoStateRepository", f"Expected Mongo repo, got {type(repo)}"
    print(f"OK: Repository is {repo.__class__.__name__}")

    manager = StateManager(repository=repo)
    executor = WorkflowExecutor()
    executor.state_manager = manager
    progress = TaskProgressService(state_manager=manager, executor=executor)

    # 1) Start workflow → initial state saved to MongoDB
    print("\n--- Step 1: Start workflow ---")
    result = executor.start(
        user_id=user_id,
        goal="Become a Junior Backend Developer in 12 weeks",
        current_level="Beginner",
        available_hours_per_week=20,
    )
    assert result.get("plan"), "Workflow did not return a plan"
    plan_v1 = result["plan"]["version"]
    print(f"OK: Plan created (version {plan_v1})")

    doc = mongo.get(user_id)
    assert doc is not None, "State not found in MongoDB after workflow start"
    assert doc.user_id == user_id
    assert doc.plan is not None
    print(f"OK: Document stored in '{settings.mongodb_collection}' for user_id={user_id}")
    print(f"    plan.version={doc.plan.version}, goal={doc.current_goal[:50]}...")

    # 2) Complete a study task → state updated in MongoDB
    print("\n--- Step 2: Complete study task ---")
    study = _first_study_task(result["plan"])
    complete = progress.complete_task(user_id, study["id"])
    assert complete["ok"]
    doc2 = mongo.get(user_id)
    assert study["id"] in doc2.completed_tasks
    print(f"OK: Task {study['id'][:12]}... marked complete in MongoDB")

    # 3) Fail quiz → replan → updated state in MongoDB
    print("\n--- Step 3: Fail quiz -> dynamic replan ---")
    quiz_task = _first_quiz_task(result["plan"])
    submit = progress.submit_task_quiz(
        user_id=user_id,
        task_id=quiz_task["id"],
        score=40,
        weak_topics=["SQL Joins", "Indexing"],
    )
    assert submit["ok"]
    assert submit["replan_triggered"] is True, "Expected replan on failed quiz"
    assert submit.get("workflow"), "Expected workflow result from replan"

    doc3 = mongo.get(user_id)
    assert doc3 is not None
    assert "SQL Joins" in doc3.weak_areas
    assert doc3.last_plan_update_reason
    plan_v2 = doc3.plan.version if doc3.plan else 0
    print(f"OK: Replan saved to MongoDB")
    print(f"    weak_areas={doc3.weak_areas}")
    print(f"    last_plan_update_reason={doc3.last_plan_update_reason}")
    print(f"    plan.version v1={plan_v1} -> v2={plan_v2}")
    print(f"    quiz_history entries={len(doc3.quiz_history)}")

    if plan_v2 <= plan_v1:
        print("WARN: Plan version did not increase (mock LLM may skip remedial weeks)")

    # 4) Cleanup test user (optional – keeps Atlas tidy)
    deleted = mongo.delete(user_id)
    print(f"\n--- Cleanup: deleted test user {deleted} ---")
    print("\n=== ALL CHECKS PASSED ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
