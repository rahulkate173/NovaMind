"""MongoDB state repository tests (mocked – no live cluster required)."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from state.models import LearnerState


@pytest.fixture()
def learner() -> LearnerState:
    return LearnerState(
        user_id="user_mongo",
        current_goal="Learn backend",
        updated_at=datetime.now(timezone.utc),
    )


def test_mongo_save_upserts_by_user_id(learner: LearnerState):
    with patch("state.mongo_repository.MongoClient") as mock_client_cls:
        mock_collection = MagicMock()
        mock_client_cls.return_value.__getitem__.return_value.__getitem__.return_value = mock_collection

        from state.mongo_repository import MongoStateRepository

        repo = MongoStateRepository(
            uri="mongodb://localhost:27017/testdb",
            database="testdb",
            collection_name="ai-agent-backend",
        )
        repo.save(learner)

        mock_collection.update_one.assert_called_once()
        args, kwargs = mock_collection.update_one.call_args
        assert args[0] == {"user_id": "user_mongo"}
        assert kwargs["upsert"] is True
        assert args[1]["$set"]["user_id"] == "user_mongo"
        assert args[1]["$set"]["payload"]["user_id"] == "user_mongo"


def test_mongo_get_returns_learner_state(learner: LearnerState):
    with patch("state.mongo_repository.MongoClient") as mock_client_cls:
        mock_collection = MagicMock()
        mock_client_cls.return_value.__getitem__.return_value.__getitem__.return_value = mock_collection
        mock_collection.find_one.return_value = {
            "user_id": learner.user_id,
            "payload": learner.model_dump(mode="json"),
        }

        from state.mongo_repository import MongoStateRepository

        repo = MongoStateRepository(
            uri="mongodb://localhost:27017/testdb",
            database="testdb",
            collection_name="ai-agent-backend",
        )
        loaded = repo.get("user_mongo")

        assert loaded is not None
        assert loaded.user_id == "user_mongo"
        assert loaded.current_goal == "Learn backend"


def test_get_repository_uses_mongodb_when_configured(monkeypatch):
    monkeypatch.setenv("STATE_STORE", "mongodb")
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017/testdb")

    import config as cfg
    from state import repository as repo_mod

    cfg.get_settings.cache_clear()
    repo_mod.reset_repository()

    with patch("state.mongo_repository.MongoClient"):
        repo = repo_mod.get_repository()
        assert repo.__class__.__name__ == "MongoStateRepository"

    repo_mod.reset_repository()
    cfg.get_settings.cache_clear()
