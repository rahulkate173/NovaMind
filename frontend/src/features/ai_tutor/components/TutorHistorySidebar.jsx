import React from 'react';

export default function TutorHistorySidebar({ history, historyLoading, activeChat, onSelect, onNew, onDelete }) {
  return (
    <aside className="tutor-sidebar">
      <div className="tutor-sidebar-header" style={{ display: 'flex', alignItems: 'center', justify: 'space-between', padding: '14px 16px' }}>
        <span className="tutor-sidebar-label" style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Chat History
        </span>
        <button
          onClick={onNew}
          style={{
            background: 'var(--accent-gradient)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Start a new chat"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      <div className="tutor-topic-list" style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
        {historyLoading && (
          <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Loading history...
          </div>
        )}

        {!historyLoading && history.length === 0 && (
          <div style={{ padding: '24px 12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.6' }}>
            No previous chats.<br />Ask a question below to start learning!
          </div>
        )}

        {!historyLoading && history.map(item => {
          const isActive = activeChat && activeChat.id === item.id;
          return (
            <div
              key={item.id}
              className={`tutor-topic-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '2px',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, marginRight: '8px' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '500',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isActive ? 'var(--accent-1)' : 'var(--text-secondary)'
                }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.date}
                </span>
              </div>

              <button
                onClick={(e) => onDelete(item.id, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: isActive ? 0.8 : 0.4,
                  transition: 'opacity 0.2s',
                }}
                title="Delete chat"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
