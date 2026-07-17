export default function DoubtHistoryPanel({
  history,
  activeDoubt,
  onSelect,
  searchQuery,
  onSearch,
  isLoading = false,
}) {
  return (
    <aside className="doubt-history">
      <div className="doubt-history-header">
        <div className="doubt-history-label">Recent Doubts</div>

        <div className="doubt-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="doubt-search-input"
            placeholder="Search doubts…"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="doubt-history-list">
        {/* Loading skeleton */}
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="doubt-history-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div style={{
              height: 12, borderRadius: 6,
              background: 'var(--border)', marginBottom: 8,
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
            <div style={{
              height: 10, width: '60%', borderRadius: 6,
              background: 'var(--border)',
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
          </div>
        ))}

        {/* Empty state */}
        {!isLoading && history.length === 0 && (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No doubts yet. Ask your first question!
          </div>
        )}

        {/* History items */}
        {!isLoading && history.map(item => (
          <div
            key={item.id}
            className={`doubt-history-item ${activeDoubt?.id === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item)}
          >
            <div className="doubt-history-q">{item.question}</div>
            <div className="doubt-history-meta">
              <span className={`doubt-history-tag ${item.tag}`}>{item.tag}</span>
              <span className="doubt-history-date">{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
