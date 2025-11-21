import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { WS_URL } from '../api';
import { Container, Row, Col, ListGroup, Form, Button, Navbar, InputGroup, Modal, Badge } from 'react-bootstrap';

const Chat = () => {
  const { user, token, logout } = useContext(AuthContext);
  
  // State
  const [friends, setFriends] = useState([]); // Using friends list as "chat list"
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ws, setWs] = useState(null);

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const messagesEndRef = useRef(null);

  // 1. Fetch friends/users on mount
  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      // Based on your user_router.py, this returns a list of UserPublic objects
      const res = await api.get('/users/friends'); 
      
      // Note: Your friend_services.py stores friends as a list of IDs strings in the user document.
      // However, the user_router.py /friends endpoint returns "current_user.friends".
      // If your backend only returns IDs, we might need to fetch full user details for each ID.
      // Assuming for now user_router might need adjustment or friends contains objects. 
      // *Correction based on provided backend*: 
      // The backend `get_friends` returns `current_user.friends` which is `List[str]`.
      // We need to fetch details for these IDs. Since there is no bulk fetch endpoint in the provided files,
      // we will fetch user details one by one or use the search/list endpoint if available.
      // Workaround: We will fetch all users and filter (not efficient for prod but works here) OR
      // assuming the user meant the backend to populate this.
      // Let's use the search endpoint or just fetch list of all users and match IDs for this demo.
      
      const friendIds = res.data; 
      if (friendIds.length > 0) {
        // Fetching all users to map IDs to Names (Optimization needed in backend later)
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

  // 2. Handle selecting a friend to chat
  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
    try {
      // Get or create direct room (chat_router.py)
      const res = await api.post(`/chats/rooms/direct/${friend.id}`);
      setActiveRoom(res.data);
      setMessages([]); // Clear previous messages while loading
    } catch (err) {
      console.error("Failed to get room", err);
    }
  };

  // 3. Fetch history & Connect WebSocket when room changes
  useEffect(() => {
    if (!activeRoom) return;

    // Fetch message history (chat_router.py)
    const fetchHistory = async () => {
      const res = await api.get(`/chats/rooms/${activeRoom.id}/messages?limit=50`);
      // The backend returns messages in reverse chronological order (newest first) due to [::-1] in service? 
      // Actually service does .sort(-1) then [::-1], so it returns Oldest -> Newest.
      setMessages(res.data);
    };

    fetchHistory();

    // Connect WebSocket (chat_ws.py)
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !ws) return;

    // Based on chat_ws.py: it expects JSON with "content"
    ws.send(JSON.stringify({ content: inputMessage }));
    setInputMessage('');
  };

  // 5. User Search & Add Friend
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
      fetchFriends(); // Refresh list
      alert("Friend added!");
    } catch (err) {
      alert("Failed to add friend");
    }
  };

  return (
    <div className="vh-100 d-flex flex-column overflow-hidden">
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" className="px-3">
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

      <Container fluid className="flex-grow-1 d-flex p-0" style={{ height: 'calc(100vh - 56px)' }}>
        <Row className="w-100 m-0">
          {/* Sidebar - Friend List */}
          <Col md={3} className="border-end p-0 bg-light d-flex flex-column">
            <div className="p-3 border-bottom bg-white">
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

          {/* Chat Area */}
          <Col md={9} className="p-0 d-flex flex-column bg-white">
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-bottom shadow-sm">
                  <h5 className="m-0">
                    {selectedFriend ? selectedFriend.username : "Chat"}
                  </h5>
                </div>

                {/* Messages */}
                <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={idx} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div 
                          className={`p-3 rounded shadow-sm ${isMe ? 'bg-primary text-white' : 'bg-white border'}`}
                          style={{ maxWidth: '70%' }}
                        >
                          <div>{msg.content}</div>
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
                <div className="p-3 bg-light border-top">
                  <Form onSubmit={handleSendMessage}>
                    <InputGroup>
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
                {/* Hide Add button if it's me or already a friend */}
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