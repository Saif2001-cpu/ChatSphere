// Home.js
import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import SideBar from "../components/SideBar";
import Message from "../components/Message";

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = sessionStorage.getItem("user_id");
    const username = sessionStorage.getItem("username");
    if (!userId) {
      alert("Please log in first!");
      navigate("/login");
      // Redirect to login
      return;
    }
    setCurrentUser({ user_id: userId, username });
  }, [navigate]);

  // Handler to create chat and select contact
const createChat = async (senderId, receiverId) => {
  try {
    const url = `http://localhost:8000/chats/start-chat?sender_id=${encodeURIComponent(senderId)}&receiver_id=${encodeURIComponent(receiverId)}`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) throw new Error("Failed to create chat");
    const data = await response.json();
    setActiveChatId(data.chat_id); // Only set chat ID
    return data;
  } catch (error) {
    console.error("Error creating chat:", error);
    alert("Error creating chat. Please try again.");
  }
};

  console.log("selectedContact:", selectedContact);
  console.log("activeChatId:", activeChatId);
  if (!currentUser) return <div>Loading...</div>;

 return (
    <div className="container-fluid vh-100 p-0">
      <div className="row h-100">
        <div className="col-4 p-0">
     
<SideBar
  currentUser={currentUser}
  onSelectContact={async (contact) => {
    // Immediately show contact in UI
    setSelectedContact(contact);
    // Create or fetch chat
    await createChat(currentUser.user_id, contact.user_id);
  }}
/>
        </div>
        <div className="col-8 p-0">
          <Message
            contact={selectedContact}
            chatId={activeChatId}
            currentUserId={currentUser.user_id}
          />
        </div>
      </div>
    </div>
  );
}