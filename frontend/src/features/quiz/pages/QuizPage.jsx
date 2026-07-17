import { useUser } from '../../../context/UserContext';
import Sidebar     from '../../dashboard/components/Sidebar';
import { useQuizzes }     from '../hooks/useQuizzes';
import { useQuizSession } from '../hooks/useQuizSession';
import QuizCard    from '../components/QuizCard';
import QuizRunner  from '../components/QuizRunner';
import QuizResult  from '../components/QuizResult';
import '../styles/quiz.css';

/* ── Skeleton loader ──────────────────────────────────────── */
function QuizCardSkeleton() {
  return (
    <div className="quiz-skeleton">
      <div className="quiz-skeleton-bar" style={{ height: 44, width: 44, borderRadius: 12 }} />
      <div className="quiz-skeleton-bar" style={{ height: 16, width: '70%' }} />
      <div className="quiz-skeleton-bar" style={{ height: 12, width: '50%' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="quiz-skeleton-bar" style={{ height: 24, width: 70, borderRadius: 20 }} />
        <div className="quiz-skeleton-bar" style={{ height: 24, width: 60, borderRadius: 20 }} />
      </div>
    </div>
  );
}

export default function QuizPage({ onNavigate }) {
  const { userId } = useUser();

  const {
    quizzes,
    loading,
    error,
    refetch,
    markCompleted,
  } = useQuizzes(userId);

  const {
    activeQuiz,
    currentIndex,
    answers,
    submitting,
    result,
    error: sessionError,
    openQuiz,
    closeQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitQuizSession,
  } = useQuizSession((quizId) => {
    // Mark this quiz as completed in local state after submission
    markCompleted(quizId);
  });

  const totalQuizzes   = quizzes.length;
  const doneQuizzes    = quizzes.filter(q => q.completed).length;
  const pendingQuizzes = totalQuizzes - doneQuizzes;

  const handleSubmit = () => submitQuizSession(userId);

  const handleRetry = () => {
    if (activeQuiz) openQuiz(activeQuiz);
  };

  return (
    <div className="quiz-layout">
      <Sidebar activePage="quiz" onNavigate={onNavigate} />

      <main className="quiz-main">

        {/* Header */}
        <div className="quiz-page-header">
          <div>
            <h1 className="quiz-page-title">Today's Quizzes</h1>
            <p className="quiz-page-subtitle">
              {loading
                ? 'Loading your quizzes…'
                : totalQuizzes > 0
                ? `${totalQuizzes} quiz${totalQuizzes !== 1 ? 'zes' : ''} assigned for today — test your knowledge!`
                : 'No quizzes today. Complete some study tasks to unlock them.'}
            </p>
          </div>

          <button className="quiz-refresh-btn" onClick={refetch} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                 style={loading ? { animation: 'spin 1s linear infinite' } : {}}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        {!loading && totalQuizzes > 0 && (
          <div className="quiz-stats-strip">
            <div className="quiz-stat-chip">
              <div className="quiz-stat-icon total">📋</div>
              <div>
                <div className="quiz-stat-label">Total</div>
                <div className="quiz-stat-value">{totalQuizzes}</div>
              </div>
            </div>
            <div className="quiz-stat-chip">
              <div className="quiz-stat-icon done">✓</div>
              <div>
                <div className="quiz-stat-label">Completed</div>
                <div className="quiz-stat-value">{doneQuizzes}</div>
              </div>
            </div>
            <div className="quiz-stat-chip">
              <div className="quiz-stat-icon pending">⏳</div>
              <div>
                <div className="quiz-stat-label">Remaining</div>
                <div className="quiz-stat-value">{pendingQuizzes}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: '14px',
          }}>
            ⚠️ {error}
            {error.toLowerCase().includes('not found') || error.includes('404')
              ? ' — Start or complete study tasks first to unlock today\'s quizzes.'
              : ' — Make sure the Python learning agent is running on port 8000.'}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="quiz-cards-grid">
            {[1, 2, 3].map(k => <QuizCardSkeleton key={k} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && totalQuizzes === 0 && (
          <div className="quiz-empty-state">
            <div className="quiz-empty-icon">🧩</div>
            <h3 className="quiz-empty-title">No quizzes yet</h3>
            <p className="quiz-empty-sub">
              Complete your daily study tasks first. Quizzes unlock once you make progress on the current day's plan.
            </p>
            <button
              className="quiz-card-start-btn"
              onClick={() => onNavigate && onNavigate('dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Quiz cards grid — N cards */}
        {!loading && !error && totalQuizzes > 0 && (
          <div className="quiz-cards-grid">
            {quizzes.map((quiz, i) => (
              <QuizCard
                key={quiz.quiz_id || quiz.task_id || i}
                quiz={quiz}
                index={i}
                onStart={openQuiz}
              />
            ))}
          </div>
        )}
      </main>

      {/* Quiz Runner Modal */}
      {activeQuiz && !result && (
        <QuizRunner
          quiz={activeQuiz}
          currentIndex={currentIndex}
          answers={answers}
          submitting={submitting}
          error={sessionError}
          onAnswer={answerQuestion}
          onNext={nextQuestion}
          onPrev={prevQuestion}
          onSubmit={handleSubmit}
          onClose={closeQuiz}
        />
      )}

      {/* Quiz Result Overlay */}
      {result && (
        <QuizResult
          result={result}
          onClose={closeQuiz}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
