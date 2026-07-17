// ─────────────────────────────────────────────────────────────
//  controllers/dashboardController.js
//  Handles task caching and quiz result storage in MongoDB.
//  The Python learning agent is still the source of truth for
//  plans/tasks; these endpoints provide a persistent Mongo layer.
// ─────────────────────────────────────────────────────────────

import LearningTask from '../models/LearningTask.model.js';
import QuizAttempt  from '../models/QuizAttempt.model.js';

// ── Task helpers ─────────────────────────────────────────────

/**
 * POST /api/dashboard/tasks/sync
 * Upsert the current daily task list for a user.
 * Called by the frontend after every successful fetch from the
 * Python agent so data survives a page reload.
 *
 * Body: { userId, tasks[], currentWeek, planTitle }
 */
export async function syncTasksHandler(req, res) {
  try {
    const { userId, tasks = [], currentWeek = 1, planTitle = '' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const doc = await LearningTask.findOneAndUpdate(
      { userId },
      {
        $set: {
          tasks       : tasks,
          currentWeek : currentWeek,
          planTitle   : planTitle,
          syncedAt    : new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({ ok: true, syncedAt: doc.syncedAt, taskCount: tasks.length });
  } catch (err) {
    console.error('[dashboard] syncTasks error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/dashboard/tasks/:userId
 * Retrieve the cached task list from MongoDB.
 * Frontend uses this on reload for instant display while the
 * Python agent re-fetches fresh data in the background.
 */
export async function getTasksHandler(req, res) {
  try {
    const { userId } = req.params;
    const doc = await LearningTask.findOne({ userId }).lean();
    if (!doc) return res.json({ tasks: [], currentWeek: 1, planTitle: '' });
    return res.json({
      tasks       : doc.tasks,
      currentWeek : doc.currentWeek,
      planTitle   : doc.planTitle,
      syncedAt    : doc.syncedAt,
    });
  } catch (err) {
    console.error('[dashboard] getTasks error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/dashboard/tasks/complete
 * Mark a task as done in MongoDB cache.
 * The caller should separately hit the Python agent to persist
 * completion in the learning state.
 *
 * Body: { userId, taskId }
 */
export async function completeTaskHandler(req, res) {
  try {
    const { userId, taskId } = req.body;
    if (!userId || !taskId) {
      return res.status(400).json({ error: 'userId and taskId are required' });
    }

    const result = await LearningTask.updateOne(
      { userId, 'tasks.taskId': taskId },
      { $set: { 'tasks.$.done': true, syncedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      // Task not in cache yet – not an error, just cache miss
      return res.json({ ok: true, cached: false });
    }

    return res.json({ ok: true, cached: true });
  } catch (err) {
    console.error('[dashboard] completeTask error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ── Quiz helpers ──────────────────────────────────────────────

/**
 * POST /api/dashboard/quiz/result
 * Persist a completed quiz attempt to MongoDB.
 * Called by the frontend after a successful /api/quizzes/submit
 * to the Python agent.
 *
 * Body: { userId, quizId, taskId, title, topics, score, passed,
 *         weakTopics, answers, week }
 */
export async function saveQuizResultHandler(req, res) {
  try {
    const {
      userId,
      quizId,
      taskId,
      title       = '',
      topics      = [],
      score,
      passed,
      weakTopics  = [],
      answers     = [],
      week        = 1,
    } = req.body;

    if (!userId || !quizId || !taskId || score === undefined || passed === undefined) {
      return res.status(400).json({
        error: 'userId, quizId, taskId, score, and passed are required',
      });
    }

    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      taskId,
      title,
      topics,
      score,
      passed,
      weakTopics,
      answers,
      week,
    });

    return res.status(201).json({ ok: true, attemptId: attempt._id });
  } catch (err) {
    console.error('[dashboard] saveQuizResult error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/dashboard/quiz/attempts/:userId
 * Retrieve all quiz attempts for a user (sorted newest first).
 */
export async function getQuizAttemptsHandler(req, res) {
  try {
    const { userId } = req.params;
    const attempts = await QuizAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ attempts });
  } catch (err) {
    console.error('[dashboard] getQuizAttempts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
