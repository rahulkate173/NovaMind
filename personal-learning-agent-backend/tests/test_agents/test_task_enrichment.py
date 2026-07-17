"""Tests for rich topic descriptions, resources, and per-subtask quizzes."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("USE_MOCK_LLM", "true")

from agents.plan_generator import generate_plan
from agents.roadmap_fetcher import fetch_for_goal
from state.models import ContentSource
from tools.topic_content import load_topic_bundle


def test_mathematics_content_from_roadmap():
    bundle = load_topic_bundle("ai-data-scientist", "Mathematics")
    assert bundle["has_official_content"]
    assert "linear algebra" in bundle["description"].lower() or "Mathematics" in bundle["description"]
    assert any(
        "Linear Algebra" in s or "Calculus" in s for s in bundle["sub_skills"]
    ) or bundle["sub_skills"]
    assert any(
        "Machine Learning" in r["title"] or r.get("url") for r in bundle["resources"]
    )


def test_data_scientist_plan_has_rich_tasks_and_quizzes():
    roadmap = fetch_for_goal(
        "Become an AI and Data Scientist",
        domain="ai-data-scientist",
        roadmap_key="ai-data-scientist",
    )
    assert roadmap["matched"]
    plan = generate_plan(
        goal="Become an AI and Data Scientist",
        hours_per_week=20,
        total_weeks=8,
        roadmap_data=roadmap,
        source=ContentSource.ROADMAP,
    )
    # Find a Mathematics-related task if present, else any study task
    study_tasks = [
        t
        for w in plan.weeks
        for t in w.tasks
        if not t.is_quiz and not t.is_project
    ]
    assert study_tasks
    sample = next(
        (t for t in study_tasks if "math" in " ".join(t.topics).lower() or "math" in t.title.lower()),
        study_tasks[0],
    )
    assert len(sample.description) > 40
    assert sample.description.lower() != sample.topics[0].lower()
    assert sample.sub_skills
    assert sample.resources
    assert sample.quiz is not None
    assert len(sample.quiz.questions) >= 2
    # Quiz grounded in goal/topic
    joined = " ".join(q.prompt for q in sample.quiz.questions).lower()
    assert "data scientist" in joined or sample.topics[0].lower() in joined or "goal" in joined
