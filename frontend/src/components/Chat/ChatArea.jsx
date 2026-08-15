import React from 'react';

const getInitial = (name = '?') => name.trim().charAt(0).toUpperCase();

const ChatArea = ({
  activeRoom,
  selectedFriend,
  selectedGroup,
  messages,
  user,
  typingUsers,
  inputMessage,
  editingMessageId,
  selectedFile,
  messagesEndRef,
  fileInputRef,
  formatIndianTime,
  handleInputChange,
  handleFileChange,
  handleSendMessage,
  startEditing,
  deleteMessage,
  setEditingMessageId,
  setInputMessage,
  setSelectedFile,
  onMobileBack,
}) => {
  if (!activeRoom) {
    return (
      <main className="chat-main chat-empty-state">
        <div className="empty-chat">
          <div>
            <strong>Select a conversation</strong>
            <span>Choose a chat from your messages to get started.</span>
          </div>
        </div>
      </main>
    );
  }

  const title = selectedGroup ? `# ${selectedGroup.name}` : selectedFriend?.username || 'Conversation';
  const description = selectedGroup ? 'Project discussion and updates' : 'Direct message';

  return (
    <main className="chat-main">
      <header className="chat-header">
        <button type="button" className="mobile-back-btn" aria-label="Back to conversations" onClick={onMobileBack}>‹</button>
        <div className="chat-heading">
          <div className="chat-peer-avatar avatar sm" aria-hidden="true">{selectedGroup ? '#' : getInitial(selectedFriend?.username || 'C')}</div>
          <div className="chat-heading-copy">
            <h1 className="chat-title">{title}</h1>
            <span className="chat-description">{description}</span>
          </div>
        </div>
        <div className="chat-actions">
          <button type="button" className="icon-btn" aria-label="Favorite">☆</button>
          <button type="button" className="icon-btn" aria-label="Conversation info">ⓘ</button>
          <button type="button" className="icon-btn" aria-label="More actions">⋯</button>
        </div>
      </header>

      <section className="message-area" aria-label="Messages">
        <div className="date-divider"><span>TODAY</span></div>

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          const senderName = isMe ? user.username : (selectedFriend?.username || 'Member');
          const timeString = formatIndianTime(msg.updated_at || msg.created_at);
          const isSeen = Boolean(msg.read_by?.length);

          return (
            <article key={msg.id || idx} className={`message-row ${isMe ? 'outgoing' : ''}`}>
              {!isMe && (
                <span className="avatar md message-avatar" aria-hidden="true">
                  {getInitial(senderName)}
                </span>
              )}

              <div className="message-content">
                <div className="message-meta" style={isMe ? { justifyContent: 'flex-end' } : undefined}>
                  <span className="message-author">{senderName}</span>
                  <span className="message-time">{timeString}</span>
                </div>

                <div className="message-bubble">
                  {msg.image_url && <img src={msg.image_url} alt="Attachment" className="message-image" />}
                  {msg.content && <div>{msg.content}</div>}
                  {isMe && (
                    <div className="message-status">
                      {msg.updated_at ? 'Edited · ' : ''}{timeString} {isSeen ? '✓✓' : '✓'}
                      <button type="button" className="message-menu" aria-label="Message actions" onClick={() => startEditing(msg)} title="Edit message">⋯</button>
                    </div>
                  )}
                </div>

                {isMe && (
                  <div className="message-actions">
                    <button type="button" className="link-btn" onClick={() => startEditing(msg)}>Edit</button>
                    <button type="button" className="link-btn" onClick={() => deleteMessage(msg.id)}>Delete</button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        <div ref={messagesEndRef} />
      </section>

      <footer className="composer">
        {typingUsers.length > 0 && (
          <div className="composer-notice">
            {typingUsers.length === 1 ? `${typingUsers[0].username} is typing…` : `${typingUsers.length} people are typing…`}
          </div>
        )}

        {editingMessageId && (
          <div className="editing-bar">
            <span>Editing message</span>
            <button type="button" className="link-btn" onClick={() => { setEditingMessageId(null); setInputMessage(''); }}>Cancel</button>
          </div>
        )}
        {selectedFile && (
          <div className="file-bar">
            <span>{selectedFile.name}</span>
            <button type="button" className="link-btn" onClick={() => setSelectedFile(null)}>Remove</button>
          </div>
        )}

        <form className="composer-form" onSubmit={handleSendMessage}>
          <button type="button" className="attach-btn" aria-label="Attach file" onClick={() => fileInputRef.current?.click()} disabled={Boolean(editingMessageId)}>+</button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
          <input className="composer-input" value={inputMessage} onChange={handleInputChange} placeholder={`Message ${title}…`} aria-label="Message" />
          <button type="submit" className="send-btn" disabled={!inputMessage.trim() && !selectedFile}>
            {editingMessageId ? 'Update' : 'Send'}
          </button>
        </form>
      </footer>
    </main>
  );
};

export default ChatArea;
