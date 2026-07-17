const CATEGORIES = [
  { name: 'DSA',        color: '#7c6af7', bg: 'rgba(124,106,247,0.12)' },
  { name: 'JavaScript', color: '#e9a84c', bg: 'rgba(233,168,76,0.12)'  },
  { name: 'React',      color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { name: 'Python',     color: '#22c984', bg: 'rgba(34,201,132,0.12)'  },
  { name: 'SQL',        color: '#dc5252', bg: 'rgba(220,82,82,0.12)'   },
  { name: 'System',     color: '#9d8bf4', bg: 'rgba(157,139,244,0.12)' },
];

export default function DoubtWelcome({ onCategory }) {
  return (
    <div className="doubt-welcome">
      <div className="doubt-welcome-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <circle cx="12" cy="17" r="0.5" fill="white"/>
        </svg>
      </div>

      <h2 className="doubt-welcome-title">What's your doubt?</h2>
      <p className="doubt-welcome-sub">
        Ask anything — concepts, errors, code reviews, or theory.
        Get clear, detailed answers instantly.
      </p>

      <div className="doubt-category-grid">
        {CATEGORIES.map(cat => (
          <div
            key={cat.name}
            className="doubt-category-card"
            onClick={() => onCategory(cat.name)}
          >
            <div
              className="doubt-category-icon"
              style={{ background: cat.bg }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: cat.color }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="doubt-category-name">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
