import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api, { WS_URL } from '../../api';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import FindUsersModal from './FindUsersModal';
import CreateGroupModal from './CreateGroupModal';

const formatIndianTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
};

const ChatIndex = () => {
  const { user, token, logout } = useContext(AuthContext);
  const [friends, setFriends] = useState([]), [groups, setGroups] = useState([]), [activeRoom, setActiveRoom] = useState(null), [messages, setMessages] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null), [selectedGroup, setSelectedGroup] = useState(null), [inputMessage, setInputMessage] = useState('');
  const [showSearch, setShowSearch] = useState(false), [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState(''), [selectedGroupFriends, setSelectedGroupFriends] = useState([]);
  const [ws, setWs] = useState(null), [typingUsers, setTypingUsers] = useState([]), [searchQuery, setSearchQuery] = useState(''), [searchResults, setSearchResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null), [editingMessageId, setEditingMessageId] = useState(null);
  const fileInputRef = useRef(null), messagesEndRef = useRef(null), typingTimeoutRef = useRef(null);

  useEffect(() => { fetchFriends(); fetchGroups(); }, []);

  const fetchFriends = async () => {
    try { const res = await api.get('/users/friends'); if (!res.data.length) return setFriends([]); const all = await api.get('/users/'); setFriends(all.data.filter((u) => res.data.includes(u.id))); }
    catch (err) { console.error('Failed to fetch friends', err); }
  };
  const fetchGroups = async () => {
    try { const res = await api.get('/chats/rooms'); setGroups(res.data.filter((room) => room.is_group)); }
    catch (err) { console.error('Failed to fetch groups', err); }
  };
  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend); setSelectedGroup(null); setEditingMessageId(null); setInputMessage(''); setTypingUsers([]);
    try { const res = await api.post(`/chats/rooms/direct/${friend.id}`); setActiveRoom(res.data); setMessages([]); }
    catch (err) { console.error('Failed to get room', err); }
  };
  const handleSelectGroup = (group) => { setSelectedGroup(group); setSelectedFriend(null); setActiveRoom(group); setEditingMessageId(null); setInputMessage(''); setMessages([]); setTypingUsers([]); };
  const handleGroupCheck = (friendId) => setSelectedGroupFriends((prev) => prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]);
  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName || !selectedGroupFriends.length) return alert('Please enter a name and select at least one friend.');
    try { await api.post('/chats/rooms', { name: newGroupName, is_group: true, participants: selectedGroupFriends }); setShowCreateGroup(false); setNewGroupName(''); setSelectedGroupFriends([]); fetchGroups(); }
    catch (err) { console.error('Failed to create group', err); alert('Error creating group'); }
  };
  const addFriend = async (friendId) => {
    try { await api.post(`/users/add-friend/${friendId}`); setShowSearch(false); fetchFriends(); setSearchResults((prev) => prev.filter((u) => u.id !== friendId)); }
    catch (err) { alert('Failed to add friend'); }
  };
  const removeFriend = async (friendId) => {
    try { await api.delete(`/users/remove-friend/${friendId}`); fetchFriends(); if (selectedFriend?.id === friendId) { setSelectedFriend(null); setActiveRoom(null); setMessages([]); } setFriends((prev) => prev.filter((f) => f.id !== friendId)); }
    catch (err) { console.error(err); alert('Failed to remove friend'); }
  };

  useEffect(() => {
    if (!activeRoom) return undefined;
    const fetchHistory = async () => { try { const res = await api.get(`/chats/rooms/${activeRoom.id}/messages?limit=50`); setMessages(res.data); } catch (err) { console.error('Failed to fetch message history', err); } };
    fetchHistory();
    const socket = new WebSocket(`${WS_URL}/ws/chat/${activeRoom.id}?token=${token}`);
    socket.onopen = () => console.log('WS Connected');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'create' || !data.type) setMessages((prev) => [...prev, data]);
      else if (data.type === 'edit') setMessages((prev) => prev.map((msg) => msg.id === data.id ? { ...msg, content: data.content, updated_at: data.updated_at } : msg));
      else if (data.type === 'delete') setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
      else if (data.type === 'typing' && data.user_id !== user.id) setTypingUsers((prev) => prev.some((u) => u.id === data.user_id) ? prev : [...prev, { id: data.user_id, username: data.username }]);
      else if (data.type === 'stop_typing') setTypingUsers((prev) => prev.filter((u) => u.id !== data.user_id));
      else if (data.type === 'read_receipt') setMessages((prev) => prev.map((msg) => msg.id === data.message_id && !(msg.read_by || []).includes(data.user_id) ? { ...msg, read_by: [...(msg.read_by || []), data.user_id] } : msg));
    };
    socket.onclose = () => console.log('WS Disconnected'); setWs(socket);
    return () => { socket.close(); setTypingUsers([]); };
  }, [activeRoom, token, user.id]);

  useEffect(() => {
    if (!activeRoom || !ws || !messages.length) return;
    messages.forEach((msg) => { if (msg.sender_id !== user.id && !(msg.read_by || []).includes(user.id)) { ws.send(JSON.stringify({ type: 'read', message_id: msg.id })); setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read_by: [...(m.read_by || []), user.id] } : m)); } });
  }, [messages, activeRoom, ws, user.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value); if (!ws || !activeRoom) return;
    ws.send(JSON.stringify({ type: 'typing', username: user.username })); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => ws.send(JSON.stringify({ type: 'stop_typing' })), 2000);
  };
  const handleFileChange = (e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); };
  const handleSendMessage = async (e) => {
    e.preventDefault(); if ((!inputMessage.trim() && !selectedFile) || !ws) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); ws.send(JSON.stringify({ type: 'stop_typing' }));
    if (editingMessageId) { ws.send(JSON.stringify({ type: 'edit', message_id: editingMessageId, content: inputMessage })); setEditingMessageId(null); setInputMessage(''); return; }
    let imageUrl = null;
    if (selectedFile) { const formData = new FormData(); formData.append('file', selectedFile); try { const res = await api.post('/chats/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); imageUrl = res.data.url; } catch (err) { console.error(err); return; } }
    ws.send(JSON.stringify({ type: 'create', content: inputMessage, image_url: imageUrl })); setInputMessage(''); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const startEditing = (msg) => { setEditingMessageId(msg.id); setInputMessage(msg.content || ''); setSelectedFile(null); };
  const deleteMessage = (msgId) => { if (window.confirm('Delete this message?')) ws.send(JSON.stringify({ type: 'delete', message_id: msgId })); };

  return (
    <div className="chat-app">
      <header className="app-header">
        <div className="brand">ChatSphere</div>
        <label className="global-search"><span className="search-icon" aria-hidden="true">⌕</span><input type="search" placeholder="Search conversations, people, or files" aria-label="Global search" /></label>
        <div className="header-user"><span className="header-user-name">{user?.username}</span><span className="avatar md" style={{ background: '#2e528f' }}>{user?.username?.charAt(0).toUpperCase() || 'X'}</span></div>
      </header>
      <div className={`workspace ${activeRoom ? 'has-active-room' : 'no-active-room'}`}>
        <Sidebar friends={friends} groups={groups} selectedFriend={selectedFriend} selectedGroup={selectedGroup} onSelectFriend={handleSelectFriend} onSelectGroup={handleSelectGroup} onCreateGroup={() => setShowCreateGroup(true)} onFindUsers={() => setShowSearch(true)} onLogout={logout} />
        <ChatArea activeRoom={activeRoom} selectedFriend={selectedFriend} selectedGroup={selectedGroup} messages={messages} user={user} typingUsers={typingUsers} inputMessage={inputMessage} editingMessageId={editingMessageId} selectedFile={selectedFile} messagesEndRef={messagesEndRef} fileInputRef={fileInputRef} formatIndianTime={formatIndianTime} handleInputChange={handleInputChange} handleFileChange={handleFileChange} handleSendMessage={handleSendMessage} startEditing={startEditing} deleteMessage={deleteMessage} setEditingMessageId={setEditingMessageId} setInputMessage={setInputMessage} setSelectedFile={setSelectedFile} />
      </div>
      <CreateGroupModal show={showCreateGroup} onHide={() => setShowCreateGroup(false)} friends={friends} newGroupName={newGroupName} setNewGroupName={setNewGroupName} selectedGroupFriends={selectedGroupFriends} handleGroupCheck={handleGroupCheck} createGroup={createGroup} />
      <FindUsersModal show={showSearch} onHide={() => setShowSearch(false)} user={user} friends={friends} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} setSearchResults={setSearchResults} fetchFriends={fetchFriends} addFriend={addFriend} removeFriend={removeFriend} />
    </div>
  );
};

export default ChatIndex;
