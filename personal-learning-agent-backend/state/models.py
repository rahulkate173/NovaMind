"""Pydantic models – LearnerState and related schemas (source of truth)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SkillLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    REMEDIAL = "remedial"


class GoalClarity(str, Enum):
    TRUE = "true"
    FALSE = "false"
    NEEDS_CLARIFICATION = "needs_clarification"


class ContentSource(str, Enum):
    ROADMAP = "roadmap.sh"
    WEBSEARCH = "websearch"


class ResourceLink(BaseModel):
    title: str
    url: str = ""
    kind: str = "link"  # course, book, official, article, roadmap, link


class QuizQuestion(BaseModel):
    id: str
    prompt: str
    topic: str = ""
    type: str = "short_answer"  # short_answer | mcq
    options: List[str] = Field(default_factory=list)
    answer_hint: Optional[str] = None


class TaskQuiz(BaseModel):
    quiz_id: str
    topic: str = ""
    questions: List[QuizQuestion] = Field(default_factory=list)


class Task(BaseModel):
    id: str
    title: str
    week: int
    day: Optional[int] = None
    estimated_hours: float = 1.0
    status: TaskStatus = TaskStatus.PENDING
    topics: List[str] = Field(default_factory=list)
    description: str = ""
    sub_skills: List[str] = Field(default_factory=list)
    is_quiz: bool = False
    is_project: bool = False
    is_remedial: bool = False
    resources: List[ResourceLink] = Field(default_factory=list)
    quiz: Optional[TaskQuiz] = None


class WeeklyPlan(BaseModel):
    week: int
    theme: str
    topics: List[str] = Field(default_factory=list)
    tasks: List[Task] = Field(default_factory=list)
    quiz_id: Optional[str] = None
    hours_allocated: float = 0.0


class LearningPlan(BaseModel):
    title: str
    total_weeks: int
    hours_per_week: float
    weeks: List[WeeklyPlan] = Field(default_factory=list)
    milestones: List[str] = Field(default_factory=list)
    source: ContentSource = ContentSource.ROADMAP
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = 1
    state_inference: int = 1  # 1 = first generation; >1 = iterative


class ProgressMetrics(BaseModel):
    overall_progress: float = 0.0
    current_week: int = 1
    streak: int = 0
    time_spent_hours: float = 0.0
    planned_hours: float = 0.0
    tasks_completed: int = 0
    tasks_total: int = 0
    quizzes_passed: int = 0
    quizzes_failed: int = 0
    last_active: date = Field(default_factory=date.today)


class FinalMetrics(BaseModel):
    total_time_spent: str
    streak: int
    certificates: List[str] = Field(default_factory=list)
    completion_date: Optional[date] = None


class ParsedIntent(BaseModel):
    is_valid: bool = True
    clarity: GoalClarity = GoalClarity.TRUE
    goal: str
    domain: str = "general"
    skill_level: SkillLevel = SkillLevel.BEGINNER
    timeline_weeks: int = 12
    target_outcome: str = ""
    clarification_question: Optional[str] = None
    roadmap_key: Optional[str] = None  # e.g. "backend", "frontend"


class QuizResult(BaseModel):
    user_id: str
    week: int
    score: float
    weak_topics: List[str] = Field(default_factory=list)
    passed: Optional[bool] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LearnerState(BaseModel):
    """Central source of truth for a learner – matches grok_report example."""

    user_id: str
    current_goal: str
    skill_level: SkillLevel = SkillLevel.BEGINNER
    available_hours_per_week: float = 20.0
    target_date: Optional[date] = None

    overall_progress: float = 0.0
    current_week: int = 1
    streak: int = 0
    last_active: date = Field(default_factory=date.today)

    completed_tasks: List[str] = Field(default_factory=list)
    weak_areas: List[str] = Field(default_factory=list)
    next_milestone: str = ""
    plan: Optional[LearningPlan] = None

    parsed_intent: Optional[ParsedIntent] = None
    content_source: Optional[ContentSource] = None
    roadmap_data: Optional[Dict[str, Any]] = None
    search_context: Optional[str] = None

    quiz_history: List[QuizResult] = Field(default_factory=list)
    nudges: List[str] = Field(default_factory=list)
    observations: List[str] = Field(default_factory=list)

    state_inference: int = 1
    goal_achieved: bool = False
    final_metrics: Optional[FinalMetrics] = None
    last_plan_update_reason: Optional[str] = None

    thread_id: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def metrics(self) -> ProgressMetrics:
        tasks_total = 0
        if self.plan:
            tasks_total = sum(len(w.tasks) for w in self.plan.weeks)
        return ProgressMetrics(
            overall_progress=self.overall_progress,
            current_week=self.current_week,
            streak=self.streak,
            time_spent_hours=0.0,
            planned_hours=(self.plan.hours_per_week * self.plan.total_weeks)
            if self.plan
            else 0.0,
            tasks_completed=len(self.completed_tasks),
            tasks_total=tasks_total,
            quizzes_passed=sum(1 for q in self.quiz_history if (q.passed or q.score >= 70)),
            quizzes_failed=sum(1 for q in self.quiz_history if not (q.passed or q.score >= 70)),
            last_active=self.last_active,
        )
