import { useState, useCallback } from 'react';
import { submitQuiz, saveQuizResultToDb } from '../../../services/api';

/**
 * useQuizSession – Manages the state of an active quiz attempt.
 *
 * Flow:
 *  1. User selects a quiz → call `openQuiz(quiz)`
 *  2. Answer each question → call `answerQuestion(qId, answer)`
 *  3. Navigate questions → `nextQuestion()` / `prevQuestion()`
 *  4. Submit → `submitQuizSession(userId)` → sends to Python agent + MongoDB
 *  5. `result` is populated → show QuizResult
 *
 * @param {Function} onCompleted - called with (quizId) after successful submit
 */
export function useQuizSession(onCompleted) {
  const [activeQuiz, setActiveQuiz]         = useState(null);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [answers, setAnswers]               = useState({});  // { questionId: answerText }
  const [submitting, setSubmitting]         = useState(false);
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState(null);

  /** Open a quiz and reset state */
  const openQuiz = useCallback((quiz) => {
    setActiveQuiz(quiz);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }, []);

  /** Close/dismiss without submitting */
  const closeQuiz = useCallback(() => {
    setActiveQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }, []);

  /** Record an answer for a question */
  const answerQuestion = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (!activeQuiz) return;
    setCurrentIndex(i => Math.min(i + 1, (activeQuiz.questions?.length ?? 1) - 1));
  }, [activeQuiz]);

  const prevQuestion = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  /**
   * Calculate score and submit to both Python agent and MongoDB.
   * Scoring: MCQ questions with answer_hint are auto-graded.
   * Short-answer: each answered question counts as correct.
   */
  const submitQuizSession = useCallback(async (userId) => {
    if (!activeQuiz || !userId) return;
    setSubmitting(true);
    setError(null);

    try {
      const questions = activeQuiz.questions ?? [];

      // ── Auto-grade ────────────────────────────────────────
      let correct = 0;
      const gradedAnswers = questions.map(q => {
        const userAnswer = answers[q.id] ?? '';
        let isCorrect = null;

        if (q.type === 'mcq' && q.answer_hint) {
          // Try to match answer hint (could be option text or index)
          const hint = String(q.answer_hint).trim().toLowerCase();
          const ua   = String(userAnswer).trim().toLowerCase();
          isCorrect  = ua === hint || ua.includes(hint) || hint.includes(ua);
        } else if (q.type === 'short_answer') {
          // Count as correct if user wrote anything (graded by agent)
          isCorrect = userAnswer.trim().length > 0 ? null : false;
        }

        if (isCorrect) correct++;
        return { questionId: q.id, prompt: q.prompt, answer: userAnswer, correct: isCorrect };
      });

      // Score as percentage of auto-gradeable MCQs, or 100 for short-answer
      const mcqQuestions = questions.filter(q => q.type === 'mcq' && q.answer_hint);
      let score;
      if (mcqQuestions.length > 0) {
        const mcqAnswered = gradedAnswers.filter(
          a => mcqQuestions.some(q => q.id === a.questionId)
        );
        const mcqCorrect = mcqAnswered.filter(a => a.correct === true).length;
        score = Math.round((mcqCorrect / mcqQuestions.length) * 100);
      } else {
        // All short-answer: score 100 if all answered, else proportional
        const answered = gradedAnswers.filter(a => a.answer.trim()).length;
        score = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 100;
      }

      const weakTopics = score < 70 ? (activeQuiz.topics ?? []) : [];
      const passed     = score >= 70;

      // ── Submit to Python agent (source of truth) ──────────
      let agentResult = {};
      try {
        agentResult = await submitQuiz({
          user_id:     userId,
          task_id:     activeQuiz.task_id,
          score,
          weak_topics: weakTopics,
        });
      } catch (agentErr) {
        console.warn('Python agent submit failed (will still save to DB):', agentErr.message);
      }

      // ── Save to MongoDB (permanent record) ────────────────
      try {
        await saveQuizResultToDb({
          userId,
          quizId:     activeQuiz.quiz_id,
          taskId:     activeQuiz.task_id,
          title:      activeQuiz.title,
          topics:     activeQuiz.topics ?? [],
          score,
          passed,
          weakTopics,
          answers:    gradedAnswers,
          week:       activeQuiz.week ?? 1,
        });
      } catch (dbErr) {
        console.warn('MongoDB save failed (non-critical):', dbErr.message);
      }

      const sessionResult = {
        score,
        passed,
        weakTopics,
        quizId:         activeQuiz.quiz_id,
        taskId:         activeQuiz.task_id,
        title:          activeQuiz.title,
        total:          questions.length,
        correct,
        replanTriggered: agentResult.replan_triggered ?? false,
      };

      setResult(sessionResult);
      if (onCompleted) onCompleted(activeQuiz.quiz_id);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [activeQuiz, answers, onCompleted]);

  return {
    activeQuiz,
    currentIndex,
    answers,
    submitting,
    result,
    error,
    openQuiz,
    closeQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitQuizSession,
  };
}
