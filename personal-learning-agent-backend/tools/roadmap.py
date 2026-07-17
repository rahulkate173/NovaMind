"""Roadmap tool – loads real nilbuild/developer-roadmap JSON from local clone."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx

from config import get_settings

# Fallback only if local repo / remote fetch unavailable
BUILTIN_ROADMAPS: Dict[str, Dict[str, Any]] = {
    "backend": {
        "title": "Backend Developer Roadmap",
        "key": "backend",
        "source": "builtin",
        "steps": [
            {"phase": 1, "title": "Internet & Version Control", "topics": ["Internet", "Git", "GitHub"]},
            {"phase": 2, "title": "Pick a Language", "topics": ["Python", "JavaScript", "Go"]},
            {"phase": 3, "title": "Databases", "topics": ["PostgreSQL", "SQL", "Redis"]},
            {"phase": 4, "title": "APIs & Auth", "topics": ["REST", "Authentication", "JWT"]},
            {"phase": 5, "title": "Deploy", "topics": ["Docker", "CI/CD", "Linux"]},
        ],
    },
}

# Alias map: user phrases / domains -> roadmap.sh folder key
ROADMAP_ALIASES: Dict[str, str] = {
    "mlops": "mlops",
    "ml ops": "mlops",
    "machine learning ops": "mlops",
    "machine learning operations": "mlops",
    "backend": "backend",
    "back-end": "backend",
    "back end": "backend",
    "frontend": "frontend",
    "front-end": "frontend",
    "front end": "frontend",
    "devops": "devops",
    "full stack": "full-stack",
    "fullstack": "full-stack",
    "full-stack": "full-stack",
    "data scientist": "ai-data-scientist",
    "data science": "ai-data-scientist",
    "ai data scientist": "ai-data-scientist",
    "ai and data scientist": "ai-data-scientist",
    "machine learning": "machine-learning",
    "ml": "machine-learning",
    "ai engineer": "ai-engineer",
    "data engineer": "data-engineer",
    "data analyst": "data-analyst",
    "react": "react",
    "python": "python",
    "aws": "aws",
    "docker": "docker",
    "kubernetes": "kubernetes",
    "k8s": "kubernetes",
    "nodejs": "nodejs",
    "node.js": "nodejs",
    "sql": "sql",
    "cyber security": "cyber-security",
    "cybersecurity": "cyber-security",
    "android": "android",
    "ios": "ios",
    "golang": "golang",
    "go lang": "golang",
    "java": "java",
    "javascript": "javascript",
    "typescript": "typescript",
    "prompt engineering": "prompt-engineering",
    "system design": "system-design",
    "software architect": "software-architect",
}


def _default_repo_path() -> Path:
    # personal-learning-agent-backend/data/developer-roadmap
    return Path(__file__).resolve().parents[1] / "data" / "developer-roadmap"


def get_roadmaps_root() -> Path:
    settings = get_settings()
    configured = getattr(settings, "roadmap_repo_path", "") or ""
    root = Path(configured) if configured else _default_repo_path()
    candidate = root / "src" / "data" / "roadmaps"
    return candidate if candidate.exists() else root


@lru_cache(maxsize=1)
def list_available_roadmap_keys() -> Tuple[str, ...]:
    root = get_roadmaps_root()
    if not root.exists():
        return tuple(BUILTIN_ROADMAPS.keys())
    keys = sorted(
        p.name
        for p in root.iterdir()
        if p.is_dir() and (p / f"{p.name}.json").exists()
    )
    return tuple(keys) if keys else tuple(BUILTIN_ROADMAPS.keys())


def _roadmap_json_path(key: str) -> Optional[Path]:
    root = get_roadmaps_root()
    path = root / key / f"{key}.json"
    return path if path.exists() else None


def _parse_roadmap_nodes(data: Dict[str, Any], key: str) -> Dict[str, Any]:
    """Convert roadmap.sh nodes/edges JSON into ordered learning phases."""
    nodes = data.get("nodes") or []
    edges = data.get("edges") or []

    title = key.replace("-", " ").title()
    by_id: Dict[str, Dict[str, Any]] = {}
    for n in nodes:
        by_id[str(n.get("id"))] = n
        if n.get("type") == "title":
            label = (n.get("data") or {}).get("label")
            if label:
                title = str(label)

    def _label(node: Dict[str, Any]) -> str:
        return str((node.get("data") or {}).get("label") or "").strip()

    def _pos(node: Dict[str, Any]) -> Tuple[float, float]:
        pos = node.get("position") or {}
        return float(pos.get("y") or 0), float(pos.get("x") or 0)

    children: Dict[str, List[str]] = {}
    for e in edges:
        src, tgt = e.get("source"), e.get("target")
        if not src or not tgt:
            continue
        children.setdefault(str(src), []).append(str(tgt))

    topic_nodes = [n for n in nodes if n.get("type") == "topic" and _label(n)]
    topic_nodes.sort(key=_pos)

    # Phase map: topic_id -> topics list (edge-connected subtopics first)
    phase_topics: Dict[str, List[str]] = {}
    claimed: set[str] = set()
    for topic_node in topic_nodes:
        tid = str(topic_node.get("id"))
        subs: List[str] = []
        for child_id in children.get(tid, []):
            child = by_id.get(child_id)
            if not child or child.get("type") != "subtopic":
                continue
            child_label = _label(child)
            if child_label and child_label not in claimed:
                subs.append(child_label)
                claimed.add(child_label)
        phase_topics[tid] = subs

    # Assign orphan subtopics to nearest phase centroid (edges + topic position)
    def _centroid(topic_node: Dict[str, Any], subs: List[str]) -> Tuple[float, float]:
        ty, tx = _pos(topic_node)
        if not subs:
            return ty, tx
        ys, xs = [ty], [tx]
        for n in nodes:
            if n.get("type") == "subtopic" and _label(n) in subs:
                ny, nx = _pos(n)
                ys.append(ny)
                xs.append(nx)
        return sum(ys) / len(ys), sum(xs) / len(xs)

    centroids = {
        str(t.get("id")): _centroid(t, phase_topics[str(t.get("id"))])
        for t in topic_nodes
    }

    orphan_nodes = [
        n
        for n in nodes
        if n.get("type") == "subtopic" and _label(n) and _label(n) not in claimed
    ]
    for orphan in orphan_nodes:
        lab = _label(orphan)
        oy, ox = _pos(orphan)

        def dist(tid: str) -> float:
            cy, cx = centroids[tid]
            # Prefer same vertical band (roadmap sections flow top→bottom)
            return abs(cy - oy) * 2.5 + abs(cx - ox) * 0.35

        best_tid = min(centroids.keys(), key=dist)
        phase_topics[best_tid].append(lab)
        claimed.add(lab)
        # refresh centroid lightly
        topic_node = by_id[best_tid]
        centroids[best_tid] = _centroid(topic_node, phase_topics[best_tid])

    steps: List[Dict[str, Any]] = []
    for phase_idx, topic_node in enumerate(topic_nodes, start=1):
        tid = str(topic_node.get("id"))
        topic_label = _label(topic_node)
        topics = phase_topics.get(tid) or [topic_label]
        steps.append({"phase": phase_idx, "title": topic_label, "topics": topics})

    ordered_topics: List[str] = []
    for step in steps:
        for t in step["topics"]:
            if t not in ordered_topics:
                ordered_topics.append(t)

    return {
        "title": f"{title} Roadmap" if "roadmap" not in title.lower() else title,
        "key": key,
        "source": "roadmap.sh",
        "url": f"https://roadmap.sh/{key}",
        "steps": steps,
        "ordered_topics": ordered_topics,
        "topic_count": len(ordered_topics),
        "phase_count": len(steps),
    }


def load_local_roadmap(key: str) -> Optional[Dict[str, Any]]:
    path = _roadmap_json_path(key)
    if path is None:
        return None
    with path.open(encoding="utf-8") as f:
        raw = json.load(f)
    return _parse_roadmap_nodes(raw, key)


def download_roadmap_json(key: str) -> Optional[Dict[str, Any]]:
    """Fetch a single roadmap JSON from GitHub raw if local clone missing that key."""
    url = (
        "https://raw.githubusercontent.com/nilbuild/developer-roadmap/"
        f"master/src/data/roadmaps/{key}/{key}.json"
    )
    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                return None
            raw = resp.json()
        # Cache locally for next time
        root = get_roadmaps_root()
        if root.name != "roadmaps":
            root = _default_repo_path() / "src" / "data" / "roadmaps"
        dest_dir = root / key
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{key}.json"
        dest.write_text(json.dumps(raw), encoding="utf-8")
        return _parse_roadmap_nodes(raw, key)
    except Exception:
        return None


def fetch_roadmap(roadmap_key: str) -> Dict[str, Any]:
    """Load roadmap: local clone → optional HTTP service → GitHub raw → builtin."""
    settings = get_settings()
    key = (roadmap_key or "").lower().strip()
    if not key:
        key = "backend"

    local = load_local_roadmap(key)
    if local:
        return local

    # Optional dedicated roadmap microservice
    url = f"{settings.roadmap_service_url.rstrip('/')}/api/roadmap/{key}"
    try:
        with httpx.Client(timeout=2.0) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                data.setdefault("key", key)
                data.setdefault("source", "roadmap-service")
                return data
    except Exception:
        pass

    remote = download_roadmap_json(key)
    if remote:
        return remote

    if key in BUILTIN_ROADMAPS:
        return BUILTIN_ROADMAPS[key]
    return BUILTIN_ROADMAPS["backend"]


def resolve_roadmap_key(domain: str, goal: str) -> Optional[str]:
    """Map goal/domain text to a roadmap.sh key using aliases + available folders."""
    blob = f"{domain} {goal}".lower().strip()
    blob = re.sub(r"[^a-z0-9\s\-/]+", " ", blob)
    blob = re.sub(r"\s+", " ", blob).strip()

    available = set(list_available_roadmap_keys())

    # Exact alias hits (longest first)
    for alias in sorted(ROADMAP_ALIASES.keys(), key=len, reverse=True):
        if alias in blob:
            key = ROADMAP_ALIASES[alias]
            if key in available or key in BUILTIN_ROADMAPS:
                return key

    # Direct folder-name match (e.g. "mlops", "full-stack")
    for key in sorted(available, key=len, reverse=True):
        needle = key.replace("-", " ")
        if key in blob.replace(" ", "-") or needle in blob:
            return key

    # Heuristics
    if any(w in blob for w in ("mlops", "ml ops", "model serving", "feature store")):
        return "mlops" if "mlops" in available else "machine-learning"
    if any(w in blob for w in ("api", "fastapi", "django", "express", "server", "backend")):
        return "backend"
    if any(w in blob for w in ("react", "vue", "angular", "frontend", "css", "html")):
        return "frontend"
    if any(w in blob for w in ("docker", "kubernetes", "ci/cd", "devops")):
        return "devops"
    if any(w in blob for w in ("machine learning", " deep learning", "ml ")):
        return "machine-learning" if "machine-learning" in available else None
    return None


def roadmap_matched(data: Dict[str, Any]) -> bool:
    return bool(data.get("steps")) and data.get("source") in {
        "roadmap.sh",
        "roadmap-service",
        "builtin",
    }
