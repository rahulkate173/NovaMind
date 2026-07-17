"""Chat memory + real-time LearnerState injection."""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional

from agents.state_manager import get_state_manager
from state.models import LearnerState


class ChatMemory:
    def __init__(self) -> None:
        self._history: Dict[str, List[Dict[str, str]]] = defaultdict(list)
        self.state_manager = get_state_manager()

    def add(self, user_id: str, role: str, content: str) -> None:
        self._history[user_id].append({"role": role, "content": content})
        # keep last 40 turns
        self._history[user_id] = self._history[user_id][-40:]

    def history(self, user_id: str) -> List[Dict[str, str]]:
        return list(self._history.get(user_id, []))

    def clear(self, user_id: str) -> None:
        self._history.pop(user_id, None)

    def inject_state_context(self, user_id: str) -> str:
        state: Optional[LearnerState] = self.state_manager.load(user_id)
        if not state:
            return "No learner state yet. Help the user define a learning goal."
        weak = ", ".join(state.weak_areas) or "none"
        plan_theme = ""
        if state.plan and state.plan.weeks:
            week = next((w for w in state.plan.weeks if w.week == state.current_week), state.plan.weeks[0])
            plan_theme = week.theme
            remedial = [t.title for t in week.tasks if t.is_remedial]
            if remedial:
                plan_theme += f" | Remedial: {', '.join(remedial[:3])}"
        last_quiz = state.quiz_history[-1] if state.quiz_history else None
        quiz_line = (
            f"Last quiz: week {last_quiz.week} score {last_quiz.score}%"
            if last_quiz
            else "No quizzes yet"
        )
        return (
            f"LearnerState snapshot:\n"
            f"- user_id: {state.user_id}\n"
            f"- goal: {state.current_goal}\n"
            f"- current_week: {state.current_week}\n"
            f"- overall_progress: {state.overall_progress}%\n"
            f"- streak: {state.streak}\n"
            f"- weak_areas: {weak}\n"
            f"- next_milestone: {state.next_milestone}\n"
            f"- week_focus: {plan_theme}\n"
            f"- {quiz_line}\n"
        )


_memory: Optional[ChatMemory] = None


def get_chat_memory() -> ChatMemory:
    global _memory
    if _memory is None:
        _memory = ChatMemory()
    return _memory
