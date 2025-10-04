// ChatBox.jsx (đã cải thiện giao diện)
import React, { useEffect, useRef, useState, useMemo } from "react";
import useUserProfile from "../../users/services/useUserProfile";

export default function ChatBox({ sellerId, token, userAvatar, sellerImage, sellerName, inline = false }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);
  const listRef = useRef(null);

  const storageKeys = useMemo(() => ({
    always: `chat:always:${sellerId}`,
    open: `chat:open:${sellerId}`,
  }), [sellerId]);

  const getInitialOpen = () => {
    try {
      return (
        localStorage.getItem(storageKeys.always) === '1' ||
        localStorage.getItem(storageKeys.open) === '1'
      );
    } catch (e) { return false; }
  };
  const [open, setOpen] = useState(getInitialOpen);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeys.open, open ? '1' : '0');
      if (open) {
        localStorage.setItem(storageKeys.always, '1');
        localStorage.setItem('chat:lastSellerId', String(sellerId));
      }
    } catch (e) {}
  }, [open, storageKeys, sellerId]);

  useEffect(() => {
    const handler = (e) => {
      const targetId = e?.detail?.sellerId;
      if (String(targetId) === String(sellerId)) {
        setOpen(true);
        try {
          localStorage.setItem(storageKeys.always, '1');
          localStorage.setItem(storageKeys.open, '1');
        } catch (err) {}
      }
    };
    window.addEventListener('chat:open', handler);
    return () => window.removeEventListener('chat:open', handler);
  }, [sellerId, storageKeys]);

  const API_BASE_URL = "http://localhost:8000/api";
  const apiOrigin = useMemo(() => {
    try { return new URL(API_BASE_URL).origin; } catch { return ""; }
  }, []);
  const toAbsolute = (src) => {
    if (!src || typeof src !== "string") return null;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) return src;
    if (src.startsWith("/")) return `${apiOrigin}${src}`;
    return `${apiOrigin}/${src}`;
  };

  const currentUserId = useMemo(() => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.id || payload.sub || null;
    } catch (e) {
      return null;
    }
  }, [token]);

  const profile = useUserProfile();
  const displayName = useMemo(() => {
    if (!profile) return undefined;
    if (profile.full_name && profile.full_name.trim()) return profile.full_name.trim();
    return profile.username;
  }, [profile]);
  const displayAvatar = useMemo(() => {
    if (!profile) return undefined;
    return profile.avatar || (typeof window !== 'undefined' ? localStorage.getItem('avatar') || undefined : undefined);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    const ensureConversationAndHistory = async () => {
      if (!sellerId || !token) return;
      try {
        const convRes = await fetch(`${API_BASE_URL}/chat/conversations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ seller: Number(sellerId) }),
        });
        if (!convRes.ok) throw new Error(`Create conv failed (${convRes.status})`);
        const conv = await convRes.json();
        if (cancelled) return;
        setConversationId(conv.id);

        const msgRes = await fetch(`${API_BASE_URL}/chat/conversations/${conv.id}/messages/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await msgRes.json();
        if (cancelled) return;
        setMessages(Array.isArray(data) ? data : data?.results || []);
      } catch (e) {
        console.error(e);
      }
    };
    ensureConversationAndHistory();
    return () => { cancelled = true; };
  }, [sellerId, token]);

  useEffect(() => {
    if (!conversationId || !token) return;
    const url = `ws://localhost:8000/ws/chat/conv/${conversationId}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setWsReady(true);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "message" && payload.data) {
          addUnique(payload.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    ws.onclose = () => { wsRef.current = null; setWsReady(false); };

    return () => ws.close();
  }, [conversationId, token]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const addUnique = (msg) => {
    setMessages((prev) => {
      if (!msg?.id) return [...prev, msg];
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const sendViaREST = async (text, file) => {
    if (!conversationId) return false;
    try {
      let res;
      if (file) {
        const form = new FormData();
        form.append("content", text);
        form.append("image", file);
        res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      } else {
        res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: text }),
        });
      }
      if (!res.ok) throw new Error(`REST send failed (${res.status})`);
      const data = await res.json();
      if (!(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
        addUnique(data);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    const file = selectedFile || fileInputRef.current?.files?.[0] || null;
    if (!text && !file) return;

    if (!file && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "message", content: text }));
        setInput("");
        return;
      } catch (e) {
        // fallthrough to REST
      }
    }

    setUploading(!!file);
    const ok = await sendViaREST(text, file);
    if (ok) {
      setInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
    }
    setUploading(false);
  };

  if (!token) {
    return null;
  }

  // Cải thiện giao diện
  const bubbleContainer = (mine) => ({
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
    marginBottom: 12,
    gap: 10,
    alignItems: "flex-end",
  });
  
  const bubble = (mine) => ({
    background: mine ? "#1677ff" : "#f0f2f5",
    color: mine ? "#fff" : "#000",
    padding: "10px 14px",
    borderRadius: 18,
    borderTopRightRadius: mine ? 4 : 18,
    borderTopLeftRadius: mine ? 18 : 4,
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  });
  
  const avatarBox = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    overflow: "hidden",
    background: "#eee",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
  };

  return (
    <div>
      {(inline || open) && (
        <div
          style={{
            position: inline ? "relative" : "fixed",
            right: inline ? undefined : 20,
            bottom: inline ? undefined : 84,
            width: 380,
            maxWidth: "90vw",
            border: "1px solid #e0e0e0",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
            boxShadow: inline ? "none" : "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            height: 480,
          }}
        >
          {/* Header với nút đóng */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
            background: "#f8f9fa",
            borderBottom: "1px solid #e9ecef",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: "50%", 
                overflow: "hidden", 
                background: "#eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {sellerImage ? (
                  <img src={sellerImage} alt={sellerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontWeight: 700, color: "#666" }}>{(sellerName || "S").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <strong style={{ color: "#333", fontSize: 15 }}>{sellerName || `Cửa hàng #${sellerId}`}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!wsReady}
              <button 
                onClick={() => setOpen(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "none",
                  background: "#e9ecef",
                  color: "#666",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages container */}
          <div ref={listRef} style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: 16,
            background: "#f0f2f5",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
            {messages.map((m) => {
              const mine = currentUserId && m.sender === currentUserId;
              return (
                <div key={m.id || `${m.created_at}-${Math.random()}`} style={bubbleContainer(mine)}>
                  {!mine && (
                    <div style={avatarBox}>
                      {sellerImage ? (
                        <img src={sellerImage} alt={sellerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>{(sellerName || "S").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  )}
                  <div style={bubble(mine)}>
                    {m.content && <div style={{ marginBottom: m.image ? 8 : 0 }}>{m.content}</div>}
                    {m.image && (
                      <div>
                        <img 
                          src={toAbsolute(m.image)} 
                          alt="attachment" 
                          style={{ 
                            maxWidth: 200, 
                            borderRadius: 8, 
                            display: 'block',
                            border: "1px solid #ddd"
                          }} 
                        />
                      </div>
                    )}
                  </div>
                  {mine && (
                    <div style={avatarBox} title={displayName || "Tôi"}>
                      {displayAvatar ? (
                        <img src={displayAvatar} alt={displayName || "me"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>{(displayName || "T").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input area */}
          <div style={{ 
            display: "flex", 
            gap: 10, 
            padding: 12, 
            borderTop: "1px solid #e9ecef", 
            background: "#f8f9fa",
            alignItems: "center"
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              style={{ 
                flex: 1, 
                padding: "10px 14px", 
                border: "1px solid #ddd", 
                borderRadius: 20,
                fontSize: 14,
                background: "#fff"
              }}
            />
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
              style={{ display: "none" }} 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Chọn hình ảnh"
              aria-label="Chọn hình ảnh"
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: "50%", 
                border: "1px solid #ddd", 
                background: "#fff", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18
              }}
            >
              📷
            </button>
            <button 
              onClick={sendMessage} 
              disabled={uploading || (!input.trim() && !selectedFile)} 
              style={{ 
                padding: "10px 16px", 
                borderRadius: 20, 
                border: "none", 
                background: "#1677ff", 
                color: "white",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: 14
              }}
            >
              {uploading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}