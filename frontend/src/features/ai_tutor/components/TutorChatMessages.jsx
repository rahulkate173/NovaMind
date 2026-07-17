import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function TutorChatMessages({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <>
      {messages.map(msg => (
        <div key={msg.id} className={`tutor-message ${msg.role}`}>
          <div className={`tutor-msg-avatar ${msg.role}`}>
            {msg.role === 'ai'
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4"/><path d="M2 20c0-4 4.5-7 10-7s10 3 10 7"/></svg>
              : 'S'
            }
          </div>
          <div className={`tutor-msg-content ${msg.role}`}>
            <div className="tutor-msg-bubble">
              {msg.role === 'ai' ? (
                <div className="tutor-markdown">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.content}</p>
              )}
            </div>
            <div className="tutor-msg-time">{msg.time}</div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="tutor-typing">
          <div className="tutor-msg-avatar ai" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--quick-tutor-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4"/><path d="M2 20c0-4 4.5-7 10-7s10 3 10 7"/></svg>
          </div>
          <div className="tutor-typing-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </>
  );
}
