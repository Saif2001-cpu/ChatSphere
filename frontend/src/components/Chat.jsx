import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { WS_URL } from '../api';
import { Container, Row, Col, ListGroup, Form, Button, Navbar, InputGroup, Modal, Image } from 'react-bootstrap';

const Chat = () => {
  const { user, token, logout } = useContext(AuthContext);
  
  // State
  const [friends, setFriends] = useState([]); 
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ws, setWs] = useState(null);

  // State for file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const messagesEndRef = useRef(null);

  // 1. Fetch friends on mount
  useEffect(() => {
    fetchFriends();
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

  // 2. Handle selecting a friend
  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
    try {
      const res = await api.post(`/chats/rooms/direct/${friend.id}`);
      setActiveRoom(res.data);
      setMessages([]); 
    } catch (err) {
      console.error("Failed to get room", err);
    }
  };

  // 3. Fetch history & Connect WebSocket
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
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    socket.onclose = () => console.log("WS Disconnected");

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [activeRoom, token]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 4. Send Message (Text + Image)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    // Prevent sending if both inputs are empty
    if ((!inputMessage.trim() && !selectedFile) || !ws) return;

    let imageUrl = null;

    // 1. Upload image if selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await api.post('/chats/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = res.data.url;
      } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload image");
        return;
      }
    }

    // 2. Send WebSocket message
    ws.send(JSON.stringify({ 
      content: inputMessage,
      image_url: imageUrl 
    }));

    // 3. Reset inputs
    setInputMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  // 5. Search & Add Friend
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addFriend = async (friendId) => {
    try {
      await api.post(`/users/add-friend/${friendId}`);
      setShowSearch(false);
      fetchFriends();
      alert("Friend added!");
    } catch (err) {
      alert("Failed to add friend");
    }
  };

  return (
    <div className="vh-100 d-flex flex-column overflow-hidden">
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" className="px-3" style={{ flexShrink: 0 }}>
        <Navbar.Brand>ChatSphere</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text className="me-3 text-light">
            Signed in as: <strong>{user?.username}</strong>
          </Navbar.Text>
          <Button variant="outline-light" size="sm" onClick={() => setShowSearch(true)}>
            Find Friends
          </Button>
          <Button variant="light" size="sm" className="ms-2" onClick={logout}>
            Logout
          </Button>
        </Navbar.Collapse>
      </Navbar>

      {/* Main Layout Container */}
      <Container fluid className="flex-grow-1 d-flex p-0" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* Added h-100 to Row to ensure it takes full height of container */}
        <Row className="w-100 m-0 h-100">
          
          {/* Sidebar: Added h-100 and overflow-hidden to ensure proper scrolling inside list */}
          <Col md={3} className="border-end p-0 bg-light d-flex flex-column h-100">
            <div className="p-3 border-bottom bg-white" style={{ flexShrink: 0 }}>
              <h5 className="m-0">Friends</h5>
            </div>
            <ListGroup variant="flush" className="flex-grow-1 overflow-auto">
              {friends.map((friend) => (
                <ListGroup.Item 
                  key={friend.id} 
                  action 
                  active={selectedFriend?.id === friend.id}
                  onClick={() => handleSelectFriend(friend)}
                  className="border-0 border-bottom py-3"
                >
                  <strong>{friend.username}</strong>
                  <div className="text-muted small">{friend.email}</div>
                </ListGroup.Item>
              ))}
              {friends.length === 0 && (
                <div className="p-3 text-center text-muted">
                  No friends yet. Click "Find Friends" to start!
                </div>
              )}
            </ListGroup>
          </Col>

          {/* Chat Area: Added h-100 to ensure it stays within viewport */}
          <Col md={9} className="p-0 d-flex flex-column bg-white h-100">
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-bottom shadow-sm" style={{ flexShrink: 0 }}>
                  <h5 className="m-0">
                    {selectedFriend ? selectedFriend.username : "Chat"}
                  </h5>
                </div>

                {/* Messages Area: overflow-auto handles the scrolling here */}
                <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={idx} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div 
                          className={`p-3 rounded shadow-sm ${isMe ? 'bg-primary text-white' : 'bg-white border'}`}
                          style={{ maxWidth: '70%' }}
                        >
                          {/* Render Image if present */}
                          {msg.image_url && (
                            <div className="mb-2">
                              <Image 
                                src={msg.image_url} 
                                alt="Shared content" 
                                fluid 
                                rounded 
                                style={{ maxHeight: '200px' }} 
                              />
                            </div>
                          )}
                          
                          {/* Render Text Content */}
                          {msg.content && <div>{msg.content}</div>}
                          
                          <div className={`small mt-1 text-end ${isMe ? 'text-white-50' : 'text-muted'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-light border-top" style={{ flexShrink: 0 }}>
                  {/* File Preview */}
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-white border rounded d-inline-block position-relative">
                       <small>{selectedFile.name}</small>
                       <Button 
                          variant="link" 
                          size="sm" 
                          className="text-danger p-0 ms-2" 
                          onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                       >
                         ✕
                       </Button>
                    </div>
                  )}
                  
                  <Form onSubmit={handleSendMessage}>
                    <InputGroup>
                      {/* File Attachment Button */}
                      <Button variant="outline-secondary" onClick={() => fileInputRef.current.click()}>
                        📎
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      
                      <Form.Control
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                      />
                      <Button variant="primary" type="submit">Send</Button>
                    </InputGroup>
                  </Form>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                <h4>Select a friend to start chatting</h4>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Search Modal */}
      <Modal show={showSearch} onHide={() => setShowSearch(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Find Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSearch} className="mb-3">
            <InputGroup>
              <Form.Control 
                placeholder="Search by username..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="outline-primary">Search</Button>
            </InputGroup>
          </Form>
          <ListGroup>
            {searchResults.map(u => (
              <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{u.username}</strong>
                  <br/><small className="text-muted">{u.email}</small>
                </div>
                {u.id !== user.id && !friends.some(f => f.id === u.id) && (
                  <Button size="sm" onClick={() => addFriend(u.id)}>Add</Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Chat;