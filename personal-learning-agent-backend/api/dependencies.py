"""FastAPI dependencies."""

from __future__ import annotations

from functools import lru_cache

from agents.main_agent import MainAgent
from agents.state_manager import StateManager, get_state_manager
from chatbot.tutor_bot import TutorBot, get_tutor_bot
from config import Settings, get_settings
from mcp.server import MCPServer, get_mcp_server
from workflow.executor import WorkflowExecutor, get_executor


@lru_cache
def get_main_agent() -> MainAgent:
    return MainAgent()


def settings_dep() -> Settings:
    return get_settings()


def agent_dep() -> MainAgent:
    return get_main_agent()


def state_manager_dep() -> StateManager:
    return get_state_manager()


def tutor_dep() -> TutorBot:
    return get_tutor_bot()


def executor_dep() -> WorkflowExecutor:
    return get_executor()


def mcp_dep() -> MCPServer:
    return get_mcp_server()
