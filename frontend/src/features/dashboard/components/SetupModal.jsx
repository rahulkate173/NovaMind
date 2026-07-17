import { useState } from 'react';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/**
 * SetupModal – Shown when a user has no active learning plan yet.
 * Collects goal + skill level + hours/week and calls onSubmit.
 */
export default function SetupModal({ onSubmit, loading }) {
  const [goal, setGoal]    = useState('');
  const [level, setLevel]  = useState('Beginner');
  const [hours, setHours]  = useState(10);
  const [error, setError]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goal.trim()) { setError('Please enter your learning goal.'); return; }
    setError('');
    try {
      const res = await onSubmit({ goal: goal.trim(), current_level: level, available_hours_per_week: Number(hours) });
      if (res && res.status === 'awaiting_clarification' && res.clarification_question) {
        setError(`Clarification needed: ${res.clarification_question}`);
      }
    } catch (err) {
      if (err.message.includes('Internal Server Error') || err.message.includes('Failed to fetch')) {
        setError('Cannot connect to the Python backend on port 8000 (Internal Server Error). Please ensure `uvicorn main:app --reload --port 8000` is running inside `personal-learning-agent-backend` and not throwing errors.');
      } else {
        setError(err.message || 'An error occurred while generating your roadmap.');
      }
    }
  };

  return (
    <div className="setup-modal-overlay">
      <div className="setup-modal">
        {/* Header */}
        <div className="setup-modal-header">
          <div className="setup-modal-logo">🧠</div>
          <h2 className="setup-modal-title">Start Your Learning Journey</h2>
          <p className="setup-modal-sub">
            Tell NovaMind your goal and it will build a personalised roadmap for you.
          </p>
        </div>

        <form className="setup-modal-form" onSubmit={handleSubmit}>
          {/* Goal */}
          <div className="setup-field">
            <label className="setup-label" htmlFor="setup-goal">What do you want to learn?</label>
            <input
              id="setup-goal"
              className="setup-input"
              type="text"
              placeholder="e.g. Master React and Node.js, prepare for DSA interviews…"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Level */}
          <div className="setup-field">
            <label className="setup-label">Your current level</label>
            <div className="setup-level-row">
              {LEVELS.map(l => (
                <button
                  key={l}
                  type="button"
                  className={`setup-level-btn ${level === l ? 'active' : ''}`}
                  onClick={() => setLevel(l)}
                  disabled={loading}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Hours per week */}
          <div className="setup-field">
            <label className="setup-label" htmlFor="setup-hours">
              Hours available per week &nbsp;
              <strong style={{ color: 'var(--accent-1)' }}>{hours}h</strong>
            </label>
            <input
              id="setup-hours"
              className="setup-range"
              type="range"
              min={1}
              max={40}
              step={1}
              value={hours}
              onChange={e => setHours(e.target.value)}
              disabled={loading}
            />
            <div className="setup-range-labels">
              <span>1h</span><span>40h</span>
            </div>
          </div>

          {error && <p className="setup-error">{error}</p>}

          <button
            type="submit"
            className="setup-submit-btn"
            disabled={loading}
          >
            {loading ? 'Building your plan…' : '🚀 Generate My Roadmap'}
          </button>
        </form>
      </div>
    </div>
  );
}
