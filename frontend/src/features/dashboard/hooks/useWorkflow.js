import { useState, useEffect, useCallback } from 'react';
import { getPlan, startWorkflow } from '../../../services/api';

const CACHE_KEY = (uid) => `nm_workflow_plan_${uid}`;

/**
 * useWorkflow – Manages the user's learning plan state.
 *  - Instantly shows cached plan from localStorage on mount.
 *  - On mount, tries to load an existing plan from the Python agent.
 *  - Exposes `initPlan` to start a brand-new plan.
 *
 * @param {string} userId
 */
export function useWorkflow(userId) {
  const [plan, setPlan]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError]       = useState(null);

  // ── localStorage helpers ──────────────────────────────────
  const savePlanToCache = useCallback((p) => {
    try {
      if (p) localStorage.setItem(CACHE_KEY(userId), JSON.stringify(p));
    } catch (_) {}
  }, [userId]);

  const loadPlanFromCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY(userId));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }, [userId]);

  // ── Fetch from Python agent ───────────────────────────────
  const fetchPlan = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlan(userId);
      const p = data.plan ?? data;
      setPlan(p);
      savePlanToCache(p);
    } catch (err) {
      // 404 = no plan yet, not a real error
      if (!err.message.includes('404') && !err.message.toLowerCase().includes('not found')) {
        setError(err.message);
      }
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [userId, savePlanToCache]);

  // ── On mount: show cache first, then fetch fresh ──────────
  useEffect(() => {
    if (!userId) return;

    const cached = loadPlanFromCache();
    if (cached) {
      setPlan(cached);
      setLoading(false); // show immediately
    }

    // Fetch fresh regardless
    fetchPlan();
  }, [userId]); // intentionally omitting fetchPlan to avoid double-call

  /**
   * Start a new learning plan.
   * @param {object} params - { goal, current_level, available_hours_per_week, target_date? }
   */
  const initPlan = useCallback(async (params) => {
    setStarting(true);
    setError(null);
    try {
      const result = await startWorkflow({ user_id: userId, ...params });
      // Only re-fetch if not waiting for clarification
      if (result && result.status !== 'awaiting_clarification') {
        await fetchPlan();
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setStarting(false);
    }
  }, [userId, fetchPlan]);

  return { plan, loading, starting, error, initPlan, refetch: fetchPlan };
}
