"""Load topic descriptions & courses from local developer-roadmap content + graph nodes."""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from tools.roadmap import get_roadmaps_root


_RESOURCE_RE = re.compile(
    r"-\s*\[@(?:official|course|book|article|video|roadmap|feed)?@?([^\]]+)\]\(([^)]+)\)",
    re.I,
)
_RESOURCE_RE_ALT = re.compile(
    r"-\s*\[@(\w+)@([^\]]+)\]\(([^)]+)\)",
    re.I,
)


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _content_dir(roadmap_key: str) -> Optional[Path]:
    root = get_roadmaps_root() / roadmap_key / "content"
    return root if root.exists() else None


def _roadmap_json_path(roadmap_key: str) -> Optional[Path]:
    path = get_roadmaps_root() / roadmap_key / f"{roadmap_key}.json"
    return path if path.exists() else None


@lru_cache(maxsize=32)
def _load_roadmap_graph(roadmap_key: str) -> Dict[str, Any]:
    path = _roadmap_json_path(roadmap_key)
    if not path:
        return {"nodes": [], "edges": []}
    import json

    return json.loads(path.read_text(encoding="utf-8"))


def _parse_markdown_content(text: str) -> Dict[str, Any]:
    lines = text.strip().splitlines()
    title = ""
    body_lines: List[str] = []
    resources: List[Dict[str, str]] = []
    in_resources = False

    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            continue
        if "visit the following resources" in line.lower():
            in_resources = True
            continue
        if in_resources:
            m = _RESOURCE_RE_ALT.search(line)
            if m:
                resources.append(
                    {
                        "title": m.group(2).strip(),
                        "url": m.group(3).strip(),
                        "kind": m.group(1).lower(),
                    }
                )
                continue
            m2 = re.search(r"-\s*\[([^\]]+)\]\(([^)]+)\)", line)
            if m2:
                resources.append(
                    {
                        "title": m2.group(1).strip(),
                        "url": m2.group(2).strip(),
                        "kind": "link",
                    }
                )
                continue
        elif line.strip():
            body_lines.append(line.strip())

    description = " ".join(body_lines).strip()
    return {"title": title, "description": description, "resources": resources}


def _find_content_file(roadmap_key: str, topic_label: str, node_id: Optional[str] = None) -> Optional[Path]:
    content = _content_dir(roadmap_key)
    if not content:
        return None
    slug = _slugify(topic_label)
    # Prefer exact node-id match: mathematics@aStaDENn5PhEa-cFvNzXa.md
    if node_id:
        for path in content.glob(f"*@{node_id}.md"):
            return path
    # Slug prefix match
    candidates = list(content.glob(f"{slug}@*.md")) + list(content.glob(f"{slug}.md"))
    if candidates:
        return candidates[0]
    # Fuzzy: filename starts with first word
    first = slug.split("-")[0]
    fuzzy = sorted(content.glob(f"{first}*.md"))
    return fuzzy[0] if fuzzy else None


def _find_topic_node(roadmap_key: str, topic_label: str) -> Optional[Dict[str, Any]]:
    graph = _load_roadmap_graph(roadmap_key)
    target = topic_label.strip().lower()
    best = None
    for n in graph.get("nodes") or []:
        if n.get("type") not in {"topic", "subtopic"}:
            continue
        label = str((n.get("data") or {}).get("label") or "").strip()
        if not label:
            continue
        if label.lower() == target:
            return n
        if target in label.lower() or label.lower() in target:
            best = best or n
    return best


def _nearby_graph_extras(
    roadmap_key: str, topic_node: Dict[str, Any], radius: float = 200.0
) -> Tuple[List[str], List[Dict[str, str]]]:
    """Pull nearby todo labels (sub-skills) and resourceButton courses from the graph."""
    graph = _load_roadmap_graph(roadmap_key)
    pos = topic_node.get("position") or {}
    ty, tx = float(pos.get("y") or 0), float(pos.get("x") or 0)
    sub_skills: List[str] = []
    resources: List[Dict[str, str]] = []

    for n in graph.get("nodes") or []:
        ntype = n.get("type")
        if ntype not in {"todo", "resourceButton", "button"}:
            continue
        p = n.get("position") or {}
        ny, nx = float(p.get("y") or 0), float(p.get("x") or 0)
        dist = abs(ny - ty) + abs(nx - tx) * 0.35
        if dist > radius:
            continue
        data = n.get("data") or {}
        label = str(data.get("label") or "").strip()
        href = str(data.get("href") or "").strip()
        if ntype == "todo" and label:
            # todos often comma-separated skill lists
            parts = [p.strip() for p in re.split(r"[,;/]", label) if p.strip()]
            for part in parts:
                if part not in sub_skills:
                    sub_skills.append(part)
        elif href and label:
            resources.append({"title": label, "url": href, "kind": "course"})

    return sub_skills, resources


def load_topic_bundle(roadmap_key: str, topic_label: str) -> Dict[str, Any]:
    """
    Bundle for a roadmap topic:
    description + sub_skills + resources from content/*.md and nearby graph nodes.
    """
    node = _find_topic_node(roadmap_key, topic_label)
    node_id = str(node.get("id")) if node else None
    md_path = _find_content_file(roadmap_key, topic_label, node_id=node_id)

    description = ""
    resources: List[Dict[str, str]] = []
    title = topic_label

    if md_path and md_path.exists():
        parsed = _parse_markdown_content(md_path.read_text(encoding="utf-8"))
        description = parsed.get("description") or ""
        resources.extend(parsed.get("resources") or [])
        title = parsed.get("title") or topic_label

    sub_skills: List[str] = []
    if node:
        nearby_skills, nearby_res = _nearby_graph_extras(roadmap_key, node)
        for s in nearby_skills:
            if s not in sub_skills:
                sub_skills.append(s)
        # Prefer graph courses first
        resources = nearby_res + resources

    # Deduplicate resources by url/title
    seen = set()
    unique_resources: List[Dict[str, str]] = []
    for r in resources:
        key = (r.get("url") or "") + "|" + (r.get("title") or "")
        if key in seen:
            continue
        seen.add(key)
        unique_resources.append(r)

    return {
        "topic": topic_label,
        "title": title,
        "description": description,
        "sub_skills": sub_skills,
        "resources": unique_resources,
        "roadmap_url": f"https://roadmap.sh/{roadmap_key}",
        "has_official_content": bool(description or unique_resources),
    }
