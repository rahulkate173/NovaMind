/**
 * api.js – Central client for the Personal Learning Agent FastAPI backend.
 * Base URL is empty so Vite's proxy forwards /api/* to http://localhost:8000.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '';
export const EXPRESS_BASE = import.meta.env.VITE_EXPRESS_URL || '';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Health ──────────────────────────────────────────────────────────────────
export const healthCheck = () => request('GET', '/health');

// ── Workflow ─────────────────────────────────────────────────────────────────
/**
 * Start a new learning plan.
 * @param {object} params - { user_id, goal, current_level, available_hours_per_week, target_date? }
 */
export const startWorkflow = (params) => request('POST', '/api/workflow/start', params);

/**
 * Resume a paused workflow (e.g. after a clarification).
 * @param {object} params - { user_id, clarification? }
 */
export const resumeWorkflow = (params) => request('POST', '/api/workflow/resume', params);

/**
 * Get the current learning plan for a user.
 * @param {string} userId
 */
export const getPlan = (userId) => request('GET', `/api/workflow/get-plan/${userId}`);

// ── Tasks ────────────────────────────────────────────────────────────────────
/**
 * Get today's study tasks (no quizzes).
 * @param {string} userId
 * @param {boolean} sync - whether to run dynamic workflow check first
 */
export const getDailyTasks = (userId, sync = true) =>
  request('GET', `/api/tasks/daily/${userId}?sync=${sync}`);

/**
 * Get this week's study tasks.
 * @param {string} userId
 */
export const getWeeklyTasks = (userId, sync = true) =>
  request('GET', `/api/tasks/weekly/${userId}?sync=${sync}`);

/**
 * Mark a task complete.
 * @param {string} userId
 * @param {string} taskId
 */
export const completeTask = (userId, taskId) =>
  request('POST', '/api/tasks/complete', { user_id: userId, task_id: taskId });

// ── Quizzes ───────────────────────────────────────────────────────────────────
/**
 * Get today's quizzes.
 * @param {string} userId
 */
export const getDailyQuizzes = (userId, sync = true) =>
  request('GET', `/api/quizzes/daily/${userId}?sync=${sync}`);

/**
 * Submit quiz results.
 * @param {object} params - { user_id, task_id, score, weak_topics? }
 */
export const submitQuiz = (params) => request('POST', '/api/quizzes/submit', params);

/**
 * Submit weekly quiz feedback (triggers replan on low score).
 * @param {object} params - { user_id, week, score, weak_topics? }
 */
export const submitQuizFeedback = (params) => request('POST', '/api/feedback/quiz', params);

// ── Chatbot ───────────────────────────────────────────────────────────────────
/**
 * Send a message to the AI tutor.
 * @param {string} userId
 * @param {string} message
 */
export const sendChatMessage = (userId, message) =>
  request('POST', '/api/chat', { user_id: userId, message });

/**
 * Get chat history for a user.
 * @param {string} userId
 */
export const getChatHistory = (userId) => request('GET', `/api/chat/history/${userId}`);

// ── State ─────────────────────────────────────────────────────────────────────
/**
 * Get agent state for a user.
 * @param {string} userId
 */
export const getAgentState = (userId) => request('GET', `/api/state/${userId}`);

// ── Dashboard Persistence (Express + MongoDB) ──────────────────────────────────
/**
 * Sync task snapshot to MongoDB for reload persistence.
 * @param {object} params - { userId, tasks, currentWeek, planTitle }
 */
export const syncTasksToDb = (params) =>
  request('POST', '/api/dashboard/tasks/sync', params);

/**
 * Get cached tasks from MongoDB (instant on reload).
 * @param {string} userId
 */
export const getCachedTasks = (userId) =>
  request('GET', `/api/dashboard/tasks/${userId}`);

/**
 * Mark a task complete in MongoDB cache.
 * @param {object} params - { userId, taskId }
 */
export const completeTaskInDb = (params) =>
  request('POST', '/api/dashboard/tasks/complete', params);

/**
 * Save a quiz attempt to MongoDB.
 * @param {object} params - { userId, quizId, taskId, title, topics, score, passed, weakTopics, answers, week }
 */
export const saveQuizResultToDb = (params) =>
  request('POST', '/api/dashboard/quiz/result', params);

/**
 * Get all quiz attempts for a user from MongoDB.
 * @param {string} userId
 */
export const getQuizAttempts = (userId) =>
  request('GET', `/api/dashboard/quiz/attempts/${userId}`);

