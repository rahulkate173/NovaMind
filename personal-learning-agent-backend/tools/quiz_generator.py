"""Quiz generator – per-subtask quizzes tied to goal + subgoal + description."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from state.models import QuizQuestion, TaskQuiz
from utils.helpers import new_id
from utils.llm import get_llm
from utils.prompts import TASK_QUIZ_SYSTEM


def generate_quiz(
    topics: List[str],
    week: int,
    num_questions: int = 5,
    goal: str = "",
    description: str = "",
    sub_skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Legacy week-level quiz helper (still used for weekly wrap-up)."""
    quiz = generate_task_quiz(
        goal=goal or "learning goal",
        topic=", ".join(topics) or "fundamentals",
        description=description,
        sub_skills=sub_skills or topics,
        num_questions=num_questions,
    )
    return {
        "quiz_id": quiz.quiz_id,
        "week": week,
        "topics": topics,
        "questions": [q.model_dump() for q in quiz.questions],
    }


def generate_task_quiz(
    goal: str,
    topic: str,
    description: str = "",
    sub_skills: Optional[List[str]] = None,
    num_questions: int = 3,
) -> TaskQuiz:
    """Generate a small quiz grounded in main goal + subgoal + description."""
    llm = get_llm()
    skills = sub_skills or []
    user = (
        f"Main goal: {goal}\n"
        f"Subgoal / topic: {topic}\n"
        f"Description: {description or 'N/A'}\n"
        f"Sub-skills: {', '.join(skills) if skills else 'N/A'}\n"
        f"Number of questions: {num_questions}\n"
        "Return JSON: {\"questions\": [{\"id\", \"prompt\", \"topic\", \"type\", \"options\", \"answer_hint\"}]}"
    )

    if llm.is_mock:
        questions = _mock_questions(goal, topic, description, skills, num_questions)
        return TaskQuiz(quiz_id=new_id("quiz"), topic=topic, questions=questions)

    data = llm.chat_json(TASK_QUIZ_SYSTEM, user)
    questions: List[QuizQuestion] = []
    for i, raw in enumerate(data.get("questions") or []):
        questions.append(
            QuizQuestion(
                id=str(raw.get("id") or f"q{i+1}"),
                prompt=str(raw.get("prompt") or f"Explain a key idea in {topic}"),
                topic=str(raw.get("topic") or topic),
                type=str(raw.get("type") or "short_answer"),
                options=list(raw.get("options") or []),
                answer_hint=raw.get("answer_hint"),
            )
        )
    if not questions:
        questions = _mock_questions(goal, topic, description, skills, num_questions)
    return TaskQuiz(quiz_id=new_id("quiz"), topic=topic, questions=questions[:num_questions])


def _mock_questions(
    goal: str,
    topic: str,
    description: str,
    skills: List[str],
    n: int,
) -> List[QuizQuestion]:
    skill = skills[0] if skills else topic
    prompts = [
        f"In the context of becoming skilled at '{goal}', why does '{topic}' matter?",
        f"List 2–3 core ideas you must understand within '{topic}'"
        + (f" (e.g. related to {skill})." if skill else "."),
        f"Give one practical exercise you would do this week to apply '{topic}'.",
    ]
    if description:
        prompts[1] = (
            f"Based on this focus — {description[:180]}... — "
            f"what are two sub-skills under '{topic}' you should practice first?"
        )
    out: List[QuizQuestion] = []
    for i in range(n):
        out.append(
            QuizQuestion(
                id=f"q{i+1}",
                prompt=prompts[i % len(prompts)],
                topic=topic,
                type="short_answer",
                answer_hint=f"Relate your answer to {goal} and {topic}",
            )
        )
    return out
