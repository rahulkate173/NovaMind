// ─────────────────────────────────────────────────────────────
//  routes/dashboardRoutes.js  –  Dashboard task & quiz routes
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  syncTasksHandler,
  getTasksHandler,
  completeTaskHandler,
  saveQuizResultHandler,
  getQuizAttemptsHandler,
} from '../controllers/dashboardController.js';

const router = Router();

// ── Tasks ────────────────────────────────────────────────────
router.get('/tasks/:userId',    getTasksHandler);      // GET  /api/dashboard/tasks/:userId
router.post('/tasks/sync',      syncTasksHandler);     // POST /api/dashboard/tasks/sync
router.post('/tasks/complete',  completeTaskHandler);  // POST /api/dashboard/tasks/complete

// ── Quizzes ──────────────────────────────────────────────────
router.post('/quiz/result',              saveQuizResultHandler);    // POST /api/dashboard/quiz/result
router.get('/quiz/attempts/:userId',     getQuizAttemptsHandler);   // GET  /api/dashboard/quiz/attempts/:userId

export default router;
