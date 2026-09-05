import React from 'react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥'];

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
  reactions,
  onToggleReaction,
  savedMessageIds,
  onToggleSaved,
  searchQuery,
}) => {
  if (!activeRoom) {
    return (
      <main className="chat-main">
        <div className="empty-chat">Select a conversation to get started</div>
      </main>
    );
  }

  const title = selectedGroup ? `# ${selectedGroup.name}` : selectedFriend?.username || 'Conversation';
  const description = selectedGroup ? 'Project discussion and updates' : 'Direct message';
  const visibleMessages = messages.filter((message) => message.content?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main className="chat-main">
      <header className="chat-header">
        <div className="chat-heading">
          <h1 className="chat-title">{title}</h1>
          <span className="chat-description">{description}</span>
        </div>
        <div className="chat-actions">
          <button type="button" className="icon-btn" aria-label="Saved messages" title="Saved messages">🔖{savedMessageIds.length ? <sup>{savedMessageIds.length}</sup> : null}</button>
          <button type="button" className="icon-btn" aria-label="Conversation info">ⓘ</button>
          <button type="button" className="icon-btn" aria-label="More actions">⋯</button>
        </div>
      </header>

      <section className="message-area" aria-label="Messages">
        <div className="date-divider">TODAY</div>

        {visibleMessages.length === 0 && <div className="empty-chat">No messages match your search.</div>}
        {visibleMessages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          const senderName = isMe ? user.username : (selectedFriend?.username || 'Member');
          const timeString = formatIndianTime(msg.updated_at || msg.created_at);
          const isSeen = Boolean(msg.read_by?.length);

          return (
            <article key={msg.id || idx} className={`message-row ${isMe ? 'outgoing' : ''}`}>
              {!isMe && (
                <span className="avatar md" style={{ background: '#5878b8' }} aria-hidden="true">
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
                      <button
                        type="button"
                        className="message-menu"
                        aria-label="Message actions"
                        onClick={() => startEditing(msg)}
                        title="Edit message"
                      >⋯</button>
                    </div>
                  )}
                </div>

                <div className="message-enhancements">
                  <div className="reaction-tray" aria-label="Add reaction">
                    {QUICK_REACTIONS.map((emoji) => <button type="button" className={`reaction-button ${reactions[msg.id]?.[emoji]?.includes(user.id) ? 'reacted' : ''}`} key={emoji} onClick={() => onToggleReaction(msg.id, emoji)} aria-label={`React with ${emoji}`}>{emoji}{reactions[msg.id]?.[emoji]?.length ? <span>{reactions[msg.id][emoji].length}</span> : null}</button>)}
                  </div>
                  <button type="button" className={`save-button ${savedMessageIds.includes(msg.id) ? 'saved' : ''}`} onClick={() => onToggleSaved(msg.id)} aria-label="Save message" title="Save message">{savedMessageIds.includes(msg.id) ? '🔖 Saved' : '🔖 Save'}</button>
                </div>

                {isMe && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button type="button" className="link-btn" onClick={() => startEditing(msg)}>Edit</button>
                    <button type="button" className="link-btn" style={{ marginLeft: 10 }} onClick={() => deleteMessage(msg.id)}>Delete</button>
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
            Editing message
            <button type="button" className="link-btn" onClick={() => { setEditingMessageId(null); setInputMessage(''); }}>Cancel</button>
          </div>
        )}
        {selectedFile && (
          <div className="file-bar">
            {selectedFile.name}
            <button type="button" className="link-btn" onClick={() => setSelectedFile(null)}>Remove</button>
          </div>
        )}

        <form className="composer-form" onSubmit={handleSendMessage}>
          <button
            type="button"
            className="attach-btn"
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={Boolean(editingMessageId)}
          >+
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
          <input
            className="composer-input"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={`Message ${title}…`}
            aria-label="Message"
          />
          <button type="submit" className="send-btn" disabled={!inputMessage.trim() && !selectedFile}>
            {editingMessageId ? 'Update' : 'Send'}
          </button>
        </form>
      </footer>
    </main>
  );
};

export default ChatArea;
