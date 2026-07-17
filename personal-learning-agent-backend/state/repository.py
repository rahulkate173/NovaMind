"""SQLite persistence for LearnerState."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from sqlalchemy import Column, DateTime, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import get_settings
from state.models import LearnerState


class Base(DeclarativeBase):
    pass


class LearnerStateRow(Base):
    __tablename__ = "learner_states"

    user_id = Column(String(128), primary_key=True)
    payload = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class StateRepository:
    def __init__(self, database_url: Optional[str] = None) -> None:
        settings = get_settings()
        url = database_url or settings.database_url
        # Sync engine for simplicity in MVP (async FastAPI still fine with sync repo in thread)
        if url.startswith("sqlite+aiosqlite"):
            url = url.replace("sqlite+aiosqlite", "sqlite", 1)
        if url.startswith("sqlite:///./"):
            Path("data").mkdir(parents=True, exist_ok=True)
        self._engine = create_engine(url, future=True)
        Base.metadata.create_all(self._engine)
        self._Session = sessionmaker(bind=self._engine, expire_on_commit=False)

    def save(self, state: LearnerState) -> LearnerState:
        state.updated_at = datetime.now(timezone.utc)
        payload = state.model_dump_json()
        with self._Session() as session:
            row = session.get(LearnerStateRow, state.user_id)
            if row is None:
                row = LearnerStateRow(user_id=state.user_id, payload=payload)
                session.add(row)
            else:
                row.payload = payload
                row.updated_at = state.updated_at
            session.commit()
        return state

    def get(self, user_id: str) -> Optional[LearnerState]:
        with self._Session() as session:
            row = session.get(LearnerStateRow, user_id)
            if row is None:
                return None
            return LearnerState.model_validate_json(row.payload)

    def update_fields(self, user_id: str, **fields) -> Optional[LearnerState]:
        state = self.get(user_id)
        if state is None:
            return None
        data = state.model_dump()
        data.update(fields)
        updated = LearnerState.model_validate(data)
        return self.save(updated)

    def list_users(self) -> List[str]:
        with self._Session() as session:
            rows = session.scalars(select(LearnerStateRow.user_id)).all()
            return list(rows)

    def delete(self, user_id: str) -> bool:
        with self._Session() as session:
            row = session.get(LearnerStateRow, user_id)
            if row is None:
                return False
            session.delete(row)
            session.commit()
            return True


_repo: Optional[StateRepository] = None


def get_repository() -> StateRepository:
    global _repo
    if _repo is None:
        _repo = StateRepository()
    return _repo
