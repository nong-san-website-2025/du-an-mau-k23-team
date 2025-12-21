import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChatBox from "./ChatBox";
import { MessageSquare, Trash2, X } from "lucide-react";
import "../styles/GlobalChat.css"; // Import file CSS mới

// --- QUẢN LÝ LOCAL STORAGE ---
const chatRoster = {
  read: () => {
    try {
      const raw = localStorage.getItem("chat:roster");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  write: (arr) => {
    try { localStorage.setItem("chat:roster", JSON.stringify(arr)); } catch {}
  },
};

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);

  // 1. Khởi tạo dữ liệu
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    const roster = chatRoster.read();
    setConversations(roster);

    if (roster.length > 0) {
      const lastActive = localStorage.getItem("chat:lastActiveId");
      const targetId = lastActive && roster.some((c) => String(c.id) === String(lastActive))
          ? lastActive : String(roster[0].id);
      setActiveConvId(targetId);
    }
  }, []);

  // 2. Lưu trạng thái active
  useEffect(() => {
    if (activeConvId) localStorage.setItem("chat:lastActiveId", activeConvId);
  }, [activeConvId]);

  // 3. Lắng nghe sự kiện mở chat
  const handleOpenChat = useCallback((e) => {
    const { sellerId, sellerName, sellerImage } = e?.detail || {};
    if (!sellerId) return;

    const idStr = String(sellerId);
    setConversations((prev) => {
      const existing = prev.find((c) => String(c.id) === idStr);
      let nextRoster;
      if (existing) {
        nextRoster = [{ ...existing, name: sellerName, image: sellerImage }, ...prev.filter((c) => String(c.id) !== idStr)];
      } else {
        nextRoster = [{ id: idStr, name: sellerName, image: sellerImage }, ...prev];
      }
      chatRoster.write(nextRoster);
      return nextRoster;
    });

    setActiveConvId(idStr);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("chat:open", handleOpenChat);
    return () => window.removeEventListener("chat:open", handleOpenChat);
  }, [handleOpenChat]);

  // 4. Xử lý xóa hội thoại
  const removeConversation = (e, idToRemove) => {
    e.stopPropagation();
    const newConversations = conversations.filter((c) => String(c.id) !== String(idToRemove));
    setConversations(newConversations);
    chatRoster.write(newConversations);

    if (String(activeConvId) === String(idToRemove)) {
      setActiveConvId(newConversations[0]?.id || null);
    }
  };

  const activeConversation = useMemo(() => 
    conversations.find((c) => String(c.id) === String(activeConvId)), 
    [conversations, activeConvId]
  );

  return (
    <div className="chat-widget-wrapper">
      {!isOpen ? (
        <button className="chat-bubble-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={28} strokeWidth={2} />
        </button>
      ) : (
        <div className="chat-panel">
          {/* Header */}
          <header className="panel-header">
            <h3>Tin nhắn</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </header>

          <div className="panel-body">
            {/* Sidebar */}
            <aside className="chat-sidebar">
              <div className="sidebar-list">
                {conversations.length === 0 ? (
                  <div className="empty-state" style={{ height: '200px' }}>
                    <span>Chưa có cuộc hội thoại</span>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`conv-item ${String(activeConvId) === String(conv.id) ? "active" : ""}`}
                      onClick={() => setActiveConvId(String(conv.id))}
                    >
                      <div className="conv-avatar">
                        {conv.image ? <img src={conv.image} alt={conv.name} /> : (conv.name || "S").charAt(0).toUpperCase()}
                      </div>
                      <div className="conv-info">
                        <span className="conv-name">{conv.name || `Shop #${conv.id}`}</span>
                        <span className="conv-preview">Nhấn để xem tin nhắn</span>
                      </div>
                      <button className="remove-conv-btn" onClick={(e) => removeConversation(e, conv.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-main">
              {token && activeConversation ? (
                <ChatBox
                  key={activeConversation.id}
                  sellerId={activeConversation.id}
                  sellerName={activeConversation.name}
                  sellerImage={activeConversation.image}
                  token={token}
                />
              ) : (
                <div className="empty-state">
                  <MessageSquare size={64} style={{ opacity: 0.1, marginBottom: 16 }} />
                  <p>{token ? "Chọn một cuộc trò chuyện để bắt đầu" : "Vui lòng đăng nhập để chat"}</p>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}