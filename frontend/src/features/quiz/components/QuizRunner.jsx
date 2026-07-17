/**
 * QuizRunner – Modal overlay for an active quiz session.
 * Renders questions one at a time. Supports MCQ (radio) and short_answer (textarea).
 * Shows progress bar. Submit sends results to Python agent + MongoDB.
 */
export default function QuizRunner({
  quiz,
  currentIndex,
  answers,
  submitting,
  error,
  onAnswer,
  onNext,
  onPrev,
  onSubmit,
  onClose,
}) {
  if (!quiz) return null;

  const questions = quiz.questions ?? [];
  const total     = questions.length;
  const q         = questions[currentIndex];
  const isLast    = currentIndex === total - 1;
  const isFirst   = currentIndex === 0;
  const answered  = answers[q?.id] !== undefined && answers[q?.id] !== '';

  // Progress: how many have an answer
  const answeredCount = questions.filter(question => answers[question.id]).length;
  const progressPct   = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const LETTER = ['A', 'B', 'C', 'D', 'E'];

  if (!q) return null;

  return (
    <div className="quiz-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="quiz-modal">

        {/* Header */}
        <div className="quiz-modal-header">
          <div className="quiz-modal-title-block">
            <div className="quiz-modal-label">Quiz Session</div>
            <h3 className="quiz-modal-title">{quiz.title}</h3>
          </div>
          <button className="quiz-modal-close" onClick={onClose} title="Close quiz">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="quiz-progress-section">
          <div className="quiz-progress-meta">
            <span>Question {currentIndex + 1} of {total}</span>
            <span>{answeredCount}/{total} answered</span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="quiz-question-area">
          <div className="quiz-question-chip">
            {q.type === 'mcq' ? '🔘 Multiple Choice' : '✍️ Short Answer'}
          </div>

          <p className="quiz-question-prompt">{q.prompt}</p>

          {/* MCQ */}
          {q.type === 'mcq' && q.options?.length > 0 && (
            <div className="quiz-options-list">
              {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <button
                    key={idx}
                    className={`quiz-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => onAnswer(q.id, opt)}
                  >
                    <span className="quiz-option-letter">{LETTER[idx] || idx + 1}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer */}
          {q.type === 'short_answer' && (
            <textarea
              className="quiz-short-answer"
              placeholder="Type your answer here…"
              value={answers[q.id] ?? ''}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              rows={4}
            />
          )}

          {/* MCQ with no options — treat as short answer */}
          {q.type === 'mcq' && (!q.options || q.options.length === 0) && (
            <textarea
              className="quiz-short-answer"
              placeholder="Type your answer here…"
              value={answers[q.id] ?? ''}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              rows={3}
            />
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="quiz-modal-footer">
          <div className="quiz-nav-btns">
            <button
              className="quiz-nav-btn"
              onClick={onPrev}
              disabled={isFirst}
            >
              ← Prev
            </button>
            {!isLast && (
              <button
                className="quiz-nav-btn"
                onClick={onNext}
              >
                Next →
              </button>
            )}
          </div>

          {isLast && (
            <button
              className="quiz-submit-btn"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                       style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Submit Quiz
                </>
              )}
            </button>
          )}

          {!isLast && answeredCount === total && (
            <button
              className="quiz-submit-btn"
              onClick={onSubmit}
              disabled={submitting}
            >
              Submit All →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
