/**
 * QuizResult – Full-screen overlay showing the score after quiz submission.
 * Shows: animated score ring, pass/fail badge, weak topics, replan notice.
 */
export default function QuizResult({ result, onClose, onRetry }) {
  if (!result) return null;

  const { score, passed, weakTopics = [], title, replanTriggered } = result;

  // SVG ring math
  const R  = 56;
  const C  = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score));
  const offset = C - (pct / 100) * C;

  const emoji = passed ? '🎉' : '📚';

  return (
    <div className="quiz-result-overlay">
      <div className="quiz-result-card">

        {/* Animated score ring */}
        <div className="quiz-score-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle className="quiz-score-ring-track" cx="70" cy="70" r={R} />
            <circle
              className={`quiz-score-ring-fill ${passed ? 'passed' : 'failed'}`}
              cx="70" cy="70" r={R}
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="quiz-score-center">
            <span className={`quiz-score-pct ${passed ? 'passed' : 'failed'}`}>
              {score}%
            </span>
            <span className="quiz-score-label">Score</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="quiz-result-title">{emoji} {title}</h2>

        {/* Pass / Fail badge */}
        <span className={`quiz-result-pass-badge ${passed ? 'passed' : 'failed'}`}>
          {passed ? '✓ Passed' : '✗ Needs Review'}
        </span>

        {/* Description */}
        <p className="quiz-result-subtitle">
          {passed
            ? 'Great work! You\'ve demonstrated solid understanding of this topic.'
            : 'Don\'t worry — review the weak areas and try again to strengthen your knowledge.'}
        </p>

        {/* Weak topics */}
        {weakTopics.length > 0 && (
          <div className="quiz-weak-topics">
            <div className="quiz-weak-topics-title">⚠️ Review these topics</div>
            <div className="quiz-weak-chips">
              {weakTopics.map((t) => (
                <span key={t} className="quiz-weak-chip">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Replan notice */}
        {replanTriggered && (
          <div className="quiz-replan-notice">
            🔄 <span>Your learning plan has been adjusted to add remedial tasks for the weak areas identified.</span>
          </div>
        )}

        {/* Actions */}
        <div className="quiz-result-actions">
          <button className="quiz-result-back-btn" onClick={onClose}>
            Back to Quizzes
          </button>
          {!passed && onRetry && (
            <button className="quiz-result-next-btn" onClick={onRetry}>
              Retry Quiz
            </button>
          )}
          {passed && (
            <button className="quiz-result-next-btn" onClick={onClose}>
              Next Quiz →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
