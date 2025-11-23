import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { WS_URL } from '../api';
import { Container, Row, Col, ListGroup, Form, Button, Navbar, InputGroup, Modal, Image, Dropdown } from 'react-bootstrap';

// Helper to format date
const formatIndianTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const Chat = () => {
  const { user, token, logout } = useContext(AuthContext);
  
  // State
  const [friends, setFriends] = useState([]); 
  const [groups, setGroups] = useState([]); 
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [inputMessage, setInputMessage] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false); 
  
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupFriends, setSelectedGroupFriends] = useState([]);

  const [ws, setWs] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [typingUsers, setTypingUsers] = useState([]); 
  const typingTimeoutRef = useRef(null); 

  // 1. Initial Fetch
  useEffect(() => {
    fetchFriends();
    fetchGroups(); 
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/friends'); 
      const friendIds = res.data; 
      if (friendIds.length > 0) {
        const allUsersRes = await api.get('/users/');
        const friendObjects = allUsersRes.data.filter(u => friendIds.includes(u.id));
        setFriends(friendObjects);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/chats/rooms');
      const groupRooms = res.data.filter(room => room.is_group);
      setGroups(groupRooms);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
    setSelectedGroup(null);
    setEditingMessageId(null);
    setInputMessage("");
    setTypingUsers([]); 
    try {
      const res = await api.post(`/chats/rooms/direct/${friend.id}`);
      setActiveRoom(res.data);
      setMessages([]); 
    } catch (err) {
      console.error("Failed to get room", err);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedFriend(null);
    setActiveRoom(group);
    setEditingMessageId(null);
    setInputMessage("");
    setMessages([]);
    setTypingUsers([]); 
  };

  const handleGroupCheck = (friendId) => {
    if (selectedGroupFriends.includes(friendId)) {
      setSelectedGroupFriends(prev => prev.filter(id => id !== friendId));
    } else {
      setSelectedGroupFriends(prev => [...prev, friendId]);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName || selectedGroupFriends.length === 0) {
        alert("Please enter a name and select at least one friend.");
        return;
    }
    try {
        await api.post('/chats/rooms', {
            name: newGroupName,
            is_group: true,
            participants: selectedGroupFriends
        });
        setShowCreateGroup(false);
        setNewGroupName("");
        setSelectedGroupFriends([]);
        fetchGroups(); 
        alert("Group created!");
    } catch (err) {
        alert("Error creating group");
    }
  };

  // 4. WebSocket & History
  useEffect(() => {
    if (!activeRoom) return;

    const fetchHistory = async () => {
      const res = await api.get(`/chats/rooms/${activeRoom.id}/messages?limit=50`);
      setMessages(res.data);
    };

    fetchHistory();

    const socket = new WebSocket(`${WS_URL}/ws/chat/${activeRoom.id}?token=${token}`);
    
    socket.onopen = () => console.log("WS Connected");
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'create' || !data.type) {
          setMessages((prev) => [...prev, data]);
      } else if (data.type === 'edit') {
          setMessages((prev) => prev.map(msg => 
              msg.id === data.id ? { ...msg, content: data.content, updated_at: data.updated_at } : msg
          ));
      } else if (data.type === 'delete') {
          setMessages((prev) => prev.filter(msg => msg.id !== data.id));
      }
      // --- Typing ---
      else if (data.type === "typing") {
          if (data.user_id !== user.id) {
              setTypingUsers((prev) => {
                  if (!prev.some(u => u.id === data.user_id)) {
                      return [...prev, { id: data.user_id, username: data.username }];
                  }
                  return prev;
              });
          }
      }
      else if (data.type === "stop_typing") {
          setTypingUsers((prev) => prev.filter(u => u.id !== data.user_id));
      }
      // --- Read Receipt ---
      else if (data.type === "read_receipt") {
          setMessages((prev) => prev.map(msg => {
              if (msg.id === data.message_id) {
                  // Avoid duplicates
                  const currentReads = msg.read_by || [];
                  if(!currentReads.includes(data.user_id)) {
                      return { ...msg, read_by: [...currentReads, data.user_id] };
                  }
              }
              return msg;
          }));
      }
    };
    
    socket.onclose = () => console.log("WS Disconnected");
    setWs(socket);

    return () => {
        socket.close();
        setTypingUsers([]);
    };
  }, [activeRoom, token, user.id]);

  // --- READ RECEIPT LOGIC ---
  // Whenever messages change (loaded or new received), check if *I* need to read them
  useEffect(() => {
      if(!activeRoom || !ws || messages.length === 0) return;

      messages.forEach(msg => {
          // If I am NOT the sender, and my ID is NOT in read_by
          if (msg.sender_id !== user.id) {
              const reads = msg.read_by || [];
              if (!reads.includes(user.id)) {
                  // Send read event
                  ws.send(JSON.stringify({
                      type: "read",
                      message_id: msg.id
                  }));
                  
                  // Optimistically update local state to avoid loops/spam
                  setMessages(prev => prev.map(m => 
                      m.id === msg.id 
                      ? { ...m, read_by: [...(m.read_by || []), user.id] } 
                      : m
                  ));
              }
          }
      });
  }, [messages, activeRoom, ws, user.id]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleInputChange = (e) => {
      setInputMessage(e.target.value);
      if (!ws || !activeRoom) return;
      ws.send(JSON.stringify({ type: "typing", username: user.username }));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
          ws.send(JSON.stringify({ type: "stop_typing" }));
      }, 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || !ws) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ws.send(JSON.stringify({ type: "stop_typing" }));

    if (editingMessageId) {
        ws.send(JSON.stringify({ type: 'edit', message_id: editingMessageId, content: inputMessage }));
        setEditingMessageId(null);
        setInputMessage("");
        return;
    }

    let imageUrl = null;
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const res = await api.post('/chats/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = res.data.url;
      } catch (err) { console.error(err); return; }
    }

    ws.send(JSON.stringify({ type: 'create', content: inputMessage, image_url: imageUrl }));
    setInputMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEditing = (msg) => {
      setEditingMessageId(msg.id);
      setInputMessage(msg.content || "");
      setSelectedFile(null);
  };

  const deleteMessage = (msgId) => {
      if(window.confirm("Delete this message?")) {
          ws.send(JSON.stringify({ type: 'delete', message_id: msgId }));
      }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const addFriend = async (friendId) => {
    try {
      await api.post(`/users/add-friend/${friendId}`);
      setShowSearch(false);
      fetchFriends();
    } catch (err) { alert("Failed to add friend"); }
  };

  return (
    <div className="vh-100 d-flex flex-column overflow-hidden">
      <Navbar bg="primary" variant="dark" className="px-3" style={{ flexShrink: 0 }}>
        <Navbar.Brand>ChatSphere</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text className="me-3 text-light"><strong>{user?.username}</strong></Navbar.Text>
          <Button variant="outline-light" size="sm" className="me-2" onClick={() => setShowCreateGroup(true)}>+ Group</Button>
          <Button variant="outline-light" size="sm" onClick={() => setShowSearch(true)}>Find Users</Button>
          <Button variant="light" size="sm" className="ms-2" onClick={logout}>Logout</Button>
        </Navbar.Collapse>
      </Navbar>

      <Container fluid className="flex-grow-1 d-flex p-0" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <Row className="w-100 m-0 h-100">
          <Col md={3} className="border-end p-0 bg-light d-flex flex-column h-100">
            <div className="flex-grow-1 overflow-auto">
                <div className="p-2 bg-white border-bottom">
                    <h6 className="text-muted mb-2 px-2 text-uppercase small fw-bold">Groups</h6>
                    <ListGroup variant="flush">
                        {groups.map(grp => (
                            <ListGroup.Item 
                                key={grp.id} action 
                                active={selectedGroup?.id === grp.id}
                                onClick={() => handleSelectGroup(grp)}
                                className="border-0 rounded mb-1 py-2"
                            >
                                <strong># {grp.name}</strong>
                            </ListGroup.Item>
                        ))}
                        {groups.length === 0 && <div className="text-muted small px-3">No groups yet</div>}
                    </ListGroup>
                </div>
                <div className="p-2">
                    <h6 className="text-muted mb-2 px-2 text-uppercase small fw-bold">Direct Messages</h6>
                    <ListGroup variant="flush">
                        {friends.map(friend => (
                            <ListGroup.Item 
                                key={friend.id} action 
                                active={selectedFriend?.id === friend.id}
                                onClick={() => handleSelectFriend(friend)}
                                className="border-0 rounded mb-1 py-2"
                            >
                                {friend.username}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
          </Col>

          <Col md={9} className="p-0 d-flex flex-column bg-white h-100">
            {activeRoom ? (
              <>
                <div className="p-3 border-bottom shadow-sm" style={{ flexShrink: 0 }}>
                  <h5 className="m-0">
                    {selectedGroup ? `# ${selectedGroup.name}` : selectedFriend?.username}
                  </h5>
                </div>

                <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    const timeString = formatIndianTime(msg.updated_at || msg.created_at);
                    
                    // --- Check Read Status ---
                    // Assuming 1-on-1 logic for Blue ticks: If read_by has > 0 people (who are not me)
                    // For Groups: Ideally check if everyone read it, but for now check if anyone else read it.
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
                                {/* Render Ticks for my messages */}
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

                <div className="p-3 bg-light border-top" style={{ flexShrink: 0 }}>
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
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted"><h4>Select a chat to start</h4></div>
            )}
          </Col>
        </Row>
      </Container>

      <Modal show={showCreateGroup} onHide={() => setShowCreateGroup(false)}>
        <Modal.Header closeButton><Modal.Title>Create New Group</Modal.Title></Modal.Header>
        <Modal.Body>
            <Form onSubmit={createGroup}>
                <Form.Group className="mb-3">
                    <Form.Label>Group Name</Form.Label>
                    <Form.Control placeholder="e.g. Project Team" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Select Participants</Form.Label>
                    <div className="border rounded p-2" style={{maxHeight: '200px', overflowY: 'auto'}}>
                        {friends.map(friend => (
                            <Form.Check key={friend.id} type="checkbox" label={friend.username} checked={selectedGroupFriends.includes(friend.id)} onChange={() => handleGroupCheck(friend.id)} />
                        ))}
                        {friends.length === 0 && <div className="text-muted small">Add friends first to create a group.</div>}
                    </div>
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={friends.length === 0}>Create Group</Button>
            </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showSearch} onHide={() => setShowSearch(false)}>
        <Modal.Header closeButton><Modal.Title>Find Users</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSearch} className="mb-3">
            <InputGroup>
              <Form.Control placeholder="Search by username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Button type="submit" variant="outline-primary">Search</Button>
            </InputGroup>
          </Form>
          <ListGroup>
            {searchResults.map(u => (
              <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
                <div><strong>{u.username}</strong><br/><small className="text-muted">{u.email}</small></div>
                {u.id !== user.id && !friends.some(f => f.id === u.id) && <Button size="sm" onClick={() => addFriend(u.id)}>Add</Button>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Chat;