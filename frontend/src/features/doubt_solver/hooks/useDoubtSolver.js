import { useState, useCallback, useEffect } from 'react';
import {
  getDoubtAnswer,
  fetchDoubtHistory,
  fetchDoubtById,
} from '../services/doubtSolverService';

// ── Helper: format a MongoDB ISO date to a readable label ──────
function formatDate(iso) {
  const d     = new Date(iso);
  const now   = new Date();
  const diff  = Math.floor((now - d) / 1000);

  if (diff < 60)                  return 'Just now';
  if (diff < 3600)                return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)               return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800)              return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function useDoubtSolver(userId) {
  const [history, setHistory]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [answer, setAnswer]           = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError]             = useState(null);

  // ── Load history from MongoDB on mount ──────────────────────
  useEffect(() => {
    if (userId === undefined) return;
    setHistoryLoading(true);
    fetchDoubtHistory(userId)
      .then((doubts) => {
        setHistory(
          doubts.map((d) => ({
            id      : d._id,
            question: d.question,
            category: d.category,
            tag     : d.tag,
            date    : formatDate(d.createdAt),
          }))
        );
      })
      .catch((err) => console.warn('[useDoubtSolver] history load failed:', err.message))
      .finally(() => setHistoryLoading(false));
  }, [userId]);

  // ── Ask a new doubt ─────────────────────────────────────────
  const askDoubt = useCallback(async (question, category = 'General') => {
    if (!question.trim()) return;

    setIsLoading(true);
    setAnswer(null);
    setError(null);

    // Optimistic placeholder while waiting for server
    const placeholder = {
      id      : `tmp-${Date.now()}`,
      question: question.trim(),
      category,
      tag     : 'pending',
      date    : 'Just now',
    };
    setHistory(prev => [placeholder, ...prev]);
    setActiveDoubt(placeholder);

    try {
      const result = await getDoubtAnswer(question, category, userId);
      // result: { id, answer, category, tag, createdAt }

      const resolved = {
        id      : result.id,
        question: question.trim(),
        category: result.category,
        tag     : result.tag,
        date    : 'Just now',
      };

      setAnswer(result.answer);
      setHistory(prev =>
        prev.map(d => d.id === placeholder.id ? resolved : d)
      );
      setActiveDoubt(resolved);
    } catch (err) {
      setError(err.message);
      // Remove the placeholder on error
      setHistory(prev => prev.filter(d => d.id !== placeholder.id));
      setActiveDoubt(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ── Select a history item and load its answer ───────────────
  const selectHistoryItem = useCallback(async (item) => {
    setActiveDoubt(item);
    setAnswer(null);
    setError(null);

    try {
      const doubt = await fetchDoubtById(item.id);
      // Find the AI message in the thread
      const aiMsg = doubt.messages?.find(m => m.role === 'ai');
      if (aiMsg) setAnswer(aiMsg.content);
    } catch (err) {
      setError('Could not load this doubt.');
    }
  }, []);

  const filteredHistory = history.filter(h =>
    h.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    history      : filteredHistory,
    historyLoading,
    activeDoubt,
    answer,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    askDoubt,
    selectHistoryItem,
  };
}
