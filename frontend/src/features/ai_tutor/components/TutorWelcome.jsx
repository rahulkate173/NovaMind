export default function TutorWelcome({ onSuggestion }) {
  return (
    <div className="tutor-welcome">
      <div className="tutor-welcome-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4"/>
          <path d="M2 20c0-4 4.5-7 10-7s10 3 10 7"/>
        </svg>
      </div>

      <h2 className="tutor-welcome-title">Your AI Tutor is ready</h2>
      <p className="tutor-welcome-sub">
        Ask any concept, request an explanation, or type <strong>/today</strong> to get a complete conceptual breakdown and walkthrough of your tasks for today.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <button
          className="tutor-suggestion-chip"
          style={{
            background: 'var(--accent-gradient)',
            color: 'white',
            borderColor: 'transparent',
            padding: '10px 20px',
            fontSize: '13.5px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          }}
          onClick={() => onSuggestion('/today')}
        >
          ✨ /today — Explain all my tasks for today
        </button>
      </div>
    </div>
  );
}
