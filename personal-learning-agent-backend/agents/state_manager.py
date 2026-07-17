"""State manager – read/write learner state + vector memory."""

from __future__ import annotations

from typing import Optional

from state.models import LearnerState
from state.repository import StateRepository, get_repository
from state.vector_store import VectorStore, get_vector_store


class StateManager:
    def __init__(
        self,
        repository: Optional[StateRepository] = None,
        vector_store: Optional[VectorStore] = None,
    ) -> None:
        self.repo = repository or get_repository()
        self.vectors = vector_store or get_vector_store()

    def load(self, user_id: str) -> Optional[LearnerState]:
        return self.repo.get(user_id)

    def save(self, state: LearnerState) -> LearnerState:
        saved = self.repo.save(state)
        snapshot = (
            f"User {saved.user_id} goal={saved.current_goal} week={saved.current_week} "
            f"progress={saved.overall_progress} weak={saved.weak_areas} "
            f"milestone={saved.next_milestone}"
        )
        self.vectors.remember_state_snapshot(saved.user_id, snapshot)
        return saved

    def remember(self, user_id: str, doc_id: str, text: str) -> None:
        self.vectors.upsert_memory(user_id, doc_id, text)

    def recall(self, user_id: str, query: str, n: int = 5) -> list[str]:
        return self.vectors.query(user_id, query, n_results=n)


def get_state_manager() -> StateManager:
    return StateManager()
