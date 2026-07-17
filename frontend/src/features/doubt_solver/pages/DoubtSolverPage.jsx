import ReactMarkdown from 'react-markdown';
import Sidebar from '../../dashboard/components/Sidebar';
import DoubtHistoryPanel from '../components/DoubtHistoryPanel';
import DoubtWelcome from '../components/DoubtWelcome';
import DoubtInputBar from '../components/DoubtInputBar';
import { useDoubtSolver } from '../hooks/useDoubtSolver';
import { useUser } from '../../../context/UserContext';
import '../styles/doubtSolver.css';

export default function DoubtSolverPage({ onNavigate }) {
  const { userId } = useUser();
  const {
    history,
    historyLoading,
    activeDoubt,
    answer,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    askDoubt,
    selectHistoryItem,
  } = useDoubtSolver(userId);

  const handleCategory = (cat) => {
    askDoubt(`I need help with ${cat}. Can you start with the most important concepts?`, cat);
  };

  return (
    <div className="doubt-layout">
      {/* Global Sidebar */}
      <Sidebar activePage="doubt" onNavigate={onNavigate} />

      <div className="doubt-main">
        {/* Top Bar */}
        <header className="doubt-topbar">
          <div className="doubt-topbar-left">
            <div className="doubt-topbar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <circle cx="12" cy="17" r="0.5" fill="white"/>
              </svg>
            </div>
            <div>
              <div className="doubt-topbar-title">Doubt Solver</div>
              <div className="doubt-topbar-subtitle">
                {historyLoading
                  ? 'Loading doubts…'
                  : `${history.length} doubt${history.length !== 1 ? 's' : ''} · AI-powered instant answers`}
              </div>
            </div>
          </div>

          <div className="doubt-topbar-right">
            <div className="doubt-filter-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filter
            </div>

            <button className="doubt-ask-btn" onClick={() => askDoubt('Give me a quick revision on Data Structures fundamentals.')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ask Doubt
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="doubt-body">
          <DoubtHistoryPanel
            history={history}
            activeDoubt={activeDoubt}
            onSelect={selectHistoryItem}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            isLoading={historyLoading}
          />

          <div className="doubt-content">
            <div className="doubt-thread">
              {!activeDoubt && !isLoading
                ? <DoubtWelcome onCategory={handleCategory} />
                : (
                  <>
                    {/* Question Block */}
                    {activeDoubt && (
                      <div className="doubt-question-block">
                        <div className="doubt-question-header">
                          <div className="doubt-user-avatar">S</div>
                          <span className="doubt-question-label">Your Question</span>
                          <span className="doubt-question-time">{activeDoubt.date}</span>
                        </div>
                        <div className="doubt-question-text">{activeDoubt.question}</div>
                      </div>
                    )}

                    {/* Error */}
                    {error && !isLoading && (
                      <div className="doubt-answer-block" style={{ borderColor: 'var(--error, #ef4444)' }}>
                        <div className="doubt-answer-header">
                          <span style={{ color: 'var(--error, #ef4444)', fontSize: 13 }}>⚠ {error}</span>
                        </div>
                      </div>
                    )}

                    {/* Loading dots */}
                    {isLoading && (
                      <div className="doubt-answer-block" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="doubt-ai-avatar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <circle cx="12" cy="17" r="0.5" fill="white"/>
                          </svg>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: 'var(--text-muted)',
                              display: 'inline-block',
                              animation: `typingBounce 1.2s ${i * 0.2}s infinite ease-in-out`,
                            }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer Block — rendered with react-markdown */}
                    {answer && !isLoading && (
                      <div className="doubt-answer-block">
                        <div className="doubt-answer-header">
                          <div className="doubt-ai-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                              <circle cx="12" cy="17" r="0.5" fill="white"/>
                            </svg>
                          </div>
                          <span className="doubt-answer-label">NovaMind AI</span>
                          <span className="doubt-answer-badge">Solved</span>
                        </div>

                        {/* ✅ react-markdown renders the AI answer */}
                        <div className="doubt-answer-text doubt-markdown">
                          <ReactMarkdown>{answer}</ReactMarkdown>
                        </div>

                        <div className="doubt-answer-actions">
                          <button className="doubt-action-btn helpful">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                            Helpful
                          </button>
                          <button className="doubt-action-btn" onClick={() => askDoubt(activeDoubt?.question, activeDoubt?.category)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                            </svg>
                            Ask Again
                          </button>
                          <button className="doubt-action-btn" onClick={() => navigator.clipboard?.writeText(answer)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )
              }
            </div>

            {/* Input */}
            <DoubtInputBar onAsk={askDoubt} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
