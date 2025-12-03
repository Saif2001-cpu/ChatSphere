import React from 'react';
import { Col, ListGroup } from 'react-bootstrap';

const Sidebar = ({ friends, groups, selectedFriend, selectedGroup, onSelectFriend, onSelectGroup }) => {
  return (
    <Col md={3} className="border-end p-0 bg-light d-flex flex-column h-100">
      <div className="flex-grow-1 overflow-auto">
          
          {/* Groups Section */}
          <div className="p-2 bg-white border-bottom">
              <h6 className="text-muted mb-2 px-2 text-uppercase small fw-bold">Groups</h6>
              <ListGroup variant="flush">
                  {groups.map(grp => (
                      <ListGroup.Item 
                          key={grp.id} action 
                          active={selectedGroup?.id === grp.id}
                          onClick={() => onSelectGroup(grp)}
                          className="border-0 rounded mb-1 py-2"
                      >
                          <strong># {grp.name}</strong>
                      </ListGroup.Item>
                  ))}
                  {groups.length === 0 && <div className="text-muted small px-3">No groups yet</div>}
              </ListGroup>
          </div>

          {/* Friends Section */}
          <div className="p-2">
              <h6 className="text-muted mb-2 px-2 text-uppercase small fw-bold">Direct Messages</h6>
              <ListGroup variant="flush">
                  {friends.map(friend => (
                      <ListGroup.Item 
                          key={friend.id} action 
                          active={selectedFriend?.id === friend.id}
                          onClick={() => onSelectFriend(friend)}
                          className="border-0 rounded mb-1 py-2"
                      >
                          {friend.username}
                      </ListGroup.Item>
                  ))}
              </ListGroup>
          </div>
      </div>
    </Col>
  );
};

export default Sidebar;