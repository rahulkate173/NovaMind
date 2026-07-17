"""MCP tool definitions for future agent tool-calling."""

from __future__ import annotations

from typing import Any, Dict, List

TOOLS_DEFINITION: List[Dict[str, Any]] = [
    {
        "name": "start_learning_workflow",
        "description": "Start the personal learning agent workflow for a user goal.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "goal": {"type": "string"},
                "current_level": {"type": "string"},
                "available_hours_per_week": {"type": "number"},
                "target_date": {"type": "string"},
            },
            "required": ["user_id", "goal"],
        },
    },
    {
        "name": "submit_quiz_feedback",
        "description": "Submit quiz results to trigger the closed feedback loop.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "week": {"type": "integer"},
                "score": {"type": "number"},
                "weak_topics": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["user_id", "week", "score"],
        },
    },
    {
        "name": "get_learner_state",
        "description": "Fetch the latest LearnerState for a user.",
        "parameters": {
            "type": "object",
            "properties": {"user_id": {"type": "string"}},
            "required": ["user_id"],
        },
    },
    {
        "name": "tutor_chat",
        "description": "Chat with the state-aware AI tutor.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "message": {"type": "string"},
            },
            "required": ["user_id", "message"],
        },
    },
]
