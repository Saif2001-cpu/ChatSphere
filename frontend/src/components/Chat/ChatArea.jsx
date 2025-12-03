import React from 'react';
import { Col, Form, InputGroup, Button, Image, Dropdown } from 'react-bootstrap';

// This component receives message handlers and data as props
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
}) => {

  if (!activeRoom) {
    return (
      <Col md={9} className="p-0 d-flex flex-column bg-white h-100">
        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
          <h4>Select a chat to start</h4>
        </div>
      </Col>
    );
  }

  return (
    <Col md={9} className="p-0 d-flex flex-column bg-white h-100">
      {/* Chat Header */}
      <div className="p-3 border-bottom shadow-sm" style={{ flexShrink: 0 }}>
        <h5 className="m-0">
          {selectedGroup ? `# ${selectedGroup.name}` : selectedFriend?.username}
        </h5>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          const timeString = formatIndianTime(msg.updated_at || msg.created_at);
          
          const hasRead = msg.read_by && msg.read_by.length > 0;
          const isSeen = hasRead; 

          return (
            <div key={idx} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`p-3 rounded shadow-sm position-relative ${isMe ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '70%' }}>
                {msg.image_url && <Image src={msg.image_url} fluid rounded className="mb-2" style={{maxHeight:'200px'}} />}
                <div>{msg.content}</div>
                <div className={`d-flex justify-content-end align-items-center mt-1 small ${isMe ? 'text-white-50' : 'text-muted'}`}>
                   <span className="me-2">
                      {msg.updated_at && <span className="fst-italic me-1">(Edited)</span>}
                      {timeString}
                      {isMe && (
                          <span className="ms-1 fw-bold" style={{fontSize: '0.8rem'}}>
                              {isSeen ? <span className="text-info">✓✓</span> : <span>✓</span>}
                          </span>
                      )}
                   </span>
                   {isMe && (
                      <Dropdown drop="start">
                        <Dropdown.Toggle as="div" bsPrefix="p-0" style={{cursor: 'pointer', lineHeight: 0}}>⋮</Dropdown.Toggle>
                        <Dropdown.Menu size="sm">
                          <Dropdown.Item onClick={() => startEditing(msg)}>Edit</Dropdown.Item>
                          <Dropdown.Item onClick={() => deleteMessage(msg.id)} className="text-danger">Delete</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                   )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-light border-top" style={{ flexShrink: 0 }}>
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
            <div className="text-muted small mb-2 fst-italic ms-2" style={{height: '20px'}}>
                {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`
                }
            </div>
        )}

        {editingMessageId && <div className="bg-warning-subtle p-2 mb-2 rounded small">Editing... <Button variant="link" size="sm" onClick={() => {setEditingMessageId(null); setInputMessage("")}}>Cancel</Button></div>}
        {selectedFile && <div className="mb-2 small">{selectedFile.name} <Button variant="link" onClick={() => setSelectedFile(null)}>✕</Button></div>}
        
        <Form onSubmit={handleSendMessage}>
          <InputGroup>
            <Button variant="outline-secondary" onClick={() => fileInputRef.current.click()} disabled={!!editingMessageId}>📎</Button>
            <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileChange} />
            <Form.Control value={inputMessage} onChange={handleInputChange} placeholder="Type a message..." />
            <Button variant={editingMessageId ? "success" : "primary"} type="submit">{editingMessageId ? "Update" : "Send"}</Button>
          </InputGroup>
        </Form>
      </div>
    </Col>
  );
};

export default ChatArea;