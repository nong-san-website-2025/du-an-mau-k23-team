import React, { useEffect, useMemo, useState } from "react";
import ChatBox from "./ChatBox.jsx";

// Global persistent chat bubble at bottom-right
// - Always visible toggle button
// - Maintains a roster (list) of sellers that user added by clicking "Nhắn tin" on store pages
// - Click bubble to open a panel with a sidebar list of sellers and the current chat on the right
export default function GlobalChat() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [sellers, setSellers] = useState([]); // [{ id, name, image }]
  const [currentId, setCurrentId] = useState(null);

  // Helpers to safely read/write localStorage
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

  // Init from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setToken(localStorage.getItem('token'));
    const roster = readRoster();
    setSellers(roster);

    // Prefer last opened seller if any
    const last = localStorage.getItem('chat:lastSellerId');
    if (last) {
      setCurrentId(last);
      // Ensure the last seller exists in roster (self-healing)
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

  // Listen for global "chat:open" events to add/select seller
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

  // Remove a seller from roster
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

  // UI styles
  const bubbleBtnStyle = {
    position: "fixed",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background: "#1677ff",
    color: "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
    cursor: "pointer",
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  };

  const panelStyle = {
    position: "fixed",
    right: 20,
    bottom: 84,
    width: 520,
    maxWidth: "95vw",
    border: "1px solid #ddd",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    zIndex: 1100,
    display: "flex",
    minHeight: 380,
  };

  const sidebarStyle = {
    width: 160,
    borderRight: "1px solid #eee",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  };

  const itemStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    cursor: "pointer",
    background: active ? "#e6f4ff" : "transparent",
    borderBottom: "1px solid #f0f0f0",
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
        {open ? "×" : "💬"}
      </button>

      {/* Chat panel with sidebar + inline ChatBox */}
      {open && (
        <div style={panelStyle}>
          <div style={sidebarStyle}>
            <div style={{ padding: 10, fontWeight: 600, borderBottom: "1px solid #eee" }}>Tin nhắn</div>
            {sellers.length === 0 && (
              <div style={{ padding: 10, fontSize: 13, color: "#777" }}>
                Chưa có cuộc trò chuyện.
                <br />Vào trang cửa hàng và nhấn "Nhắn tin" để thêm.
              </div>
            )}
            {sellers.map((s) => (
              <div key={s.id} style={itemStyle(String(currentId) === String(s.id))}>
                <div onClick={() => setCurrentId(String(s.id))} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.image ? (
                      <img src={s.image} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontWeight: 700 }}>{(s.name || "S").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name || `Shop #${s.id}`}</div>
                </div>
                <button onClick={() => removeSeller(s.id)} title="Gỡ khỏi danh sách" style={{ border: "none", background: "transparent", color: "#999", cursor: "pointer" }}>×</button>
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
              <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 14 }}>
                {token ? "Chọn một cuộc trò chuyện ở bên trái" : "Bạn cần đăng nhập để nhắn tin"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}