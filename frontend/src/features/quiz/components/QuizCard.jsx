/**
 * QuizCard – Displays a single quiz as a numbered card.
 * Shows: Quiz N, title, topics, question count, status badge.
 * Clicking fires onStart(quiz).
 */
export default function QuizCard({ quiz, index, onStart }) {
  const {
    title       = 'Quiz',
    topics      = [],
    questions   = [],
    completed   = false,
    due_reason  = '',
  } = quiz;

  const qCount = questions.length;

  return (
    <div className={`quiz-card animate-in ${completed ? 'completed' : ''}`}
         style={{ animationDelay: `${index * 0.06}s` }}>

      {/* Top row: number badge + status */}
      <div className="quiz-card-top">
        <div className="quiz-card-number">
          <div className="quiz-card-num-badge">{index + 1}</div>
          <div>
            <div className="quiz-card-label">Quiz</div>
            <div className="quiz-card-num-text">#{index + 1}</div>
          </div>
        </div>

        <span className={`quiz-status-badge ${completed ? 'done' : 'pending'}`}>
          {completed ? '✓ Done' : 'Pending'}
        </span>
      </div>

      {/* Title */}
      <h3 className="quiz-card-title">{title}</h3>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="quiz-card-topics">
          {topics.slice(0, 4).map((t) => (
            <span key={t} className="quiz-card-topic-chip">{t}</span>
          ))}
          {topics.length > 4 && (
            <span className="quiz-card-topic-chip">+{topics.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="quiz-card-footer">
        <span className="quiz-card-meta">
          📋 {qCount} question{qCount !== 1 ? 's' : ''}
        </span>

        {!completed ? (
          <button
            className="quiz-card-start-btn"
            onClick={() => onStart(quiz)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
            </svg>
            Start Quiz
          </button>
        ) : (
          <span style={{ fontSize: '13px', color: '#22c984', fontWeight: 600 }}>
            ✓ Completed
          </span>
        )}
      </div>

      {/* Due reason tooltip */}
      {due_reason && !completed && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          lineHeight: 1.4,
        }}>
          💡 {due_reason}
        </div>
      )}
    </div>
  );
}
