import { useState, useEffect } from "react";
import "../styles/SellerChat.css";
import ChatWindow from "./ChatWindow";

function SellerChat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(() => {
    const saved = localStorage.getItem("selectedUser");
    return saved ? JSON.parse(saved) : null; // luôn là object
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    setUsers([
      { name: "tungduong", avatar: "https://i.pravatar.cc/150?img=1", status: "online", lastMessage: "Xin chào!" },
      { name: "khanhne123", avatar: "https://i.pravatar.cc/150?img=2", status: "offline", lastMessage: "Bạn có thể giúp tôi?" },
      { name: "user3", avatar: "https://i.pravatar.cc/150?img=3", status: "online", lastMessage: "Hẹn gặp lại!" },
    ]);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem("selectedUser", JSON.stringify(user));
  };

  const handleClearHistory = () => {
    const saved = localStorage.getItem("chat_history");
    if (saved && selectedUser) {
      const history = JSON.parse(saved);
      delete history[selectedUser.name];
      localStorage.setItem("chat_history", JSON.stringify(history));
    }
    setShowConfirmModal(false);
  };

  return (
    <div className="messenger-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">Khách hàng</div>
        <div className="user-list">
          {users.map((user, idx) => (
            <div
              key={idx}
              className={`user-item ${selectedUser?.name === user.name ? "active" : ""}`}
              onClick={() => handleSelectUser(user)}
            >
              <img src={user.avatar} alt={user.name} className="avatar" />
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="last-message">{user.lastMessage}</div>
              </div>
              <div className={`status-dot ${user.status}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-window-header">
              <div className="chat-user-info">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="header-avatar" />
                <div>
                  <div className="header-name">{selectedUser.name}</div>
                  <div className={`header-status ${selectedUser.status}`}>
                    {selectedUser.status === "online" ? "Đang hoạt động" : "Ngoại tuyến"}
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button className="call-btn">📞</button>
                <button className="clear-btn" onClick={() => setShowConfirmModal(true)}>🗑</button>
              </div>
            </div>

            <ChatWindow
              key={selectedUser.name + (showConfirmModal ? "-reset" : "")}
              username="Seller"
              roomName={selectedUser.name}
              isCalling={isCalling}
              setIsCalling={setIsCalling}
            />

            {showConfirmModal && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h3>Xác nhận xoá lịch sử</h3>
                  <p>Bạn có chắc muốn xoá toàn bộ tin nhắn với <b>{selectedUser.name}</b>?</p>
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
