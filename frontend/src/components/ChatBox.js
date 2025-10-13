// ChatBox.js
import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";

export default function ChatBox({ chatId, currentUserId, receiverId ,onMessageSent}) {
  const [message, setMessage] = useState("");

  const handleSend = async (e) => {
    e.preventDefault(); // Prevent form reload

    if (!message.trim() || !chatId || !currentUserId || !receiverId) {
      return;
    }

    // URL-encode all parameters
    const url = new URL("http://localhost:8000/chats/send-message");
    url.searchParams.append("chat_id", chatId);
    url.searchParams.append("sender_id", currentUserId);
    url.searchParams.append("receiver_id", receiverId);
    url.searchParams.append("content", message.trim());

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        // No body needed — everything is in query params
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
     
      // Clear input on success
      setMessage("");
      onMessageSent?.(); // Notify parent to refresh messages
    } catch (err) {
      console.error("Error sending message:", err);
      alert("An error occurred while sending the message.");
    }
  };

  return (
    <Form onSubmit={handleSend} className="p-3 border-top">
      <InputGroup>
        <Form.Control
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!chatId}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!message.trim() || !chatId}
        >
          Send
        </Button>
      </InputGroup>
    </Form>
  );
}