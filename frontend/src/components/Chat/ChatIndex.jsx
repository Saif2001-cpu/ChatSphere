import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api, { WS_URL } from '../../api';
import { Container, Row, Col, Navbar, Button } from 'react-bootstrap';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import FindUsersModal from './FindUsersModal';
import CreateGroupModal from './CreateGroupModal';

// Helper to format date (kept here for easy reference)
const formatIndianTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const ChatIndex = () => {
  const { user, token, logout } = useContext(AuthContext);
  
  // Data State
  const [friends, setFriends] = useState([]); 
  const [groups, setGroups] = useState([]); 
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // UI State
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [inputMessage, setInputMessage] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false); 
  
  // Create Group Form State (Moved to state in this file, passed to modal)
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupFriends, setSelectedGroupFriends] = useState([]);

  const [ws, setWs] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
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

  // 2. Handlers
  const handleSelectFriend = async (friend) => {
    // Clean up previous state
    setSelectedFriend(friend);
    setSelectedGroup(null);
    setEditingMessageId(null);
    setInputMessage("");
    setTypingUsers([]); 
    
    // Fetch room/Create Direct Message Room
    try {
      const res = await api.post(`/chats/rooms/direct/${friend.id}`);
      setActiveRoom(res.data);
      setMessages([]); 
    } catch (err) {
      console.error("Failed to get room", err);
    }
  };

  const handleSelectGroup = (group) => {
    // Clean up previous state
    setSelectedGroup(group);
    setSelectedFriend(null);
    setActiveRoom(group);
    setEditingMessageId(null);
    setInputMessage("");
    setMessages([]);
    setTypingUsers([]); 
  };

  // --- Group Creation Logic (Passed to Modal) ---
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
        console.error("Failed to create group", err);
        alert("Error creating group");
    }
  };

  // --- Friend Management Logic (Passed to Modal) ---
  const addFriend = async (friendId) => {
    try {
      await api.post(`/users/add-friend/${friendId}`);
      setShowSearch(false);
      fetchFriends();
      // Clear search results after adding
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (err) { alert("Failed to add friend"); }
  };

  const removeFriend = async (friendId) => {
    try {
      await api.delete(`/users/remove-friend/${friendId}`);
      fetchFriends(); 
      if (selectedFriend?.id === friendId) {
          setSelectedFriend(null);
          setActiveRoom(null);
          setMessages([]);
      }
      // Update friend list state
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch (err) { 
        console.error(err);
        alert("Failed to remove friend"); 
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
  useEffect(() => {
      if(!activeRoom || !ws || messages.length === 0) return;

      messages.forEach(msg => {
          if (msg.sender_id !== user.id) {
              const reads = msg.read_by || [];
              if (!reads.includes(user.id)) {
                  ws.send(JSON.stringify({
                      type: "read",
                      message_id: msg.id
                  }));
                  
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

  // --- Message Actions (Passed to ChatArea) ---
  const handleInputChange = (e) => {
      setInputMessage(e.target.value);

      if (!ws || !activeRoom) return;

      // Send typing event
      ws.send(JSON.stringify({
          type: "typing",
          username: user.username
      }));

      // Clear existing timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Set new timeout
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

    // Stop typing immediately when sent
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

  return (
    <div className="vh-100 d-flex flex-column overflow-hidden">
      {/* Navbar */}
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
          
          {/* Sidebar */}
          <Sidebar 
            friends={friends} 
            groups={groups} 
            selectedFriend={selectedFriend}
            selectedGroup={selectedGroup}
            onSelectFriend={handleSelectFriend}
            onSelectGroup={handleSelectGroup}
          />

          {/* Chat Area */}
          <ChatArea 
            activeRoom={activeRoom}
            selectedFriend={selectedFriend}
            selectedGroup={selectedGroup}
            messages={messages}
            user={user}
            typingUsers={typingUsers}
            inputMessage={inputMessage}
            editingMessageId={editingMessageId}
            selectedFile={selectedFile}
            messagesEndRef={messagesEndRef}
            fileInputRef={fileInputRef}
            formatIndianTime={formatIndianTime}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            handleSendMessage={handleSendMessage}
            startEditing={startEditing}
            deleteMessage={deleteMessage}
            setEditingMessageId={setEditingMessageId}
            setInputMessage={setInputMessage}
            setSelectedFile={setSelectedFile}
          />
        </Row>
      </Container>

      {/* Modals */}
      <CreateGroupModal
        show={showCreateGroup}
        onHide={() => setShowCreateGroup(false)}
        friends={friends}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        selectedGroupFriends={selectedGroupFriends}
        handleGroupCheck={handleGroupCheck}
        createGroup={createGroup}
      />
      
      <FindUsersModal
        show={showSearch}
        onHide={() => setShowSearch(false)}
        user={user}
        friends={friends}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        fetchFriends={fetchFriends}
        addFriend={addFriend}
        removeFriend={removeFriend}
      />
    </div>
  );
};

export default ChatIndex;