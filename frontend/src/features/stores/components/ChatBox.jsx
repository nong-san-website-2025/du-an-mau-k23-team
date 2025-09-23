import React, { useEffect, useRef, useState, useMemo } from "react";

// Realtime chat box synced with seller-center via conversation-based WebSocket
// Flow:
// 1) Ensure conversation exists via POST /api/chat/conversations/ { seller: sellerId }
// 2) Load history via GET /api/chat/conversations/<id>/messages/
// 3) Open WS: ws://localhost:8000/ws/chat/conv/<conversation_id>/?token=<JWT>
// Improvements:
// - Bubble UI (left/right like Zalo/Messenger)
// - Reliable send: prefer WS, fallback to REST when WS not ready
export default function ChatBox({ sellerId, token, userAvatar, sellerImage, sellerName }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);

  const API_BASE_URL = "http://localhost:8000/api";

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

  const sendViaREST = async (text) => {
    if (!conversationId) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error(`REST send failed (${res.status})`);
      const data = await res.json();
      // If WS isn't open, append locally; otherwise, WS broadcast will arrive
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
    if (!text) return;

    // Try WS first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "message", content: text }));
        setInput("");
        return;
      } catch (e) {
        // fallthrough to REST
      }
    }

    // Fallback to REST when WS not ready
    const ok = await sendViaREST(text);
    if (ok) setInput("");
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
      {/* Floating toggle bubble at bottom-right */}
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

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 84,
            width: 360,
            maxWidth: "90vw",
            border: "1px solid #ddd",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
                  <div style={bubble(mine)}>{m.content}</div>
                  {mine && (
                    <div style={avatarBox}>
                      {userAvatar ? (
                        <img src={userAvatar} alt="me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee", background: "#fafafa" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 18 }}
            />
            <button onClick={sendMessage} disabled={!input.trim()} style={{ padding: "8px 12px", borderRadius: 18, border: "none", background: "#1677ff", color: "white" }}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}