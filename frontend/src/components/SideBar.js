// SideBar.js
import React, { useState } from "react";
import { ListGroup } from "react-bootstrap";
import UserSearch from "./UserSearch";

export default function SideBar({ currentUser, onSelectContact }) {
  const [contacts, setContacts] = useState([]);

  // Handle user found from search: add to local list only
  const handleUserFound = (user) => {
    // Avoid duplicates
    if (!contacts.some(c => c.user_id === user.user_id)) {
      setContacts(prev => [...prev, user]);
    }
    // Do NOT auto-select or call any other handler
    // User must click the contact to open chat
  };

  return (
    <div className="bg-light p-3 h-100 border-end" style={{ minWidth: "250px", overflowY: "auto" }}>
      <h5 className="mb-3">Chat with anyone</h5>
      
      {/* Search */}
      <UserSearch onUserFound={handleUserFound} />

      {/* Contacts List */}
      <ListGroup className="mt-3">
        {contacts.length === 0 ? (
          <ListGroup.Item className="text-muted">No contacts yet</ListGroup.Item>
        ) : (
          contacts.map((contact) => (
            <ListGroup.Item
              key={contact.user_id}
              action
              onClick={() => onSelectContact(contact)} // ✅ This is now safe
            >
              <div>
                <strong>{contact.username}</strong>
                <br />
                <small className="text-muted">{contact.email}</small>
              </div>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </div>
  );
}