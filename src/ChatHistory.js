import React from 'react';

const ChatHistory = ({ sessions, currentId, onNewChat, onSelectChat }) => {
  return (
    <div className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>
      <div className="history-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`history-item ${session.id === currentId ? 'active' : ''}`}
            onClick={() => onSelectChat(session.id)}
          >
            {session.messages[0] ? session.messages[0].text.substring(0, 30) + '...' : 'New Chat'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;