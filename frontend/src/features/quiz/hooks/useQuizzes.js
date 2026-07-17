import { useState, useEffect, useCallback } from 'react';
import { getDailyQuizzes } from '../../../services/api';

const CACHE_KEY = (uid) => `nm_daily_quizzes_${uid}`;

/**
 * useQuizzes – Fetches today's quizzes from the Python learning agent.
 * Caches in localStorage so they survive a page reload.
 *
 * Each quiz returned has shape:
 *   { task_id, title, week, day, topics, quiz_id, questions[], due_reason, completed }
 *
 * @param {string} userId
 */
export function useQuizzes(userId) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const saveToCache = useCallback((list) => {
    try { localStorage.setItem(CACHE_KEY(userId), JSON.stringify(list)); } catch (_) {}
  }, [userId]);

  const loadFromCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY(userId));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }, [userId]);

  const fetchQuizzes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDailyQuizzes(userId, true);
      const list = Array.isArray(data) ? data : (data.quizzes ?? []);
      setQuizzes(list);
      saveToCache(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, saveToCache]);

  useEffect(() => {
    if (!userId) return;
    // Instant render from localStorage
    const cached = loadFromCache();
    if (cached?.length) {
      setQuizzes(cached);
      setLoading(false);
    }
    // Then fetch fresh
    fetchQuizzes();
  }, [userId]);

  // Mark a quiz as completed in local state + cache
  const markCompleted = useCallback((quizId) => {
    setQuizzes(prev => {
      const updated = prev.map(q =>
        q.quiz_id === quizId ? { ...q, completed: true } : q
      );
      saveToCache(updated);
      return updated;
    });
  }, [saveToCache]);

  return { quizzes, loading, error, refetch: fetchQuizzes, markCompleted };
}
