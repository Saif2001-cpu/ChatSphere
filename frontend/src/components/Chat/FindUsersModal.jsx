import React from 'react';
import { Modal, Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import api from '../../api';

const FindUsersModal = ({ 
  show, 
  onHide, 
  user, 
  friends, 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  setSearchResults, 
  addFriend, 
  removeFriend 
}) => {

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (err) { 
      console.error(err); 
      setSearchResults([]); 
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton><Modal.Title>Find Users</Modal.Title></Modal.Header>
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
          {searchResults.map(u => {
            const isFriend = friends.some(f => f.id === u.id);
            return (
              <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
                <div><strong>{u.username}</strong><br/><small className="text-muted">{u.email}</small></div>
                {u.id !== user.id && (
                    isFriend 
                    ? <Button size="sm" variant="danger" onClick={() => {removeFriend(u.id); onHide();}}>Remove</Button>
                    : <Button size="sm" onClick={() => {addFriend(u.id); onHide();}}>Add</Button>
                )}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
};

export default FindUsersModal;