// UserSearch.js (enhanced)
import React, { useState } from "react";
import { ListGroup, Button } from "react-bootstrap";

export default function UserSearch({ onUserFound }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Enter a name or email");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/chats/search-user?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();
      setSearchResults([user]); // assuming single result
      setError("");
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    }
  };

  return (
    <div className="mb-3">
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Search user..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button size="sm" onClick={handleSearch} className="w-100">
        Search
      </Button>

      {error && <div className="text-danger mt-2">{error}</div>}

      {/* Show search results with Add button */}
      {searchResults.map((user) => (
        <ListGroup key={user.user_id} className="mt-2">
          <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{user.username}</strong>
              <div><small>{user.email}</small></div>
            </div>
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                onUserFound(user);
                setSearchResults([]); // clear after add
                setQuery("");
              }}
            >
              Add
            </Button>
          </ListGroup.Item>
        </ListGroup>
      ))}
    </div>
  );
}