import React from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

const CreateGroupModal = ({ 
  show, 
  onHide, 
  friends, 
  newGroupName, 
  setNewGroupName, 
  selectedGroupFriends, 
  handleGroupCheck, 
  createGroup 
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton><Modal.Title>Create New Group</Modal.Title></Modal.Header>
      <Modal.Body>
          <Form onSubmit={createGroup}>
              <Form.Group className="mb-3">
                  <Form.Label>Group Name</Form.Label>
                  <Form.Control 
                    placeholder="e.g. Project Team" 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)} 
                    required 
                  />
              </Form.Group>
              <Form.Group className="mb-3">
                  <Form.Label>Select Participants</Form.Label>
                  <div className="border rounded p-2" style={{maxHeight: '200px', overflowY: 'auto'}}>
                      {friends.map(friend => (
                          <Form.Check 
                            key={friend.id} 
                            type="checkbox" 
                            label={friend.username} 
                            checked={selectedGroupFriends.includes(friend.id)} 
                            onChange={() => handleGroupCheck(friend.id)} 
                          />
                      ))}
                      {friends.length === 0 && <div className="text-muted small">Add friends first to create a group.</div>}
                  </div>
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100" disabled={friends.length === 0}>Create Group</Button>
          </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateGroupModal;