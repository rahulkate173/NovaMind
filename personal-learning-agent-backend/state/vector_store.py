"""Semantic memory via Chroma (with in-memory fallback)."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from config import get_settings


class VectorStore:
    def __init__(self, persist_dir: Optional[str] = None, collection: str = "learner_memory") -> None:
        settings = get_settings()
        self.persist_dir = persist_dir or settings.chroma_persist_dir
        self.collection_name = collection
        self._client = None
        self._collection = None
        self._fallback: Dict[str, List[Dict[str, Any]]] = {}
        self._init()

    def _init(self) -> None:
        try:
            import chromadb

            Path(self.persist_dir).mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(path=self.persist_dir)
            self._collection = self._client.get_or_create_collection(self.collection_name)
        except Exception:
            self._client = None
            self._collection = None

    def upsert_memory(self, user_id: str, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        meta = {"user_id": user_id, **(metadata or {})}
        if self._collection is not None:
            self._collection.upsert(
                ids=[f"{user_id}:{doc_id}"],
                documents=[text],
                metadatas=[meta],
            )
            return
        self._fallback.setdefault(user_id, [])
        self._fallback[user_id] = [
            m for m in self._fallback[user_id] if m["id"] != doc_id
        ]
        self._fallback[user_id].append({"id": doc_id, "text": text, "metadata": meta})

    def query(self, user_id: str, query: str, n_results: int = 5) -> List[str]:
        if self._collection is not None:
            try:
                result = self._collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    where={"user_id": user_id},
                )
                docs = result.get("documents") or [[]]
                return list(docs[0])
            except Exception:
                return []
        memories = self._fallback.get(user_id, [])
        # naive keyword overlap
        q = set(query.lower().split())
        scored = []
        for m in memories:
            overlap = len(q & set(m["text"].lower().split()))
            scored.append((overlap, m["text"]))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [t for _, t in scored[:n_results]]

    def remember_state_snapshot(self, user_id: str, snapshot_text: str) -> None:
        self.upsert_memory(
            user_id=user_id,
            doc_id=f"state_{user_id}",
            text=snapshot_text,
            metadata={"type": "learner_state"},
        )


_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
