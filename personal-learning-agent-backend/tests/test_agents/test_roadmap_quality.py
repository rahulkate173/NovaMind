"""Tests for real roadmap.sh parsing and quality plan generation."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("USE_MOCK_LLM", "true")

from agents.intent_parser import parse_intent
from agents.plan_generator import generate_plan
from agents.roadmap_fetcher import fetch_for_goal
from state.models import ContentSource
from tools.roadmap import list_available_roadmap_keys, load_local_roadmap, resolve_roadmap_key


def test_local_mlops_roadmap_loads():
    keys = list_available_roadmap_keys()
    assert "mlops" in keys
    assert "backend" in keys
    data = load_local_roadmap("mlops")
    assert data is not None
    assert data["source"] == "roadmap.sh"
    assert data["key"] == "mlops"
    assert data["phase_count"] >= 5
    titles = [s["title"] for s in data["steps"]]
    assert any("Programming" in t or "MLOps" in t for t in titles)


def test_resolve_mlops_goal():
    assert resolve_roadmap_key("", "Machine Learning Ops (MLOps)") == "mlops"
    intent = parse_intent("Machine Learning Ops (MLOps)", current_level="Beginner")
    assert intent.roadmap_key == "mlops"


def test_mlops_plan_quality():
    roadmap = fetch_for_goal("Machine Learning Ops (MLOps)", roadmap_key="mlops")
    assert roadmap["matched"] is True
    plan = generate_plan(
        goal="Machine Learning Ops (MLOps)",
        hours_per_week=20,
        total_weeks=12,
        roadmap_data=roadmap,
        source=ContentSource.ROADMAP,
        state_inference=1,
    )
    assert "MLOps" in plan.title or "mlops" in plan.title.lower()
    assert plan.total_weeks == 12
    themes = [w.theme for w in plan.weeks]
    # Themes should not be repetitive "Topic + Topic" noise from round-robin
    assert len(set(themes)) >= 8
    week1 = plan.weeks[0]
    assert week1.topics
    # Tasks should be actionable, not "Study: X"
    study_tasks = [t for t in week1.tasks if not t.is_quiz and not t.is_project]
    assert study_tasks
    assert all(not t.title.lower().startswith("study:") for t in study_tasks)
    assert any(t.is_quiz for t in week1.tasks)
    # Progression: later weeks should introduce different topics
    early = set(plan.weeks[0].topics) | set(plan.weeks[1].topics)
    late = set(plan.weeks[-1].topics) | set(plan.weeks[-2].topics)
    assert early != late


def test_backend_still_uses_real_roadmap():
    roadmap = fetch_for_goal("Become a Junior Backend Developer in 12 weeks", roadmap_key="backend")
    assert roadmap["source"] == "roadmap.sh"
    plan = generate_plan(
        goal="Become a Junior Backend Developer in 12 weeks",
        hours_per_week=20,
        total_weeks=12,
        roadmap_data=roadmap,
        source=ContentSource.ROADMAP,
    )
    assert plan.weeks[0].theme
    titles = [t.title for w in plan.weeks[:3] for t in w.tasks]
    blob = " ".join(titles + plan.weeks[0].topics + [plan.weeks[0].theme])
    assert any(
        token in blob
        for token in ("Git", "Internet", "Python", "Version", "Language", "API", "Docker")
    )
    assert all(not t.title.lower().startswith("study:") for w in plan.weeks[:2] for t in w.tasks)
