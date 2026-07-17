"""LangGraph state graph – nodes, edges, and cycles from the Excalidraw workflow."""

from __future__ import annotations

from typing import Any

from workflow.edges import after_analyzer, after_intent, after_router
from workflow.nodes import (
    clarify_goal_node,
    conditional_router_node,
    content_retriever_node,
    feedback_node,
    final_state_node,
    intent_parser_node,
    nudge_generator_node,
    persist_state_node,
    plan_generator_node,
    plan_updater_node,
    state_analyzer_node,
    WorkflowState,
)


def build_graph():
    """Compile the Personal Learning Agent workflow graph."""
    from langgraph.graph import END, StateGraph

    graph: StateGraph = StateGraph(WorkflowState)

    graph.add_node("intent_parser", intent_parser_node)
    graph.add_node("clarify_goal", clarify_goal_node)
    graph.add_node("content_retriever", content_retriever_node)
    graph.add_node("plan_generator", plan_generator_node)
    graph.add_node("plan_updater", plan_updater_node)
    graph.add_node("persist_learning_state", persist_state_node)
    graph.add_node("conditional_router", conditional_router_node)
    graph.add_node("nudge_generator", nudge_generator_node)
    graph.add_node("feedback", feedback_node)
    graph.add_node("state_analyzer", state_analyzer_node)
    graph.add_node("final_state", final_state_node)

    graph.set_entry_point("intent_parser")

    # Intent → clarify loop OR content retriever
    graph.add_conditional_edges(
        "intent_parser",
        after_intent,
        {
            "clarify_goal": "clarify_goal",
            "content_retriever": "content_retriever",
        },
    )
    # Clarify ends for HITL (resume re-enters intent_parser via executor)
    graph.add_edge("clarify_goal", END)

    graph.add_edge("content_retriever", "plan_generator")
    graph.add_edge("plan_generator", "plan_updater")
    graph.add_edge("plan_updater", "persist_learning_state")
    # Persist interrupts for learning; feedback loop resumes at conditional_router
    graph.add_edge("persist_learning_state", END)

    graph.add_conditional_edges(
        "conditional_router",
        after_router,
        {
            "nudge_generator": "nudge_generator",
            "feedback": "feedback",
            "final_state": "final_state",
        },
    )
    graph.add_edge("nudge_generator", "state_analyzer")
    graph.add_edge("feedback", "state_analyzer")

    # Iterative loop → plan_generator OR final OR end
    graph.add_conditional_edges(
        "state_analyzer",
        after_analyzer,
        {
            "plan_generator": "plan_generator",
            "final_state": "final_state",
            "__end__": END,
        },
    )
    graph.add_edge("final_state", END)

    return graph.compile()


_compiled = None


def get_graph() -> Any:
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled
