"""LLM client – GROQ primary, deterministic mock fallback for demos/tests."""

from __future__ import annotations

import json
import re
import time
import logging
from typing import Any, Dict, Optional

from config import get_settings

logger = logging.getLogger("LLMClient")


def _extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"No JSON object found in LLM response: {text[:200]}")


class LLMClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        if self.settings.llm_available:
            try:
                from langchain_groq import ChatGroq

                self._client = ChatGroq(
                    api_key=self.settings.groq_api_key,
                    model=self.settings.groq_model,
                    temperature=self.settings.llm_temperature,
                    max_retries=3,
                )
            except Exception as e:
                logger.warning(f"Failed to initialize ChatGroq: {e}. Falling back to mock client.")
                self._client = None

    @property
    def is_mock(self) -> bool:
        return self._client is None

    def chat(self, system: str, user: str) -> str:
        if self._client is None:
            return self._mock_chat(system, user)
        messages = [
            ("system", system),
            ("human", user),
        ]
        for attempt in range(3):
            try:
                result = self._client.invoke(messages)
                return str(result.content)
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "rate limit" in err_str:
                    if attempt < 2:
                        sleep_time = (attempt + 1) * 3
                        logger.warning(f"Groq rate limit hit (429). Retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                        continue
                    else:
                        logger.warning("Groq rate limit exhausted after retries. Falling back to mock response.")
                        return self._mock_chat(system, user)
                logger.warning(f"ChatGroq error: {e}. Falling back to mock response.")
                return self._mock_chat(system, user)
        return self._mock_chat(system, user)

    def chat_json(self, system: str, user: str) -> Dict[str, Any]:
        if self._client is None:
            return self._mock_json(system, user)
        messages = [
            ("system", system + "\nRespond with valid JSON only."),
            ("human", user),
        ]
        for attempt in range(3):
            try:
                result = self._client.invoke(messages)
                return _extract_json(str(result.content))
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "rate limit" in err_str:
                    if attempt < 2:
                        sleep_time = (attempt + 1) * 3
                        logger.warning(f"Groq rate limit hit (429) during JSON call. Retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                        continue
                    else:
                        logger.warning("Groq rate limit exhausted during JSON call. Falling back to mock JSON.")
                        return self._mock_json(system, user)
                logger.warning(f"ChatGroq JSON error: {e}. Falling back to mock JSON.")
                return self._mock_json(system, user)
        return self._mock_json(system, user)

    def _mock_chat(self, system: str, user: str) -> str:
        lower = (system + " " + user).lower()
        if "sql joins" in lower or "stuck" in lower:
            return (
                "Hey! I see you're in Week 3 and scored 45% on the Databases quiz. "
                "SQL Joins are your weak area right now.\n\n"
                "Here's a quick fix plan:\n"
                "1. Quick 8-minute explanation\n"
                "2. 3 practice problems\n"
                "3. Small exercise from your roadmap\n\n"
                "Shall we start with the explanation or jump into practice?"
            )
        if "nudge" in lower or "inactive" in lower:
            return (
                "We noticed you've been away. To keep your learning goal on track, "
                "let's revisit your next milestone with a short focused session. "
                "Ready to continue?"
            )
        return (
            "I'm your personal learning tutor. Based on your current plan and progress, "
            "I can clarify topics, generate practice quizzes, or adjust your schedule. "
            "What would you like to work on?"
        )

    def _mock_json(self, system: str, user: str) -> Dict[str, Any]:
        lower = (system + " " + user).lower()

        if "intent" in lower or "parse" in lower:
            goal_match = re.search(r"Goal:\s*(.+)", user, re.I)
            goal = goal_match.group(1).strip() if goal_match else user.strip()
            # Stop at next labeled field if present
            goal = re.split(r"\n(?:Stated level|Hours/week|Timeline)", goal, maxsplit=1)[0].strip()
            weeks = 12
            m = re.search(r"(\d+)\s*weeks?", goal, re.I)
            if m:
                weeks = int(m.group(1))
            goal_lower = goal.lower()
            roadmap_key = None
            domain = "general"
            if any(k in goal_lower for k in ("mlops", "ml ops", "machine learning ops")):
                roadmap_key = "mlops"
                domain = "mlops"
            elif any(k in goal_lower for k in ("data scientist", "data science", "ai and data")):
                roadmap_key = "ai-data-scientist"
                domain = "ai-data-scientist"
            elif any(k in goal_lower for k in ("machine learning", "deep learning")):
                roadmap_key = "machine-learning"
                domain = "machine-learning"
            elif any(k in goal_lower for k in ("backend", "api", "fastapi", "django")):
                roadmap_key = "backend"
                domain = "backend"
            elif any(k in goal_lower for k in ("frontend", "react", "vue", "css")):
                roadmap_key = "frontend"
                domain = "frontend"
            elif any(k in goal_lower for k in ("devops", "docker", "kubernetes")):
                roadmap_key = "devops"
                domain = "devops"
            elif any(k in goal_lower for k in ("aws", "cloud", "solutions architect")):
                roadmap_key = "aws"
                domain = "cloud"
            elif any(k in goal_lower for k in ("data engineer", "data engineering")):
                roadmap_key = "data-engineer"
                domain = "data-engineer"
            is_vague = len(goal) < 8 or goal_lower in {
                "learn coding",
                "study",
                "help",
                "something",
            }
            return {
                "is_valid": not is_vague,
                "clarity": "false" if is_vague else "true",
                "goal": goal,
                "domain": domain,
                "skill_level": "Beginner",
                "timeline_weeks": weeks,
                "target_outcome": goal,
                "clarification_question": (
                    "Could you specify a concrete outcome and timeline? "
                    "e.g. 'Become a Junior Backend Developer in 12 weeks'"
                    if is_vague
                    else None
                ),
                "roadmap_key": roadmap_key,
            }

        if "plan" in lower:
            # Prefer roadmap phase titles when provided in the user prompt
            phases = re.findall(r"'([^']+)'", user)
            if not phases:
                phases = re.findall(r"\"([^\"]+)\"", user)
            milestones = phases[:4] or [
                "Finish fundamentals",
                "Build core skills",
                "Apply in projects",
                "Ship & operate",
            ]
            title_match = re.search(r"Roadmap:\s*(.+)", user)
            roadmap_name = title_match.group(1).strip().split("\n")[0] if title_match else "Learning"
            weeks_match = re.search(r"Weeks:\s*(\d+)", user)
            weeks = weeks_match.group(1) if weeks_match else "12"
            return {
                "title": f"{weeks}-Week {roadmap_name.replace(' Roadmap', '')} Learning Plan",
                "milestones": milestones,
            }

        if "feedback" in lower or "quiz" in lower:
            return {
                "needs_remediation": True,
                "summary": "Low quiz score indicates weak areas needing remedial tasks.",
                "remedial_topics": [],
            }

        return {"ok": True}


_llm: Optional[LLMClient] = None


def get_llm() -> LLMClient:
    global _llm
    if _llm is None:
        _llm = LLMClient()
    return _llm
