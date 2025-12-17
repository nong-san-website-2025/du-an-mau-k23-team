/**
 * GlobalChat.jsx - Quản lý cửa sổ chat toàn cục
 * * Container chịu trách nhiệm:
 * 1. Hiển thị nút bong bóng chat.
 * 2. Quản lý danh sách các hội thoại (Roster).
 * 3. Mount/Unmount ChatBox khi chọn shop khác nhau.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChatBox from "./ChatBox"; // Đảm bảo import đúng đường dẫn
import { MessageSquare, Trash2, ChevronDown, X } from "lucide-react";

// --- QUẢN LÝ LOCAL STORAGE ---
const chatRoster = {
  read: () => {
    try {
      const raw = localStorage.getItem("chat:roster");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  write: (arr) => {
    try {
      localStorage.setItem("chat:roster", JSON.stringify(arr));
    } catch {}
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
      // Nếu có lịch sử chat trước đó thì mở lại, không thì mở cái đầu tiên
      const targetId =
        lastActive && roster.some((c) => String(c.id) === String(lastActive))
          ? lastActive
          : String(roster[0].id);
      setActiveConvId(targetId);
    }
  }, []);

  // 2. Lưu trạng thái active
  useEffect(() => {
    if (activeConvId) {
      localStorage.setItem("chat:lastActiveId", activeConvId);
    }
  }, [activeConvId]);

  // 3. Lắng nghe sự kiện mở chat từ nút "Chat ngay" ở trang sản phẩm
  const handleOpenChat = useCallback((e) => {
    const { sellerId, sellerName, sellerImage } = e?.detail || {};
    if (!sellerId) return;

    const idStr = String(sellerId);

    setConversations((prev) => {
      const existing = prev.find((c) => String(c.id) === idStr);
      let nextRoster;

      if (existing) {
        // Đưa hội thoại này lên đầu danh sách & cập nhật thông tin mới nhất
        nextRoster = [
          { ...existing, name: sellerName, image: sellerImage },
          ...prev.filter((c) => String(c.id) !== idStr),
        ];
      } else {
        // Thêm mới vào đầu
        nextRoster = [
          { id: idStr, name: sellerName, image: sellerImage },
          ...prev,
        ];
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
    e.stopPropagation(); // Chặn sự kiện click lan ra ngoài (để không kích hoạt activeConvId)

    const newConversations = conversations.filter(
      (c) => String(c.id) !== String(idToRemove)
    );
    setConversations(newConversations);
    chatRoster.write(newConversations);

    // Nếu đang xóa đúng cái đang mở -> chuyển sang cái đầu tiên còn lại hoặc null
    if (String(activeConvId) === String(idToRemove)) {
      setActiveConvId(newConversations[0]?.id || null);
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => String(c.id) === String(activeConvId)),
    [conversations, activeConvId]
  );

  return (
    <>
      {/* CSS Nhúng (Inline Style Block cho tiện copy-paste) */}
      <style>{`
        .chat-widget-wrapper {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Nút tròn nổi */
        .chat-bubble-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .chat-bubble-btn:hover {
          transform: scale(1.1) rotate(-5deg);
        }

        /* Khung chat chính */
        .chat-panel {
          width: 800px;
          max-width: calc(100vw - 48px);
          height: 600px;
          max-height: calc(100vh - 100px);
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(0,0,0,0.08);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .panel-header {
          padding: 14px 20px;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }
        .icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: #6b7280;
          transition: background 0.2s;
          display: flex;
        }
        .icon-btn:hover { background: #f3f4f6; color: #111; }

        /* Body Layout */
        .panel-body {
          display: flex;
          flex: 1;
          overflow: hidden; /* Quan trọng để scroll bên trong */
        }

        /* Sidebar Danh sách shop */
        .chat-sidebar {
          width: 240px;
          background: #f9fafb;
          border-right: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        
        .conv-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          margin-bottom: 4px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .conv-item:hover { background: #e5e7eb; }
        .conv-item.active {
          background: #fff;
          border-color: #e5e7eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .conv-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e7ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .conv-avatar img { width: 100%; height: 100%; object-fit: cover; }
        
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { 
          display: block; 
          font-size: 14px; 
          font-weight: 500; 
          color: #374151;
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }

        .remove-btn {
          opacity: 0;
          padding: 4px;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 4px;
        }
        .conv-item:hover .remove-btn { opacity: 1; }
        .remove-btn:hover { color: #ef4444; background: #fee2e2; }

        /* Main Chat Area */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #fff;
          position: relative;
        }

        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          text-align: center;
          padding: 20px;
        }
      `}</style>

      <div className="chat-widget-wrapper">
        {!isOpen ? (
          <button
            className="chat-bubble-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Mở chat"
          >
            <MessageSquare size={28} />
          </button>
        ) : (
          <div className="chat-panel">
            {/* Header */}
            <header className="panel-header">
              <h3>Tin nhắn</h3>
              <button className="icon-btn" onClick={() => setIsOpen(false)}>
                <ChevronDown size={20} />
              </button>
            </header>

            <div className="panel-body">
              {/* Sidebar: Danh sách hội thoại */}
              <div className="chat-sidebar">
                <div className="sidebar-list">
                  {conversations.length === 0 ? (
                    <div
                      className="empty-state"
                      style={{ height: "auto", padding: "20px 0" }}
                    >
                      <span style={{ fontSize: 13 }}>Chưa có tin nhắn</span>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`conv-item ${String(activeConvId) === String(conv.id) ? "active" : ""}`}
                        onClick={() => setActiveConvId(String(conv.id))}
                      >
                        <div className="conv-avatar">
                          {conv.image ? (
                            <img src={conv.image} alt={conv.name} />
                          ) : (
                            <span>
                              {(conv.name || "S").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="conv-info">
                          <span className="conv-name">
                            {conv.name || `Shop #${conv.id}`}
                          </span>
                        </div>
                        <button
                          className="remove-btn"
                          title="Xóa cuộc trò chuyện"
                          onClick={(e) => removeConversation(e, conv.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Main: ChatBox */}
              <main className="chat-main">
                {token && activeConversation ? (
                  /* QUAN TRỌNG: 
                     Key = activeConversation.id giúp React unmount ChatBox cũ 
                     và mount ChatBox mới khi chuyển shop -> Reset state (messages, typing...)
                  */
                  <ChatBox
                    key={activeConversation.id}
                    sellerId={activeConversation.id}
                    sellerName={activeConversation.name}
                    sellerImage={activeConversation.image}
                    token={token}
                  />
                ) : (
                  <div className="empty-state">
                    {token ? (
                      <>
                        <MessageSquare
                          size={48}
                          strokeWidth={1.5}
                          style={{ marginBottom: 16, opacity: 0.5 }}
                        />
                        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                      </>
                    ) : (
                      <p>Vui lòng đăng nhập để chat</p>
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
