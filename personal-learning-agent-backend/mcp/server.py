"""Lightweight MCP-style tool server facade (HTTP-callable via FastAPI mount)."""

from __future__ import annotations

from typing import Any, Dict

from agents.main_agent import MainAgent
from chatbot.tutor_bot import get_tutor_bot
from mcp.tools_definition import TOOLS_DEFINITION


class MCPServer:
    def __init__(self) -> None:
        self.agent = MainAgent()
        self.tools = {t["name"]: t for t in TOOLS_DEFINITION}

    def list_tools(self) -> Dict[str, Any]:
        return {"tools": TOOLS_DEFINITION}

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if name not in self.tools:
            return {"error": f"Unknown tool: {name}"}
        if name == "start_learning_workflow":
            return self.agent.start(**arguments)
        if name == "submit_quiz_feedback":
            return self.agent.submit_quiz(arguments)
        if name == "get_learner_state":
            state = self.agent.get_state(arguments["user_id"])
            return state.model_dump(mode="json") if state else {"error": "not found"}
        if name == "tutor_chat":
            return get_tutor_bot().chat(arguments["user_id"], arguments["message"])
        return {"error": "not implemented"}


_server: MCPServer | None = None


def get_mcp_server() -> MCPServer:
    global _server
    if _server is None:
        _server = MCPServer()
    return _server
