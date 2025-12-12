/**
 * GlobalChat.jsx - Cải tiến và Hiện đại hóa
 *
 * Chức năng chính:
 * - Đóng vai trò là container chính cho toàn bộ giao diện chat.
 * - Quản lý trạng thái đóng/mở của panel chat.
 * - Quản lý danh sách các cuộc trò chuyện (conversations) và cuộc trò chuyện đang hoạt động.
 * - Lắng nghe sự kiện `chat:open` để bắt đầu một cuộc trò chuyện mới.
 * - Là "Single Source of Truth", truyền dữ liệu xuống cho ChatBox qua props.
 *
 * Cải tiến:
 * - Giao diện được thay đổi: icon và khung chat thay thế lẫn nhau.
 * - Thêm header vào khung chat với nút thu nhỏ, cải thiện trải nghiệm người dùng.
 * - Cấu trúc code rõ ràng, hiện đại hơn với React Hooks.
 */
import React, { useState, useEffect, useCallback } from "react";
import ChatBox from "./ChatBox.jsx";
import { MessageSquare, Users, Trash2, ChevronDown } from "lucide-react";

// Helper để quản lý danh sách cuộc trò chuyện trong localStorage
const chatRoster = {
  read: () => {
    try {
      const raw = localStorage.getItem("chat:roster");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  },
  write: (arr) => {
    try {
      localStorage.setItem("chat:roster", JSON.stringify(arr));
    } catch (_) {}
  },
};

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);

  // Khởi tạo state từ localStorage khi component được mount
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    const roster = chatRoster.read();
    setConversations(roster);
    if (roster.length > 0) {
      const lastActiveId = localStorage.getItem("chat:lastActiveId");
      if (lastActiveId && roster.some(c => String(c.id) === String(lastActiveId))) {
        setActiveConvId(lastActiveId);
      } else {
        setActiveConvId(String(roster[0].id));
      }
    }
  }, []);

  // Lưu ID cuộc trò chuyện đang hoạt động vào localStorage
  useEffect(() => {
    if (activeConvId) {
      localStorage.setItem("chat:lastActiveId", activeConvId);
    }
  }, [activeConvId]);

  // Lắng nghe sự kiện `chat:open` từ các nơi khác trong ứng dụng
  const handleOpenChat = useCallback((e) => {
    const { sellerId, sellerName, sellerImage } = e?.detail || {};
    if (!sellerId) return;

    const id = String(sellerId);
    
    setConversations(prev => {
      const exists = prev.some(c => String(c.id) === id);
      let next;
      if (exists) {
        next = [
          { ...prev.find(c => String(c.id) === id), name: sellerName, image: sellerImage },
          ...prev.filter(c => String(c.id) !== id)
        ];
      } else {
        next = [{ id, name: sellerName, image: sellerImage }, ...prev];
      }
      chatRoster.write(next);
      return next;
    });

    setActiveConvId(id);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("chat:open", handleOpenChat);
    return () => window.removeEventListener("chat:open", handleOpenChat);
  }, [handleOpenChat]);

  // Xóa một cuộc trò chuyện khỏi danh sách
  const removeConversation = (idToRemove, e) => {
    e.stopPropagation();
    const newConversations = conversations.filter(c => String(c.id) !== String(idToRemove));
    setConversations(newConversations);
    chatRoster.write(newConversations);

    if (String(activeConvId) === String(idToRemove)) {
      setActiveConvId(newConversations[0]?.id || null);
    }
  };

  const activeConversation = conversations.find(c => String(c.id) === String(activeConvId));

  return (
    <>
      <style>{`
        .chat-widget-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1100;
        }
        .chat-bubble-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #16a34a; /* Green */
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        .chat-bubble-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }
        .chat-panel {
          width: 600px;
          max-width: calc(100vw - 40px);
          height: 70vh;
          min-height: 450px;
          max-height: 700px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          animation: slideUp 0.3s ease forwards;
        }
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          flex-shrink: 0;
        }
        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .minimize-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .minimize-btn:hover { background: #e9ecef; }

        .panel-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }

        .chat-sidebar {
          width: 200px;
          border-right: 1px solid #e9ecef;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
        }
        .sidebar-header {
          padding: 16px;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
        }
        .conv-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #e9ecef;
        }
        .conv-item:hover { background: #f1f3f5; }
        .conv-item.active { background: #e6f4ff; }
        .conv-details { display: flex; align-items: center; gap: 10px; overflow: hidden; }
        .conv-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #495057;
          flex-shrink: 0;
        }
        .conv-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .conv-name { font-size: 14px; font-weight: 500; color: #343a40; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .remove-conv-btn {
          border: none;
          background: transparent;
          color: #adb5bd;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remove-conv-btn:hover { color: #495057; background: #dee2e6; }
        .chat-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .empty-chat-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #868e96;
          font-size: 14px;
          background: #f8f9fa;
          text-align: center;
          padding: 20px;
        }
      `}</style>

      <div className="chat-widget-container">
        {!isOpen ? (
          <button
            className="chat-bubble-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Mở chat"
            title="Mở chat"
          >
            <MessageSquare size={28} />
          </button>
        ) : (
          <div className="chat-panel">
            <header className="panel-header">
              <h3>Tin Nhắn</h3>
              <button className="minimize-btn" onClick={() => setIsOpen(false)} title="Thu nhỏ">
                <ChevronDown size={20} />
              </button>
            </header>
            <div className="panel-body">
              <div className="chat-sidebar">
                <div className="sidebar-list">
                  {conversations.length === 0 ? (
                    <div className="empty-chat-view" style={{height: 'auto'}}>
                      Chưa có cuộc trò chuyện nào.
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`conv-item ${String(activeConvId) === String(conv.id) ? "active" : ""}`}
                        onClick={() => setActiveConvId(String(conv.id))}
                      >
                        <div className="conv-details">
                          <div className="conv-avatar">
                            {conv.image ? (
                              <img src={conv.image} alt={conv.name} />
                            ) : (
                              <span>{(conv.name || "S").charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="conv-name" title={conv.name || `Shop #${conv.id}`}>
                            {conv.name || `Shop #${conv.id}`}
                          </span>
                        </div>
                        <button
                          className="remove-conv-btn"
                          title="Xóa cuộc trò chuyện"
                          onClick={(e) => removeConversation(conv.id, e)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

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
                  <div className="empty-chat-view">
                    {token ? (
                      <>
                        <MessageSquare size={48} strokeWidth={1} />
                        <p style={{marginTop: 16}}>Chọn một cuộc trò chuyện để bắt đầu.</p>
                      </>
                    ) : (
                      <p>Bạn cần đăng nhập để sử dụng tính năng này.</p>
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