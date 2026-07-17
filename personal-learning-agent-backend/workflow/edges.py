"""Conditional routing logic for the learning workflow graph."""

from __future__ import annotations

from typing import Literal

from workflow.nodes import WorkflowState


def after_intent(state: WorkflowState) -> Literal["clarify_goal", "content_retriever"]:
    if state.get("goal_valid"):
        return "content_retriever"
    return "clarify_goal"


def after_content(state: WorkflowState) -> Literal["plan_generator"]:
    # Both roadmap.sh and websearch converge on plan_generator
    return "plan_generator"


def after_router(state: WorkflowState) -> Literal["nudge_generator", "feedback", "final_state"]:
    route = state.get("route") or "feedback"
    if route == "final":
        return "final_state"
    if route == "nudge":
        return "nudge_generator"
    return "feedback"


def after_analyzer(state: WorkflowState) -> Literal["plan_generator", "final_state", "__end__"]:
    route = state.get("route") or "wait"
    if route == "replan":
        return "plan_generator"
    if route == "final":
        return "final_state"
    return "__end__"
