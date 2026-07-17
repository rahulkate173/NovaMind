"""FastAPI application entry point – mounts all routers."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import chatbot, quizzes, state, tasks, workflow
from config import get_settings
from mcp.server import get_mcp_server

settings = get_settings()
Path("data").mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="AI-Powered Personal Learning Agent",
    description=(
        "Closed-loop learning agent: intent → plan → track → nudge → feedback. "
        "LangGraph workflow + state-aware tutor chatbot."
    ),
    version="1.1.3",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow.router)
app.include_router(workflow.feedback_router)
app.include_router(tasks.router)
app.include_router(quizzes.router)
app.include_router(chatbot.router)
app.include_router(state.router)


@app.get("/")
def root():
    return {
        "name": "Personal Learning Agent Backend",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    store = settings.state_store.strip().lower()
    payload = {
        "status": "ok",
        "env": settings.app_env,
        "mock_llm": not settings.llm_available,
        "state_store": store,
    }
    if store == "mongodb":
        from state.repository import get_repository

        repo = get_repository()
        payload["mongodb_collection"] = settings.mongodb_collection
        payload["mongodb_connected"] = getattr(repo, "ping", lambda: False)()
    return payload


@app.get("/api/mcp/tools")
def mcp_tools():
    return get_mcp_server().list_tools()


@app.post("/api/mcp/call")
def mcp_call(payload: dict):
    return get_mcp_server().call_tool(payload.get("name", ""), payload.get("arguments") or {})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development",
    )
