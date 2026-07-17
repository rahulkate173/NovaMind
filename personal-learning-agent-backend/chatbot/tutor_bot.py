"""24/7 AI Tutor chatbot – state-aware responses."""

from __future__ import annotations

from typing import Any, Dict, Optional

from chatbot.memory import ChatMemory, get_chat_memory
from chatbot.tools import CHAT_TOOLS
from utils.llm import get_llm
from utils.prompts import TUTOR_SYSTEM


class TutorBot:
    def __init__(self, memory: Optional[ChatMemory] = None) -> None:
        self.memory = memory or get_chat_memory()
        self.llm = get_llm()

    def chat(self, user_id: str, message: str) -> Dict[str, Any]:
        # Optional light tool routing
        tool_used = None
        tool_result = None
        lower = message.lower()
        if "quiz me" in lower or "practice quiz" in lower:
            tool_used = "quiz"
            tool_result = CHAT_TOOLS["quiz"](user_id)
        elif lower.startswith("search:") or "search for" in lower:
            tool_used = "search"
            query = message.split(":", 1)[-1].strip()
            tool_result = CHAT_TOOLS["search"](query)
        elif "my progress" in lower or "how am i doing" in lower:
            tool_used = "progress"
            tool_result = CHAT_TOOLS["progress"](user_id)

        state_ctx = self.memory.inject_state_context(user_id)
        history = self.memory.history(user_id)
        history_txt = "\n".join(f"{h['role']}: {h['content']}" for h in history[-6:])
        tool_txt = f"\nTool ({tool_used}) result: {tool_result}" if tool_used else ""

        reply = self.llm.chat(
            TUTOR_SYSTEM,
            f"{state_ctx}\nRecent chat:\n{history_txt}\n{tool_txt}\nUser: {message}",
        )

        self.memory.add(user_id, "user", message)
        self.memory.add(user_id, "assistant", reply)
        return {
            "user_id": user_id,
            "reply": reply,
            "tool_used": tool_used,
            "tool_result": tool_result,
            "state_injected": True,
        }

    def history(self, user_id: str) -> Dict[str, Any]:
        return {"user_id": user_id, "messages": self.memory.history(user_id)}


_bot: Optional[TutorBot] = None


def get_tutor_bot() -> TutorBot:
    global _bot
    if _bot is None:
        _bot = TutorBot()
    return _bot
