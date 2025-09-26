import React, { useEffect, useRef, useState, useMemo } from "react";
import useUserProfile from "../../users/services/useUserProfile";

// Realtime chat box synced with seller-center via conversation-based WebSocket
// Flow:
// 1) Ensure conversation exists via POST /api/chat/conversations/ { seller: sellerId }
// 2) Load history via GET /api/chat/conversations/<id>/messages/
// 3) Open WS: ws://localhost:8000/ws/chat/conv/<conversation_id>/?token=<JWT>
// Improvements:
// - Bubble UI (left/right like Zalo/Messenger)
// - Reliable send: prefer WS, fallback to REST when WS not ready
export default function ChatBox({ sellerId, token, userAvatar, sellerImage, sellerName, inline = false }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);
  const listRef = useRef(null);
  // Persist open state per seller; auto-open if previously activated
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

  // Persist when toggled; mark as always after first open
  useEffect(() => {
    try {
      localStorage.setItem(storageKeys.open, open ? '1' : '0');
      if (open) {
        localStorage.setItem(storageKeys.always, '1');
        // Remember last seller globally for site-wide chat persistence
        localStorage.setItem('chat:lastSellerId', String(sellerId));
      }
    } catch (e) {}
  }, [open, storageKeys, sellerId]);

  // Listen for global open request (e.g., from StoreDetail "Nhắn tin" button)
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
  // Normalize media URL to absolute (backend returns relative paths)
  const apiOrigin = useMemo(() => {
    try { return new URL(API_BASE_URL).origin; } catch { return ""; }
  }, []);
  const toAbsolute = (src) => {
    if (!src || typeof src !== "string") return null;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) return src;
    if (src.startsWith("/")) return `${apiOrigin}${src}`;
    return `${apiOrigin}/${src}`;
  };

  // Decode JWT to get current user id (SimpleJWT uses `user_id` claim)
  const currentUserId = useMemo(() => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.id || payload.sub || null;
    } catch (e) {
      return null;
    }
  }, [token]);

  // Get current user profile for name and avatar rendering
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

  // 1) Ensure conversation + 2) load history
  useEffect(() => {
    let cancelled = false;
    const ensureConversationAndHistory = async () => {
      if (!sellerId || !token) return;
      try {
        // Ensure conversation
        const convRes = await fetch(`${API_BASE_URL}/chat/conversations/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ seller: Number(sellerId) }),
        });
        if (!convRes.ok) throw new Error(`Create conv failed (${convRes.status})`);
        const conv = await convRes.json();
        if (cancelled) return;
        setConversationId(conv.id);

        // Load messages
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

  // 3) Open WebSocket for the conversation
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Add message if not already present
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

    // If only text and WS is ready, send via WS
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

  // Bubble styles
  const bubbleContainer = (mine) => ({
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
    marginBottom: 10,
    gap: 8,
    alignItems: "flex-end",
  });
  const bubble = (mine) => ({
    background: mine ? "#1677ff" : "#f5f5f5",
    color: mine ? "#fff" : "#000",
    padding: "8px 12px",
    borderRadius: 16,
    borderTopRightRadius: mine ? 4 : 16,
    borderTopLeftRadius: mine ? 16 : 4,
    maxWidth: 300,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  });
  const avatarBox = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    overflow: "hidden",
    background: "#eee",
    flexShrink: 0,
  };

  return (
    <div>
      {/* Floating toggle bubble at bottom-right (hidden in inline mode) */}
      {!inline && (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle chat"
          style={{
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
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {open ? "×" : "💬"}
        </button>
      )}

      {/* Chat panel */}
      {(inline || open) && (
        <div
          style={{
            position: inline ? "relative" : "fixed",
            right: inline ? undefined : 20,
            bottom: inline ? undefined : 84,
            width: 360,
            maxWidth: "90vw",
            border: "1px solid #ddd",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            boxShadow: inline ? "none" : "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 1000,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#fafafa", borderBottom: "1px solid #eee" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {sellerImage ? (
                <img src={sellerImage} alt={sellerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontWeight: 700 }}>{(sellerName || "S").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <strong>{sellerName || `Cửa hàng #${sellerId}`}</strong>
            {!wsReady && <span style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>Đang kết nối...</span>}
          </div>

          <div ref={listRef} style={{ height: 320, overflowY: "auto", padding: 10, background: "white" }}>
            {messages.map((m) => {
              const mine = currentUserId && m.sender === currentUserId;
              return (
                <div key={m.id || `${m.created_at}-${Math.random()}`} style={bubbleContainer(mine)}>
                  {!mine && (
                    <div style={avatarBox}>
                      {sellerImage ? (
                        <img src={sellerImage} alt={sellerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : null}
                    </div>
                  )}
                  <div style={bubble(mine)}>
                    {m.content && <div style={{ marginBottom: m.image ? 8 : 0 }}>{m.content}</div>}
                    {m.image && (
                      <div>
                        <img src={toAbsolute(m.image)} alt="attachment" style={{ maxWidth: 260, borderRadius: 8, display: 'block' }} />
                      </div>
                    )}
                  </div>
                  {mine && (
                    <div style={avatarBox} title={displayName || "Tôi"}>
                      {displayAvatar ? (
                        <img src={displayAvatar} alt={displayName || "me"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontWeight: 700 }}>{(displayName || "T").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee", background: "#fafafa", alignItems: "center" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 18 }}
            />
            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Chọn hình ảnh"
              aria-label="Chọn hình ảnh"
              style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
            >
              🖼️
            </button>
            <button onClick={sendMessage} disabled={uploading || (!input.trim() && !selectedFile)} style={{ padding: "8px 12px", borderRadius: 18, border: "none", background: "#1677ff", color: "white" }}>
              {uploading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      )}

      {/* Optional: small label under bubble to show current user name (only when not inline) */}
      {!inline && displayName && (
        <div style={{ position: "fixed", right: 20, bottom: 82, fontSize: 11, color: "#666" }}>
          Đang nhắn: <strong>{displayName}</strong>
        </div>
      )}
    </div>
  );
}