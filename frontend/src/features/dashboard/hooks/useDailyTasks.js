import { useState, useEffect, useCallback } from 'react';
import {
  getDailyTasks,
  completeTask,
  syncTasksToDb,
  getCachedTasks,
  completeTaskInDb,
} from '../../../services/api';

const CACHE_KEY = (uid) => `nm_daily_tasks_${uid}`;

/**
 * useDailyTasks – Fetches today's tasks from the learning agent backend.
 *
 * Persistence strategy (three layers):
 *   1. localStorage  – instant render on reload (no flicker)
 *   2. Express/Mongo – permanent cache that survives localStorage clear
 *   3. Python agent  – source of truth for plan state
 *
 * @param {string} userId
 */
const inFlightTasks = {};

export function useDailyTasks(userId) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Normalise a raw task from the Python agent ───────────
  const normalise = (t) => ({
    id:          t.task_id ?? t.id,
    text:        t.title   ?? t.task ?? t.description ?? 'Task',
    description: t.description ?? '',
    resources:   t.resources   ?? [],
    done:        t.completed   ?? t.done ?? false,
    week:        t.week        ?? 1,
    day:         t.day         ?? 1,
  });

  // ── Persist helpers ──────────────────────────────────────
  const saveToLocalStorage = useCallback((taskList) => {
    try {
      localStorage.setItem(CACHE_KEY(userId), JSON.stringify(taskList));
    } catch (_) {}
  }, [userId]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY(userId));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }, [userId]);

  // ── Fetch from Python agent (source of truth) ────────────
  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      if (!inFlightTasks[userId]) {
        inFlightTasks[userId] = getDailyTasks(userId, true).finally(() => {
          delete inFlightTasks[userId];
        });
      }
      const data = await inFlightTasks[userId];
      const list = Array.isArray(data) ? data : (data.tasks ?? []);
      const normalised = list.map(normalise);
      setTasks(normalised);
      saveToLocalStorage(normalised);

      // Async sync to Mongo (fire-and-forget – don't block UI)
      syncTasksToDb({
        userId,
        tasks: normalised.map(t => ({
          taskId:      t.id,
          title:       t.text,
          description: t.description,
          resources:   t.resources,
          done:        t.done,
          week:        t.week,
          day:         t.day,
        })),
        currentWeek: data.current_week ?? 1,
        planTitle:   data.plan_title   ?? '',
      }).catch(() => {/* ignore if Express is down */});

    } catch (err) {
      // If user has no state yet (just signed up), ignore the error gracefully
      if (err.message.includes('404') || err.message.includes('No learner state')) {
        setTasks([]);
        setError(null);
      } else {
        setError(err.message);

        // Fall back to Mongo cache on Python agent failure
        try {
          const cached = await getCachedTasks(userId);
          if (cached?.tasks?.length) {
            const mapped = cached.tasks.map(t => ({
              id:          t.taskId,
              text:        t.title,
              description: t.description,
              resources:   t.resources,
              done:        t.done,
              week:        t.week,
              day:         t.day,
            }));
            setTasks(mapped);
            setError(null); // recovered
          }
        } catch (_) {}
      }
    } finally {
      setLoading(false);
    }
  }, [userId, saveToLocalStorage]);

  // ── On mount: show localStorage immediately, then fetch ──
  useEffect(() => {
    if (!userId) return;

    // Instant render from localStorage (prevents blank flash)
    const cached = loadFromLocalStorage();
    if (cached?.length) {
      setTasks(cached);
      setLoading(false); // show cached immediately
    }

    // Then fetch fresh data
    fetchTasks();
  }, [userId]); // intentionally not including fetchTasks to avoid double-fetch

  // ── Toggle task completion ────────────────────────────────
  const toggle = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const wasNotDone = !task?.done;

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    );

    if (wasNotDone) {
      try {
        // 1. Tell Python agent (source of truth)
        await completeTask(userId, taskId);

        // 2. Update Mongo cache (fire-and-forget)
        completeTaskInDb({ userId, taskId }).catch(() => {});

        // 3. Update localStorage
        setTasks(prev => {
          const updated = prev.map(t => t.id === taskId ? { ...t, done: true } : t);
          saveToLocalStorage(updated);
          return updated;
        });
      } catch (err) {
        // Revert on failure
        setTasks(prev =>
          prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
        );
        console.error('Failed to complete task:', err);
      }
    } else {
      // Just update local cache (agent doesn't support un-complete)
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, done: false } : t);
        saveToLocalStorage(updated);
        return updated;
      });
    }
  }, [userId, tasks, saveToLocalStorage]);

  return { tasks, loading, error, refetch: fetchTasks, toggle };
}
