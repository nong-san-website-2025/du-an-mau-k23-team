import { useState, useEffect } from "react";
import "../styles/SellerChat.css";
import ChatWindow from "./ChatWindow";

function SellerChat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Tạm thời lấy user ảo - sau này sẽ gọi API lấy danh sách user đã nhắn tin
    setUsers(["khanhne123", "user2", "user3"]);
  }, []);

  return (
    <div className="seller-chat-container">
      <div className="user-list">
        <h3>Khách hàng</h3>
        {users.map((user, idx) => (
          <div
            key={idx}
            className={`user-item ${selectedUser === user ? "active" : ""}`}
            onClick={() => setSelectedUser(user)}
          >
            {user}
          </div>
        ))}
      </div>

      <div className="chat-section">
        {selectedUser ? (
          <ChatWindow username="Seller" roomName={selectedUser} />
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
}

export default SellerChat;
