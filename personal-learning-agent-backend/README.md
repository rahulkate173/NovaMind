# AI-Powered Personal Learning Agent – Backend

Closed-loop LangGraph learning agent that **understands intent**, **plans dynamically**, **tracks honestly**, **nudges intelligently**, and **learns from feedback**.

This package implements the architecture + Excalidraw workflow only (no product frontend).

## Real roadmap.sh content

Plans are built from the local [nilbuild/developer-roadmap](https://github.com/nilbuild/developer-roadmap) clone:

```powershell
.\scripts\setup_roadmaps.ps1
```

JSON roadmaps live under `data/developer-roadmap/src/data/roadmaps/{key}/{key}.json` (backend, mlops, devops, …).

Optional: run the full Astro site with `pnpm install && pnpm dev` inside that clone (usually http://localhost:4321). The agent only needs the roadmap JSON files.

### Task schedule (study tasks only)

Each task item: `task_id`, `task`, `description`, `resources` only.

`GET /api/tasks/daily/{user_id}?sync=true`  
`GET /api/tasks/weekly/{user_id}?sync=true`  
`GET /api/tasks/schedule/{user_id}?view=daily|weekly`

**Mark task complete:** `POST /api/tasks/complete`
```json
{"user_id": "user_123", "task_id": "task_abc"}
```

### Quiz schedule (separate route)

Each quiz item: `task_id`, `title`, `quiz_id`, `questions` (sub-questions), `due_reason`.

`GET /api/quizzes/daily/{user_id}?sync=true`  
`GET /api/quizzes/weekly/{user_id}?sync=true`  
`GET /api/quizzes/schedule/{user_id}?view=daily|weekly`

**Submit quiz** (low score → roadmap replan): `POST /api/quizzes/submit`
```json
{"user_id": "user_123", "task_id": "quiz_task_id", "score": 45, "weak_topics": ["SQL Joins"]}
```

Set `sync=false` on task/quiz GET routes to skip auto workflow check.

## Architecture

```
personal-learning-agent-backend/
├── agents/          # Intent, plan, progress, nudge, feedback, roadmap, state
├── workflow/        # LangGraph graph (nodes, edges, executor)
├── chatbot/         # 24/7 state-aware tutor
├── state/           # LearnerState models + SQLite + Chroma
├── tools/           # roadmap.sh data, web search, calendar, quiz
├── mcp/             # Tool definitions for future agent calling
├── api/routes/      # REST API for workflow / chat / state
└── utils/           # GROQ LLM client + prompts
```

### Workflow (from Excalidraw)

1. **Intent Parser** → clarify loop until goal is valid  
2. **Content Retriever** → `roadmap.sh` **or** web search  
3. **Plan Generator** (`state_inference=1` on first run) → day/week plan + quizzes  
4. **Plan Updater** → Google Calendar schedule (stub if disabled)  
5. **Persist Learning State** → DB + vector store (**HITL interrupt**)  
6. **Conditional Router** → nudge (fail/inactivity) **or** feedback (quiz)  
7. **State Analyzer** → iterative replan **or** **Final State**

## Quick start

```bash
cd personal-learning-agent-backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # or use the included .env (mock LLM on)
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs

Set `USE_MOCK_LLM=false` and `GROQ_API_KEY=...` to use real Groq models.

## API (matches grok_report simulation)

### 1. Start workflow

`POST /api/workflow/start`

```json
{
  "user_id": "user_123",
  "goal": "Become a Junior Backend Developer in 12 weeks",
  "current_level": "Beginner",
  "available_hours_per_week": 20,
  "target_date": "2026-10-10"
}
```

### 2. Quiz feedback loop (dynamic replan)

`POST /api/feedback/quiz`

```json
{
  "user_id": "user_123",
  "week": 3,
  "score": 45,
  "weak_topics": ["SQL Joins", "Indexing"]
}
```

### 3. Read state

`GET /api/state/user_123`

### 4. Tutor chat (always injects LearnerState)

`POST /api/chat/`

```json
{
  "user_id": "user_123",
  "message": "I'm stuck on SQL Joins"
}
```

## Tests

```bash
pytest -q
```

The suite includes an end-to-end simulation aligned with `grok_report (1).pdf`.

## Docker

```bash
docker compose up --build
```

## Notes

- Roadmap data is bundled (backend/frontend/devops) with optional HTTP roadmap service.
- Calendar sync is stubbed unless `GOOGLE_CALENDAR_ENABLED=true`.
- Chroma falls back to in-memory keyword search if unavailable.
