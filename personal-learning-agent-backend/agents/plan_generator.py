"""Plan generator – roadmap phases + enriched descriptions, resources, and quizzes."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from agents.task_enricher import enrich_topic_task
from state.models import (
    ContentSource,
    LearningPlan,
    ResourceLink,
    Task,
    TaskStatus,
    WeeklyPlan,
)
from tools.quiz_generator import generate_quiz, generate_task_quiz
from utils.helpers import new_id
from utils.llm import get_llm
from utils.prompts import PLAN_GENERATOR_SYSTEM

# Fallback titles when enrichment is unavailable
_TASK_TEMPLATES: Dict[str, List[str]] = {
    "linux": ["Learn essential Linux commands and file system navigation"],
    "bash": ["Write Bash scripts for environment setup and tooling"],
    "git": ["Master Git branching, commits, rebase, and conflict resolution"],
    "github": ["Set up GitHub repos, Issues, and PR review habits"],
    "docker": ["Build and run Docker images; write a production-ready Dockerfile"],
    "kubernetes": ["Deploy a sample app on Kubernetes (Pods, Services, Deployments)"],
    "python": ["Strengthen Python fundamentals for data/ML workflows"],
    "math": ["Build mathematical foundations for modeling and algorithms"],
    "statistics": ["Learn statistics for inference and experimentation"],
}


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def _task_titles_for_topic(topic: str) -> List[str]:
    key = _normalize(topic)
    for needle, templates in _TASK_TEMPLATES.items():
        if needle in key:
            return list(templates)
    return [f"Learn {topic} fundamentals with hands-on exercises"]


def _hours_split(total: float, n: int) -> List[float]:
    if n <= 0:
        return []
    base = round(total / n, 1)
    parts = [base] * n
    drift = round(total - sum(parts), 1)
    parts[-1] = round(parts[-1] + drift, 1)
    return parts


def _phases_from_roadmap(roadmap: Dict[str, Any]) -> List[Dict[str, Any]]:
    steps = roadmap.get("steps") or []
    phases: List[Dict[str, Any]] = []
    for step in steps:
        title = str(step.get("title") or "Focus area").strip()
        topics = [str(t).strip() for t in (step.get("topics") or []) if str(t).strip()]
        if not topics:
            topics = [title]
        phases.append({"title": title, "topics": topics})
    return phases


def _allocate_phases_to_weeks(
    phases: List[Dict[str, Any]],
    total_weeks: int,
) -> List[Tuple[str, List[str]]]:
    """Sequential progression: early phases first, no round-robin repetition."""
    if total_weeks <= 0:
        total_weeks = 1
    if not phases:
        return [("General foundations", ["Fundamentals"]) for _ in range(total_weeks)]

    week_slots: List[Tuple[str, List[str]]] = []

    if len(phases) >= total_weeks:
        for w in range(total_weeks):
            start = int(w * len(phases) / total_weeks)
            end = int((w + 1) * len(phases) / total_weeks)
            chunk = phases[start:end] or [phases[min(start, len(phases) - 1)]]
            topics: List[str] = []
            for p in chunk:
                for t in p["topics"]:
                    if t not in topics:
                        topics.append(t)
            topics = topics[:5] or [chunk[0]["title"]]
            theme = " & ".join(p["title"] for p in chunk[:2])
            if len(chunk) > 2:
                theme = f"{chunk[0]['title']} → {chunk[-1]['title']}"
            week_slots.append((theme, topics))
        return week_slots

    weeks_per_phase = [1] * len(phases)
    remaining = total_weeks - len(phases)
    capacity = [max(0, len(p["topics"]) - 1) for p in phases]
    idx = 0
    while remaining > 0 and any(c > 0 for c in capacity):
        if capacity[idx % len(phases)] > 0:
            weeks_per_phase[idx % len(phases)] += 1
            capacity[idx % len(phases)] -= 1
            remaining -= 1
        idx += 1
        if idx > len(phases) * 20:
            break
    if remaining > 0:
        weeks_per_phase[-1] += remaining

    for phase, n_weeks in zip(phases, weeks_per_phase):
        topics = phase["topics"]
        if n_weeks == 1:
            week_slots.append((phase["title"], topics[:5]))
            continue
        for i in range(n_weeks):
            start = int(i * len(topics) / n_weeks)
            end = int((i + 1) * len(topics) / n_weeks)
            slice_topics = topics[start:end]
            if not slice_topics:
                slice_topics = [topics[min(i, len(topics) - 1)]]
            focus = ", ".join(slice_topics[:2])
            theme = f"{phase['title']}: {focus}" if focus else phase["title"]
            week_slots.append((theme, slice_topics[:5]))

    while len(week_slots) < total_weeks:
        last_theme, last_topics = week_slots[-1]
        week_slots.append((f"{last_theme} – deep practice", last_topics[:3]))
    return week_slots[:total_weeks]


def _as_resource_links(resources: Any) -> List[ResourceLink]:
    out: List[ResourceLink] = []
    for r in resources or []:
        if isinstance(r, ResourceLink):
            out.append(r)
        elif isinstance(r, dict):
            title = str(r.get("title") or "").strip()
            if title:
                out.append(
                    ResourceLink(
                        title=title,
                        url=str(r.get("url") or ""),
                        kind=str(r.get("kind") or "link"),
                    )
                )
        elif isinstance(r, str) and r.strip():
            out.append(ResourceLink(title=r.strip(), url="", kind="link"))
    return out


def _build_week(
    week: int,
    theme: str,
    topics: List[str],
    hours_per_week: float,
    goal: str,
    roadmap_key: Optional[str] = None,
    enrich_cache: Optional[Dict[str, Dict[str, Any]]] = None,
) -> WeeklyPlan:
    """One week: enriched subtasks (description/resources) + per-subtask quiz."""
    enrich_cache = enrich_cache if enrich_cache is not None else {}
    project = week % 3 == 0
    project_hours = max(3.0, hours_per_week * 0.2) if project else 0.0
    quiz_budget = min(3.0, max(1.0, 0.75 * max(len(topics), 1)))
    study_budget = max(2.0, hours_per_week - quiz_budget - project_hours)

    unique_topics = list(dict.fromkeys(topics))[:5]
    hour_parts = _hours_split(study_budget, max(len(unique_topics), 1))

    tasks: List[Task] = []
    quiz_ids: List[str] = []

    for i, (topic, hrs) in enumerate(zip(unique_topics, hour_parts)):
        cache_key = f"{roadmap_key or 'none'}::{topic.lower()}"
        if cache_key not in enrich_cache:
            enrich_cache[cache_key] = enrich_topic_task(
                goal=goal,
                topic=topic,
                roadmap_key=roadmap_key,
                phase_title=theme,
            )
        enriched = enrich_cache[cache_key]
        description = str(enriched.get("description") or "")
        sub_skills = list(enriched.get("sub_skills") or [])
        resources = _as_resource_links(enriched.get("resources"))

        task_quiz = generate_task_quiz(
            goal=goal,
            topic=topic,
            description=description,
            sub_skills=sub_skills,
            num_questions=3,
        )
        quiz_ids.append(task_quiz.quiz_id)

        tasks.append(
            Task(
                id=str(enriched.get("id") or new_id("task")),
                title=str(enriched.get("title") or f"Learn {topic}"),
                week=week,
                day=(i % 5) + 1,
                estimated_hours=max(1.0, hrs),
                topics=[topic],
                description=description,
                sub_skills=sub_skills,
                resources=resources,
                quiz=task_quiz,
            )
        )

    wrap = generate_quiz(
        topics=unique_topics,
        week=week,
        num_questions=min(5, max(3, len(unique_topics))),
        goal=goal,
        description=theme,
        sub_skills=unique_topics,
    )
    wrap_quiz = generate_task_quiz(
        goal=goal,
        topic=theme,
        description=f"Weekly checkpoint covering {', '.join(unique_topics)}",
        sub_skills=unique_topics,
        num_questions=min(5, max(3, len(unique_topics))),
    )
    tasks.append(
        Task(
            id=wrap["quiz_id"],
            title=f"Week {week} Checkpoint Quiz",
            week=week,
            estimated_hours=max(0.5, quiz_budget / 2),
            topics=unique_topics,
            description=(
                f"Checkpoint for week {week} ({theme}) toward goal: {goal}. "
                f"Covers: {', '.join(unique_topics)}."
            ),
            sub_skills=unique_topics,
            is_quiz=True,
            status=TaskStatus.PENDING,
            quiz=wrap_quiz,
        )
    )
    quiz_ids.append(wrap["quiz_id"])

    if project:
        focus = unique_topics[0] if unique_topics else theme
        tasks.append(
            Task(
                id=new_id("proj"),
                title=f"Mini-project: apply {focus} toward {goal}",
                week=week,
                estimated_hours=project_hours,
                topics=unique_topics,
                description=(
                    f"Build a small project that applies {focus} in service of your goal "
                    f"\"{goal}\". Document what you built and what you learned."
                ),
                sub_skills=[focus, "project planning", "demo / write-up"],
                is_project=True,
                resources=[
                    ResourceLink(
                        title=f"roadmap.sh – {roadmap_key}",
                        url=f"https://roadmap.sh/{roadmap_key}",
                        kind="roadmap",
                    )
                ]
                if roadmap_key
                else [],
            )
        )

    return WeeklyPlan(
        week=week,
        theme=theme,
        topics=unique_topics,
        tasks=tasks,
        quiz_id=quiz_ids[0] if quiz_ids else None,
        hours_allocated=hours_per_week,
    )


def _next_milestone(weeks: List[WeeklyPlan]) -> str:
    if not weeks:
        return ""
    w = weeks[0]
    theme = w.theme
    if theme.lower().startswith("understand"):
        return theme
    return f"Understand {theme[0].lower() + theme[1:]}" if theme else w.topics[0]


def generate_plan(
    goal: str,
    hours_per_week: float,
    total_weeks: int,
    roadmap_data: Optional[Dict[str, Any]] = None,
    search_context: Optional[str] = None,
    source: ContentSource = ContentSource.ROADMAP,
    state_inference: int = 1,
    weak_areas: Optional[List[str]] = None,
    start_week: int = 1,
) -> LearningPlan:
    """Generate sequential week-by-week plan from real roadmap phases."""
    llm = get_llm()
    roadmap_data = roadmap_data or {}
    weak_areas = weak_areas or []
    roadmap_key = roadmap_data.get("key")

    phases = _phases_from_roadmap(roadmap_data)
    if not phases and search_context:
        topics = [t.strip() for t in re.split(r"[|,]", search_context) if t.strip()][:16]
        phases = [{"title": "Curated study path", "topics": topics or ["Fundamentals"]}]
    if not phases:
        phases = [
            {"title": "Foundations", "topics": ["Fundamentals", "Core tools"]},
            {"title": "Core skills", "topics": ["Practice projects"]},
            {"title": "Advanced application", "topics": ["Capstone"]},
        ]

    enrich_cache: Dict[str, Dict[str, Any]] = {}
    allocations = _allocate_phases_to_weeks(phases, total_weeks)
    weeks = [
        _build_week(
            week=i + 1,
            theme=theme,
            topics=topics,
            hours_per_week=hours_per_week,
            goal=goal,
            roadmap_key=roadmap_key,
            enrich_cache=enrich_cache,
        )
        for i, (theme, topics) in enumerate(allocations)
    ]

    if state_inference > 1 and weak_areas and 1 <= start_week <= len(weeks):
        idx = start_week - 1
        base = weeks[idx]
        remedial_topics = weak_areas[:3]
        remedial_tasks: List[Task] = []
        for d, topic in enumerate(remedial_topics):
            enriched = enrich_topic_task(goal=goal, topic=topic, roadmap_key=roadmap_key)
            quiz = generate_task_quiz(
                goal=goal,
                topic=topic,
                description=str(enriched.get("description") or ""),
                sub_skills=list(enriched.get("sub_skills") or []),
                num_questions=3,
            )
            remedial_tasks.append(
                Task(
                    id=new_id("task"),
                    title=f"Remedial: {enriched.get('title') or topic}",
                    week=start_week,
                    day=d + 1,
                    estimated_hours=2.0,
                    status=TaskStatus.REMEDIAL,
                    topics=[topic],
                    description=str(enriched.get("description") or ""),
                    sub_skills=list(enriched.get("sub_skills") or []),
                    resources=_as_resource_links(enriched.get("resources")),
                    is_remedial=True,
                    quiz=quiz,
                )
            )
        while len(remedial_tasks) < 4 and remedial_topics:
            topic = remedial_topics[len(remedial_tasks) % len(remedial_topics)]
            remedial_tasks.append(
                Task(
                    id=new_id("task"),
                    title=f"Remedial practice day {len(remedial_tasks)+1}: {topic}",
                    week=start_week,
                    day=len(remedial_tasks) + 1,
                    estimated_hours=2.0,
                    status=TaskStatus.REMEDIAL,
                    topics=[topic],
                    description=f"Extra practice on {topic} for goal: {goal}",
                    sub_skills=[topic],
                    is_remedial=True,
                    resources=[ResourceLink(title=f"Practice: {topic}", kind="link")],
                )
            )
        weeks[idx] = WeeklyPlan(
            week=base.week,
            theme=f"Remedial focus: {', '.join(remedial_topics)}",
            topics=list(dict.fromkeys(remedial_topics + base.topics)),
            tasks=remedial_tasks + base.tasks,
            quiz_id=base.quiz_id,
            hours_allocated=base.hours_allocated + 8.0,
        )

    roadmap_title = roadmap_data.get("title") or goal
    default_title = f"{total_weeks}-Week {roadmap_title.replace(' Roadmap', '')} Learning Plan"
    meta = llm.chat_json(
        PLAN_GENERATOR_SYSTEM,
        (
            f"Goal: {goal}\nWeeks: {total_weeks}\nHours/week: {hours_per_week}\n"
            f"Roadmap: {roadmap_title}\nPhases: {[p['title'] for p in phases[:8]]}\n"
            f"Return JSON with title and milestones (list of week themes)."
        ),
    )
    milestones = meta.get("milestones") or [w.theme for w in weeks[:: max(1, total_weeks // 4)][:4]]
    title = str(meta.get("title") or default_title)

    return LearningPlan(
        title=title,
        total_weeks=total_weeks,
        hours_per_week=hours_per_week,
        weeks=weeks,
        milestones=milestones,
        source=source,
        version=max(1, state_inference),
        state_inference=state_inference,
    )


def suggest_next_milestone(plan: LearningPlan) -> str:
    return _next_milestone(plan.weeks)
