"""MongoDB persistence for LearnerState – one document per user_id."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from config import get_settings
from state.models import LearnerState


class MongoStateRepository:
    """Store learner state in MongoDB – supports many users, keyed by user_id."""

    def __init__(
        self,
        uri: Optional[str] = None,
        database: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> None:
        settings = get_settings()
        self._uri = (uri or settings.mongodb_uri).strip()
        if not self._uri:
            raise ValueError("MONGODB_URI is required when STATE_STORE=mongodb")

        self._database_name = (database or settings.mongodb_database).strip() or _database_from_uri(
            self._uri
        )
        self._collection_name = (collection_name or settings.mongodb_collection).strip() or "ai-agent-backend"

        self._client = MongoClient(self._uri, serverSelectionTimeoutMS=5000)
        self._collection: Collection = self._client[self._database_name][self._collection_name]
        self._collection.create_index([("user_id", ASCENDING)], unique=True)

    def save(self, state: LearnerState) -> LearnerState:
        state.updated_at = datetime.now(timezone.utc)
        payload = state.model_dump(mode="json")
        doc = {
            "user_id": state.user_id,
            "payload": payload,
            "updated_at": state.updated_at,
        }
        self._collection.update_one({"user_id": state.user_id}, {"$set": doc}, upsert=True)
        return state

    def get(self, user_id: str) -> Optional[LearnerState]:
        row = self._collection.find_one({"user_id": user_id})
        if row is None:
            return None
        payload = row.get("payload")
        if payload is None:
            return None
        if isinstance(payload, str):
            return LearnerState.model_validate_json(payload)
        return LearnerState.model_validate(payload)

    def update_fields(self, user_id: str, **fields) -> Optional[LearnerState]:
        state = self.get(user_id)
        if state is None:
            return None
        data = state.model_dump()
        data.update(fields)
        updated = LearnerState.model_validate(data)
        return self.save(updated)

    def list_users(self) -> List[str]:
        return [str(doc["user_id"]) for doc in self._collection.find({}, {"user_id": 1})]

    def delete(self, user_id: str) -> bool:
        result = self._collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0

    def ping(self) -> bool:
        try:
            self._client.admin.command("ping")
            return True
        except PyMongoError:
            return False


def _database_from_uri(uri: str) -> str:
    parsed = urlparse(uri)
    name = (parsed.path or "").strip("/")
    return name or "personal-learning-agent"
