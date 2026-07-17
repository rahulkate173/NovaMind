"""Enrich roadmap topics into rich task descriptions using roadmap content + LLM."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from state.models import ResourceLink
from tools.topic_content import load_topic_bundle
from utils.helpers import new_id
from utils.llm import get_llm
from utils.prompts import TASK_ENRICH_SYSTEM


def _to_resource_links(items: List[Dict[str, Any]]) -> List[ResourceLink]:
    out: List[ResourceLink] = []
    for item in items:
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        out.append(
            ResourceLink(
                title=title,
                url=str(item.get("url") or ""),
                kind=str(item.get("kind") or "link"),
            )
        )
    return out


def enrich_topic_task(
    goal: str,
    topic: str,
    roadmap_key: Optional[str] = None,
    phase_title: str = "",
) -> Dict[str, Any]:
    """
    Build rich task fields for a subgoal:
    - official roadmap.sh description/resources when available
    - LLM polish for description + sub_skills (prompt only uses goal + subgoal + roadmap snippet)
    """
    bundle = (
        load_topic_bundle(roadmap_key, topic)
        if roadmap_key
        else {
            "description": "",
            "sub_skills": [],
            "resources": [],
            "roadmap_url": "",
            "has_official_content": False,
        }
    )

    base_description = bundle.get("description") or ""
    base_skills = list(bundle.get("sub_skills") or [])
    base_resources = _to_resource_links(list(bundle.get("resources") or []))
    roadmap_url = bundle.get("roadmap_url") or (
        f"https://roadmap.sh/{roadmap_key}" if roadmap_key else ""
    )
    if roadmap_url and not any(r.url == roadmap_url for r in base_resources):
        base_resources.append(
            ResourceLink(
                title=f"roadmap.sh – {topic}",
                url=roadmap_url,
                kind="roadmap",
            )
        )

    llm = get_llm()
    user = (
        f"Main goal: {goal}\n"
        f"Subgoal / topic: {topic}\n"
        f"Phase: {phase_title or 'N/A'}\n"
        f"Roadmap excerpt: {base_description or 'N/A'}\n"
        f"Known sub-skills from roadmap: {', '.join(base_skills) if base_skills else 'N/A'}\n"
        f"Known resources: {[r.model_dump() for r in base_resources[:6]]}\n"
        "Return JSON with keys: title, description, sub_skills (list), "
        "resources (list of {title,url,kind}). Keep/extend known resources; do not invent fake URLs."
    )

    if llm.is_mock:
        enriched = _mock_enrich(goal, topic, base_description, base_skills, base_resources)
    else:
        data = llm.chat_json(TASK_ENRICH_SYSTEM, user)
        enriched = {
            "title": str(data.get("title") or f"Master {topic} for {goal}"),
            "description": str(data.get("description") or base_description or f"Learn {topic} as part of {goal}."),
            "sub_skills": list(data.get("sub_skills") or base_skills),
            "resources": _merge_resources(base_resources, data.get("resources") or []),
        }
        if not enriched["sub_skills"]:
            enriched["sub_skills"] = base_skills or [topic]

    if not enriched.get("resources"):
        import urllib.parse
        query = urllib.parse.quote_plus(topic)
        enriched["resources"] = [
            ResourceLink(
                title=f"Search tutorials: {topic}",
                url=f"https://www.youtube.com/results?search_query={query}",
                kind="video"
            )
        ]

    return {
        "id": new_id("task"),
        "title": enriched["title"],
        "description": enriched["description"],
        "sub_skills": enriched["sub_skills"],
        "resources": enriched["resources"],
        "topic": topic,
    }


def _merge_resources(
    base: List[ResourceLink], extra: List[Any]
) -> List[ResourceLink]:
    out = list(base)
    seen = {(r.title.lower(), r.url) for r in out}
    for item in extra:
        if isinstance(item, ResourceLink):
            key = (item.title.lower(), item.url)
            if key not in seen:
                out.append(item)
                seen.add(key)
            continue
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        url = str(item.get("url") or "").strip()
        if not title:
            continue
        # Skip invented URLs that look fake when we already have official ones
        if url and ("example.com" in url or url == "#"):
            url = ""
        key = (title.lower(), url)
        if key in seen:
            continue
        out.append(ResourceLink(title=title, url=url, kind=str(item.get("kind") or "link")))
        seen.add(key)
    return out


def _mock_enrich(
    goal: str,
    topic: str,
    base_description: str,
    base_skills: List[str],
    base_resources: List[ResourceLink],
) -> Dict[str, Any]:
    short_topic = topic if len(topic) <= 45 else topic.split('?')[0].split('.')[0][:45].strip()
    skills = base_skills or _default_sub_skills(short_topic)
    if base_description:
        description = (
            f"{base_description} "
            f"For your goal \"{goal}\", focus on applying these ideas through the listed sub-skills and resources."
        )
    else:
        skill_txt = ", ".join(skills[:3])
        description = (
            f"Build fluency in: {skill_txt}. "
            f"Use the recommended resources and complete a short practice exercise before the quiz."
        )
    return {
        "title": f"Learn {short_topic}" if len(short_topic) > 30 else f"Learn {short_topic}: build foundations for {goal}",
        "description": description.strip(),
        "sub_skills": skills,
        "resources": base_resources,
    }


def _default_sub_skills(topic: str) -> List[str]:
    t = topic.lower()
    if "math" in t:
        return ["Linear Algebra", "Calculus", "Probability & Statistics"]
    if "stat" in t:
        return ["Descriptive statistics", "Inferential statistics", "Hypothesis testing"]
    if "python" in t or "coding" in t:
        return ["Syntax & data structures", "Libraries", "Small scripts / notebooks"]
    if "machine learning" in t:
        return ["Supervised learning", "Model evaluation", "Feature engineering"]
    short_t = topic if len(topic) <= 35 else topic[:35].strip() + "..."
    return [f"Core concepts of {short_t}", f"Hands-on practice with {short_t}", f"Apply {short_t} to a mini project"]
