import Sidebar from '../../dashboard/components/Sidebar';
import TutorHistorySidebar from '../components/TutorHistorySidebar';
import TutorWelcome from '../components/TutorWelcome';
import TutorChatMessages from '../components/TutorChatMessages';
import TutorInputBar from '../components/TutorInputBar';
import { useAITutor } from '../hooks/useAITutor';
import { useUser } from '../../../context/UserContext';
import '../styles/aiTutor.css';

export default function AITutorPage({ onNavigate }) {
  const { userId } = useUser();
  const {
    history,
    historyLoading,
    activeChat,
    messages,
    isTyping,
    error,
    startNewChat,
    selectChat,
    sendMessage,
    deleteChat,
  } = useAITutor(userId);

  return (
    <div className="tutor-layout">
      {/* Global Sidebar */}
      <Sidebar activePage="ai-tutor" onNavigate={onNavigate} />

      <div className="tutor-main">
        {/* Top Bar */}
        <header className="tutor-topbar">
          <div className="tutor-topbar-left">
            <div className="tutor-topbar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4"/>
                <path d="M2 20c0-4 4.5-7 10-7s10 3 10 7"/>
              </svg>
            </div>
            <div>
              <div className="tutor-topbar-title">AI Tutor</div>
              <div className="tutor-topbar-subtitle">
                {activeChat ? (
                  <>Chat: <strong style={{ color: 'var(--accent-1)' }}>{activeChat.title}</strong></>
                ) : (
                  <>New Chat · <span style={{ color: 'var(--text-muted)' }}>Ask anything about your coursework</span></>
                )}
              </div>
            </div>
          </div>

          <div className="tutor-topbar-right">
            <button className="tutor-new-btn" onClick={startNewChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Chat
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="tutor-body">
          <TutorHistorySidebar
            history={history}
            historyLoading={historyLoading}
            activeChat={activeChat}
            onSelect={selectChat}
            onNew={startNewChat}
            onDelete={deleteChat}
          />

          <div className="tutor-chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="tutor-messages" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠ {error}
                </div>
              )}

              {messages.length === 0
                ? <TutorWelcome onSuggestion={sendMessage} />
                : <TutorChatMessages messages={messages} isTyping={isTyping} />
              }
            </div>

            <TutorInputBar onSend={sendMessage} disabled={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
}
