import React from 'react';

interface TypingIndicatorProps {
  typingUsers: { userId: string; fullName: string }[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0].fullName} đang nhập`
      : typingUsers.length === 2
        ? `${typingUsers[0].fullName} và ${typingUsers[1].fullName} đang nhập`
        : `${typingUsers[0].fullName} và ${typingUsers.length - 1} người khác đang nhập`;

  return (
    <div className="typing-indicator-wrapper" aria-live="polite" aria-label={label}>
      <div className="typing-indicator-content">
        <span className="typing-indicator-label">{label}</span>
        <span className="typing-dots" aria-hidden="true">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </span>
      </div>
    </div>
  );
};
