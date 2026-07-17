"""Unit tests for intent parser and plan generator."""

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
from state.models import ContentSource, GoalClarity


def test_parse_backend_goal():
    intent = parse_intent(
        "Become a Junior Backend Developer in 12 weeks",
        current_level="Beginner",
        available_hours_per_week=20,
    )
    assert intent.clarity == GoalClarity.TRUE
    assert intent.is_valid
    assert intent.timeline_weeks == 12
    assert intent.roadmap_key == "backend"


def test_vague_goal_needs_clarification():
    intent = parse_intent("study")
    assert intent.clarity == GoalClarity.FALSE
    assert intent.clarification_question


def test_plan_matches_backend_roadmap():
    roadmap = fetch_for_goal("backend developer", domain="backend", roadmap_key="backend")
    plan = generate_plan(
        goal="Become a Junior Backend Developer in 12 weeks",
        hours_per_week=20,
        total_weeks=12,
        roadmap_data=roadmap,
        source=ContentSource.ROADMAP,
        state_inference=1,
    )
    assert plan.total_weeks == 12
    assert plan.hours_per_week == 20
    assert plan.state_inference == 1
    # quizzes present
    assert any(t.is_quiz for w in plan.weeks for t in w.tasks)
    # mini-project every 3 weeks
    assert any(t.is_project for w in plan.weeks for t in w.tasks if w.week % 3 == 0)
