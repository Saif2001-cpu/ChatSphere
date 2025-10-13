// Message.js
import React from "react";
import Navbar from "./Navbar";
import ChatBox from "./ChatBox";
import { useState,useEffect } from "react";

export default function Message({ contact, chatId, currentUserId }) {

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if(!chatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      try {
         const response = await fetch(`http://localhost:8000/chats/messages/${chatId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
         setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err.message);
        setMessages([]);

      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 2000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount or chatId change
  }, [chatId]);


  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!contact) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <p className="text-muted">Select a contact to start chatting</p>
      </div>
    );
  }
 return (
    <div className="d-flex flex-column h-100">
      {/* Navbar */}
      <div className="border-bottom">
        <Navbar contactName={contact.username} />
      </div>

      {/* Messages Area */}
      <div className="flex-grow-1 overflow-auto p-3 bg-white" style={{ maxHeight: "100%" }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-warning">{error}</div>
        ) : messages.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-muted">No messages yet. Send a message to start!</p>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`mb-2 p-2 rounded ${
                  msg.sender_id === currentUserId
                    ? "bg-primary text-white ms-auto" // Sent by me → right-aligned
                    : "bg-light text-dark"           // Received → left-aligned
                }`}
                style={{
                  maxWidth: "70%",
                  wordWrap: "break-word",
                  marginLeft: msg.sender_id === currentUserId ? "auto" : "0",
                  marginRight: msg.sender_id === currentUserId ? "0" : "auto",
                }}
              >
                {msg.content}
                <div
                  className={`text-end mt-1 ${
                    msg.sender_id === currentUserId ? "text-white-50" : "text-muted"
                  }`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-top">
        <ChatBox
          chatId={chatId}
          currentUserId={currentUserId}
          receiverId={contact.user_id}
          onMessageSent={() => {
            // Refresh messages after sending
          }}
        />
      </div>
    </div>
  );
}
