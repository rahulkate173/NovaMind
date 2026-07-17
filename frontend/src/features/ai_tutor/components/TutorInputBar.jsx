import { useState, useRef } from 'react';

export default function TutorInputBar({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    // Auto-grow
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    }
  };

  return (
    <div className="tutor-input-bar">
      <div className="tutor-input-wrap">
        <textarea
          ref={textareaRef}
          className="tutor-input"
          placeholder="Ask your AI Tutor anything… (Shift+Enter for new line)"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        <button
          className="tutor-send-btn"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          title="Send"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <p className="tutor-input-hint">
        AI Tutor can make mistakes. Cross-check important information.
      </p>
    </div>
  );
}
