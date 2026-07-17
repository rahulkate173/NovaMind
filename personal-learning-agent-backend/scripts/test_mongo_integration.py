"""Live MongoDB integration test – state save + failed-quiz replan update."""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Load .env before config
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
os.environ.setdefault("USE_MOCK_LLM", "true")

import config as cfg
from state.mongo_repository import MongoStateRepository
from state.repository import reset_repository


def main() -> int:
    settings = cfg.get_settings()
    print("=== MongoDB integration test ===")
    print(f"STATE_STORE={settings.state_store}")
    print(f"MONGODB_DATABASE={settings.mongodb_database}")
    print(f"MONGODB_COLLECTION={settings.mongodb_collection}")

    if settings.state_store.strip().lower() != "mongodb":
        print("ERROR: STATE_STORE is not mongodb in .env")
        return 1

    reset_repository()
    cfg.get_settings.cache_clear()

    repo = MongoStateRepository()
    if not repo.ping():
        print("ERROR: MongoDB ping failed – check URI / network / IP whitelist")
        return 1
    print("OK: MongoDB connection ping succeeded")

    user_id = f"mongo_test_{uuid.uuid4().hex[:8]}"
    print(f"Test user_id: {user_id}")

    # --- 1) Start workflow → state saved to MongoDB ---
    from agents.main_agent import MainAgent
    from agents.state_manager import StateManager
    from workflow.executor import WorkflowExecutor

    reset_repository()
    cfg.get_settings.cache_clear()
    manager = StateManager()
    executor = WorkflowExecutor()
    executor.state_manager = manager
    agent = MainAgent(executor=executor, state_manager=manager)

    start = agent.start(
        user_id=user_id,
        goal="Become a Junior Backend Developer in 12 weeks",
        current_level="Beginner",
        available_hours_per_week=20,
        target_date="2026-10-10",
    )
    plan_v1 = start.get("plan", {}).get("version", 0)
    print(f"OK: workflow started – plan version {plan_v1}")

    doc = repo.get(user_id)
    if doc is None:
        print("ERROR: No document in MongoDB after workflow start")
        return 1
    print(f"OK: MongoDB document found for user_id={user_id}")
    print(f"    goal={doc.current_goal!r}, week={doc.current_week}, progress={doc.overall_progress}")

    raw = repo._collection.find_one({"user_id": user_id})
    print(f"    collection={settings.mongodb_collection}, keys={list(raw.keys())}")

    # --- 2) Find quiz task and submit failing score → replan ---
    week1 = start["plan"]["weeks"][0]
    quiz_task = next(t for t in week1["tasks"] if t.get("is_quiz"))
    study_task = next(
        t for t in week1["tasks"] if not t.get("is_quiz") and not t.get("is_project")
    )
    agent.complete_task(user_id, study_task["id"])
    print(f"OK: completed study task {study_task['id'][:12]}...")

    result = agent.submit_task_quiz(
        user_id=user_id,
        task_id=quiz_task["id"],
        score=40,
        weak_topics=["SQL Joins", "Indexing"],
    )
    replan = result.get("replan_triggered")
    plan_v2 = result.get("learner_state", {}).get("plan", {}).get("version", plan_v1)
    print(f"OK: quiz submitted score=40 - replan_triggered={replan}, plan v{plan_v1} -> v{plan_v2}")

    doc_after = repo.get(user_id)
    if doc_after is None:
        print("ERROR: Document missing after replan")
        return 1

    weak = doc_after.weak_areas
    reason = doc_after.last_plan_update_reason or ""
    print(f"OK: MongoDB updated – weak_areas={weak}")
    print(f"    last_plan_update_reason={reason!r}")
    print(f"    plan.version={doc_after.plan.version if doc_after.plan else None}")
    print(f"    quiz_history_count={len(doc_after.quiz_history)}")

    failures = []
    if not replan:
        failures.append("replan_triggered was False")
    if plan_v2 <= plan_v1:
        failures.append(f"plan version did not increase ({plan_v1} -> {plan_v2})")
    if "SQL Joins" not in weak:
        failures.append("weak_areas missing SQL Joins")
    if not reason:
        failures.append("last_plan_update_reason empty")

    remedial = [
        t
        for w in (doc_after.plan.weeks if doc_after.plan else [])
        for t in w.tasks
        if t.is_remedial
    ]
    print(f"    remedial_tasks={len(remedial)}")

    # --- 3) Multi-user isolation ---
    other_id = f"mongo_other_{uuid.uuid4().hex[:8]}"
    other_doc_before = repo.get(other_id)
    if other_doc_before is not None:
        failures.append(f"unexpected pre-existing doc for {other_id}")

    from state.models import LearnerState

    other = LearnerState(user_id=other_id, current_goal="Other user goal")
    repo.save(other)
    assert repo.get(other_id) is not None
    assert repo.get(user_id) is not None
    assert repo.get(other_id).current_goal == "Other user goal"
    assert repo.get(user_id).current_goal != "Other user goal"
    repo.delete(other_id)
    print("OK: multi-user isolation – separate documents per user_id")

    # cleanup test user
    repo.delete(user_id)
    print(f"OK: cleaned up test user {user_id}")

    if failures:
        print("\nFAILED checks:")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("\n=== ALL CHECKS PASSED ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
