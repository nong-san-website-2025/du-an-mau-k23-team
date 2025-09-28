// GlobalChat.jsx (đã cải thiện giao diện)
import React, { useEffect, useMemo, useState } from "react";
import ChatBox from "./ChatBox.jsx";
import { MessageSquare } from "lucide-react";
import { AiOutlineMessage } from "react-icons/ai";

export default function GlobalChat() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [sellers, setSellers] = useState([]); // [{ id, name, image }]
  const [currentId, setCurrentId] = useState(null);

  const readRoster = () => {
    try {
      const raw = localStorage.getItem("chat:sellers");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  };
  const writeRoster = (arr) => {
    try { localStorage.setItem("chat:sellers", JSON.stringify(arr)); } catch (_) {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setToken(localStorage.getItem('token'));
    const roster = readRoster();
    setSellers(roster);

    const last = localStorage.getItem('chat:lastSellerId');
    if (last) {
      setCurrentId(last);
      const name = localStorage.getItem('chat:lastSellerName') || undefined;
      const image = localStorage.getItem('chat:lastSellerImage') || undefined;
      if (!roster.some(s => String(s.id) === String(last))) {
        const updated = [...roster, { id: String(last), name, image }];
        setSellers(updated);
        writeRoster(updated);
      }
    } else if (roster.length > 0) {
      setCurrentId(String(roster[0].id));
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const sid = e?.detail?.sellerId;
      if (!sid) return;
      const id = String(sid);
      const name = (typeof window !== 'undefined') ? (localStorage.getItem('chat:lastSellerName') || undefined) : undefined;
      const image = (typeof window !== 'undefined') ? (localStorage.getItem('chat:lastSellerImage') || undefined) : undefined;

      setSellers((prev) => {
        const exists = prev.some((s) => String(s.id) === id);
        const next = exists ? prev.map(s => String(s.id) === id ? { ...s, name: s.name || name, image: s.image || image } : s)
                             : [...prev, { id, name, image }];
        writeRoster(next);
        return next;
      });
      setCurrentId(id);
      setOpen(true);
    };
    window.addEventListener('chat:open', handler);
    return () => window.removeEventListener('chat:open', handler);
  }, []);

  const removeSeller = (id) => {
    setSellers((prev) => {
      const next = prev.filter((s) => String(s.id) !== String(id));
      writeRoster(next);
      return next;
    });
    if (String(currentId) === String(id)) {
      const nextList = sellers.filter((s) => String(s.id) !== String(id));
      setCurrentId(nextList[0]?.id || null);
    }
  };

  // Cải thiện giao diện
  const bubbleBtnStyle = {
    position: "fixed",
    right: 20,
    bottom: 10,
    width: 100,
    height: 50,
    borderRadius: 4,
    border: "none",
    background: "#1677ff",
    color: "#fff",
    boxShadow: "0 6px 16px rgba(22, 119, 255, 0.4)",
    cursor: "pointer",
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  };

  const panelStyle = {
    position: "fixed",
    right: 20,
    bottom: 100,
    width: 560,
    maxWidth: "95vw",
    border: "1px solid #e0e0e0",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    zIndex: 1100,
    display: "flex",
    minHeight: 450,
  };

  const sidebarStyle = {
    width: 180,
    borderRight: "1px solid #e9ecef",
    background: "#f8f9fa",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  };

  const itemStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 10px",
    cursor: "pointer",
    background: active ? "#e6f4ff" : "transparent",
    borderBottom: "1px solid #e9ecef",
    transition: "background 0.2s",
  });

  return (
    <div>
      {/* Always-visible chat bubble */}
      <button
        aria-label="Open chat"
        onClick={() => setOpen((v) => !v)}
        style={bubbleBtnStyle}
        title={open ? "Đóng chat" : "Mở chat"}
      >
        {open ? "×" : <AiOutlineMessage size={24} />}
      </button>

      {/* Chat panel with sidebar + inline ChatBox */}
      {open && (
        <div style={panelStyle}>
          <div style={sidebarStyle}>
            <div style={{ 
              padding: "14px", 
              fontWeight: 600, 
              borderBottom: "1px solid #e9ecef",
              background: "#f8f9fa",
              fontSize: 14,
              color: "#333"
            }}>
              Tin nhắn
            </div>
            {sellers.length === 0 && (
              <div style={{ 
                padding: 20, 
                fontSize: 13, 
                color: "#777",
                textAlign: "center",
                fontStyle: "italic"
              }}>
                Chưa có cuộc trò chuyện.
                <br />Vào trang cửa hàng và nhấn "Nhắn tin" để thêm.
              </div>
            )}
            {sellers.map((s) => (
              <div key={s.id} style={itemStyle(String(currentId) === String(s.id))}>
                <div 
                  onClick={() => setCurrentId(String(s.id))} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 10, 
                    flex: 1 
                  }}
                >
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: "50%", 
                    overflow: "hidden", 
                    background: "#eee", 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600
                  }}>
                    {s.image ? (
                      <img src={s.image} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span>{(s.name || "S").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis",
                    color: "#333"
                  }}>
                    {s.name || `Shop #${s.id}`}
                  </div>
                </div>
                <button 
                  onClick={() => removeSeller(s.id)} 
                  title="Gỡ khỏi danh sách" 
                  style={{ 
                    border: "none", 
                    background: "transparent", 
                    color: "#999", 
                    cursor: "pointer",
                    fontSize: 18,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {token && currentId ? (
              <ChatBox
                inline
                sellerId={currentId}
                token={token}
                sellerName={(typeof window !== 'undefined' && localStorage.getItem('chat:lastSellerId') === String(currentId) && localStorage.getItem('chat:lastSellerName')) || (sellers.find(s => String(s.id) === String(currentId))?.name)}
                sellerImage={(typeof window !== 'undefined' && localStorage.getItem('chat:lastSellerId') === String(currentId) && localStorage.getItem('chat:lastSellerImage')) || (sellers.find(s => String(s.id) === String(currentId))?.image)}
                userAvatar={(typeof window !== 'undefined' && localStorage.getItem('avatar')) || ''}
              />
            ) : (
              <div style={{ 
                height: 450, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#999", 
                fontSize: 14,
                background: "#f8f9fa"
              }}>
                {token ? "Chọn một cuộc trò chuyện ở bên trái" : "Bạn cần đăng nhập để nhắn tin"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}