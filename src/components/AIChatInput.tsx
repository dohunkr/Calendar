import React, { useState } from 'react';
import './AIChatInput.css';

interface AIChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function AIChatInput({ onSend, isLoading }: AIChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-input-container">
      <div className="ai-input-wrapper">
        <textarea
          className="ai-input"
          placeholder="내일 오후 3시 팀 회의 잡아줘..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="ai-actions">
          <button className="ai-send-btn" onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? '...' : '전송'}
          </button>
        </div>
      </div>
      {isLoading && (
        <div className="ai-thinking">
          <span className="ai-dot"></span>
          <span className="ai-dot"></span>
          <span className="ai-dot"></span>
          AI가 생각중...
        </div>
      )}
    </div>
  );
}
