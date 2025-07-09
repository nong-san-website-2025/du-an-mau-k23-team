import { useState, useEffect } from "react";
import "../styles/SellerChat.css";
import ChatWindow from "./ChatWindow";

function SellerChat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(() => {
    // Lấy người dùng đã chọn từ localStorage nếu có
    const savedUser = localStorage.getItem("selectedUser");
    return localStorage.getItem("selectedUser") || null;
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  

  useEffect(() => {
    setUsers(["tungduong", "user2", "user3"]);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem("selectedUser", user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    localStorage.removeItem("selectedUser");
  };
  const handleClearHistory = () => {
    const saved = localStorage.getItem("chat_history");
    if (saved) {
      const history = JSON.parse(saved);
      delete history[selectedUser];
      localStorage.setItem("chat_history", JSON.stringify(history));
    }
    setShowConfirmModal(false);
  };

  return (
    <div className="messenger-container">
      <div className="sidebar">
        <div className="sidebar-header">Khách hàng</div>
        <div className="user-list">
          {users.map((user, idx) => (
            <div
              key={idx}
              className={`user-item ${selectedUser === user ? "active" : ""}`}
              onClick={() => handleSelectUser(user)}
            >
              {user}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-window-header">
              <button className="back-btn" onClick={handleBackToList}>
                ←
              </button>
              <button className="clear-btn" onClick={() => setShowConfirmModal(true)}>
                🗑
              </button>
            </div>
            
            <ChatWindow
              key={selectedUser + (showConfirmModal ? "-reset" : "")}
              username="Seller"
              roomName={selectedUser}
            />

            {showConfirmModal && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h3>Xác nhận xoá lịch sử</h3>
                  <p>Bạn có chắc muốn xoá toàn bộ tin nhắn với <b>{selectedUser}</b>?</p>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>Huỷ</button>
                    <button className="delete-btn" onClick={handleClearHistory}>Xoá</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-chat">Chọn khách hàng để bắt đầu trò chuyện</div>
        )}
      </div>
    </div>
  );
}

export default SellerChat;
