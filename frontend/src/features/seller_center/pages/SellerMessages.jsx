import React, { useEffect, useMemo, useRef, useState } from "react";
import { List, Avatar, Layout, Input, Button, Typography, Empty, Spin, message as antdMessage } from "antd";
import { PictureOutlined } from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

// Seller inbox with realtime WebSocket synced by conversation id
// - REST for initial data
// - WebSocket: ws://localhost:8000/ws/chat/conv/<conversation_id>/?token=<JWT>

const API_BASE_URL = "http://localhost:8000/api";

export default function SellerMessages() {
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const wsRef = useRef(null);
  const listRef = useRef(null);

  // Buyer profile resolved from users/<id>/ to ensure latest avatar + name
  const [buyerProfile, setBuyerProfile] = useState(null);
  // Cache buyer profiles to show name/avatar even before selection
  const [profiles, setProfiles] = useState({});

  // Resolve buyer id robustly for a conversation object (supports different shapes)
  const getBuyerId = (conv) => {
    if (!conv) return null;
    const raw = conv.user ?? conv.buyer ?? conv.customer ?? conv.user_profile ?? conv.buyer_profile;
    let buyerId = null;
    if (raw && typeof raw === "object") {
      buyerId = raw.id || raw.user_id || null;
    } else if (typeof raw === "number") {
      buyerId = raw;
    } else if (typeof raw === "string" && raw.trim()) {
      const n = Number(raw);
      buyerId = Number.isNaN(n) ? null : n;
    }
    if (!buyerId) {
      const cand = conv.user_id ?? conv.buyer_id ?? conv.customer_id;
      if (typeof cand === "number") buyerId = cand;
      else if (typeof cand === "string" && cand.trim() && !Number.isNaN(Number(cand))) buyerId = Number(cand);
    }
    if (!buyerId && Array.isArray(conv.participants)) {
      const other = conv.participants.find((p) => {
        const pid = p?.id || p?.user?.id || p?.user_id;
        return !currentUserId || (pid && pid !== currentUserId);
      }) || conv.participants[0];
      const pid = other?.id || other?.user?.id || other?.user_id;
      if (typeof pid === "number") buyerId = pid;
      else if (typeof pid === "string" && pid.trim() && !Number.isNaN(Number(pid))) buyerId = Number(pid);
    }
    return buyerId;
  };

  const mergeProfileIntoCache = (id, data) => {
    if (!id || !data) return;
    setProfiles((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...data } }));
  };

  const token = useMemo(() => localStorage.getItem("token"), []);

  // Decode JWT to get current seller user id
  const currentUserId = useMemo(() => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.id || payload.sub || null;
    } catch (e) {
      return null;
    }
  }, [token]);

  const fetchConversations = async () => {
    if (!token) return;
    try {
      setLoadingConvs(true);
      const res = await fetch(`${API_BASE_URL}/chat/conversations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch conversations failed (${res.status})`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error(err);
      antdMessage.error("Không tải được danh sách cuộc hội thoại");
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!token || !convId) return;
    try {
      setLoadingMsgs(true);
      const res = await fetch(`${API_BASE_URL}/chat/conversations/${convId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch messages failed (${res.status})`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error(err);
      antdMessage.error("Không tải được tin nhắn");
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
  };

  // Resolve buyer profile via users/<id>/ when a conversation is selected
  useEffect(() => {
    let alive = true; // avoid leaking profile between quick-selection changes
    async function loadBuyerProfile() {
      try {
        setBuyerProfile(null);
        if (!selectedConv || !token) return;

        // Detect buyer id from conversation. Backend returns `user` as PK (number), not nested object.
        const raw = selectedConv.user || selectedConv.buyer || selectedConv.customer || selectedConv.user_profile || selectedConv.buyer_profile;

        let buyerId = null;
        if (raw && typeof raw === "object") {
          buyerId = raw.id || raw.user_id || null;
        } else if (typeof raw === "number") {
          buyerId = raw;
        } else if (typeof raw === "string" && raw.trim()) {
          const n = Number(raw);
          buyerId = Number.isNaN(n) ? null : n;
        }

        // Additional common id shapes
        if (!buyerId) {
          const cand = selectedConv.user_id || selectedConv.buyer_id || selectedConv.customer_id;
          if (typeof cand === "number") buyerId = cand;
          else if (typeof cand === "string" && cand.trim() && !Number.isNaN(Number(cand))) buyerId = Number(cand);
        }

        // Fallback: participants array (if API ever provides it)
        if (!buyerId && Array.isArray(selectedConv.participants)) {
          const other = selectedConv.participants.find((p) => {
            const pid = p?.id || p?.user?.id || p?.user_id;
            return !currentUserId || (pid && pid !== currentUserId);
          }) || selectedConv.participants[0];
          const pid = other?.id || other?.user?.id || other?.user_id;
          if (typeof pid === "number") buyerId = pid;
          else if (typeof pid === "string" && pid.trim() && !Number.isNaN(Number(pid))) buyerId = Number(pid);
        }

        if (!buyerId) return;

        const res = await fetch(`${API_BASE_URL}/users/${buyerId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Fetch buyer profile failed (${res.status})`);
        const data = await res.json();
        if (!alive) return; // ensure we set state only for current selection
        setBuyerProfile(data);
        // Also store into cache so sidebar can show immediately
        mergeProfileIntoCache(buyerId, data);
      } catch (e) {
        // Soft fail; keep existing fallbacks
        console.warn("Load buyer profile failed", e);
      }
    }
    loadBuyerProfile();
    return () => { alive = false; };
  }, [selectedConv, token, currentUserId]);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    const file = selectedFile || fileInputRef.current?.files?.[0] || null;
    if (!selectedConv) return;
    if (!text && !file) return; // require text or image
    try {
      // If sending text only and WS is open, prefer WS
      if (!file && text && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "message", content: text }));
        setInput("");
        return;
      }

      // Use REST (multipart if image)
      setUploading(!!file);
      let res;
      if (file) {
        const form = new FormData();
        form.append("content", text);
        form.append("image", file);
        res = await fetch(`${API_BASE_URL}/chat/conversations/${selectedConv.id}/messages/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      } else {
        res = await fetch(`${API_BASE_URL}/chat/conversations/${selectedConv.id}/messages/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        });
      }

      if (!res.ok) throw new Error(`Send failed (${res.status})`);
      const data = await res.json();
      if (!(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
        addUnique(data);
      }
      setInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      antdMessage.error("Gửi tin nhắn thất bại");
    } finally {
      setUploading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Preload buyer profiles so the list shows name/avatar without needing selection
  useEffect(() => {
    if (!token || !conversations || conversations.length === 0) return;
    let aborted = false;

    const idsSet = new Set();
    conversations.forEach((c) => {
      const id = getBuyerId(c);
      if (id) idsSet.add(id);
    });
    const ids = Array.from(idsSet);

    // Fetch profiles not yet in cache
    const missing = ids.filter((id) => !profiles[id]);
    if (missing.length === 0) return;

    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const res = await fetch(`${API_BASE_URL}/users/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error(`Fetch buyer ${id} failed (${res.status})`);
              const data = await res.json();
              return { id, data };
            } catch (e) {
              console.warn("Prefetch buyer profile failed", id, e);
              return null;
            }
          })
        );
        if (aborted) return;
        results.filter(Boolean).forEach((r) => mergeProfileIntoCache(r.id, r.data));
      } catch (e) {
        // swallow prefetch errors
      }
    })();

    return () => {
      aborted = true;
    };
  }, [conversations, token]);

  // Add message if not already present
  const addUnique = (msg) => {
    setMessages((prev) => {
      if (!msg?.id) return [...prev, msg];
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  // Load messages when selecting conversation
  useEffect(() => {
    if (selectedConv?.id) fetchMessages(selectedConv.id);
  }, [selectedConv?.id]);

  // Open WebSocket for selected conversation
  useEffect(() => {
    if (!selectedConv?.id || !token) return;
    const url = `ws://localhost:8000/ws/chat/conv/${selectedConv.id}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

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

    ws.onclose = () => { wsRef.current = null; };

    return () => ws.close();
  }, [selectedConv?.id, token]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const buyerName = (conv) => {
    // Prefer cached profile by buyer id for consistent display across list
    const id = getBuyerId(conv);
    const cached = id ? profiles[id] : null;
    if (cached) {
      return (
        cached.full_name || cached.name || cached.username || cached.email || `Người mua #${cached.id || id || "?"}`
      );
    }

    // As a fallback, if this is the selected conversation and we have buyerProfile, use it
    if (buyerProfile && conv?.id === selectedConv?.id) {
      return buyerProfile.full_name || buyerProfile.name || buyerProfile.username || buyerProfile.email || `Người mua #${buyerProfile.id || "?"}`;
    }

    // With our backend, `conv.user` is the buyer id (number). There is no participants array.
    const u = conv?.user;
    const fallbackName = `Người mua #${u ?? "?"}`;

    if (u && typeof u === "object") {
      return u.full_name || u.name || u.username || u.email || fallbackName;
    }

    return fallbackName;
  };

  // Normalize media URL to absolute (backend returns relative paths)
  const apiOrigin = useMemo(() => {
    try { return new URL(API_BASE_URL).origin; } catch { return ""; }
  }, []);
  const toAbsolute = (src) => {
    if (!src) return null;
    if (typeof src !== "string") return null;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) return src;
    if (src.startsWith("/")) return `${apiOrigin}${src}`;
    return `${apiOrigin}/${src}`;
  };

  const buyerAvatar = (conv) => {
    // Prefer cached profile by buyer id
    const id = getBuyerId(conv);
    const cached = id ? profiles[id] : null;
    if (cached?.avatar) return toAbsolute(cached.avatar);

    // Fallback: selected conversation's loaded profile
    if (buyerProfile?.avatar && conv?.id === selectedConv?.id) return toAbsolute(buyerProfile.avatar);

    // If conv.user is an object with avatar (unlikely), use it
    const u = conv?.user;
    if (u && typeof u === "object" && u.avatar) return toAbsolute(u.avatar);

    return null;
  };

  return (
    <Layout style={{ background: "#fff", height: "100%", minHeight: "80vh" }}>
      <Sider
        width={window.innerWidth < 768 ? 280 : 320}
        style={{
          background: "#fff",
          borderRight: "1px solid #eee",
          display: window.innerWidth < 768 ? 'none' : 'block'
        }}
      >
        <div style={{ padding: 16 }}>
          <Title level={4} style={{ marginBottom: 12 }}>
            Hộp thư
          </Title>
          <Button onClick={fetchConversations}>Làm mới</Button>
        </div>
        {loadingConvs ? (
          <div style={{ padding: 16 }}>
            <Spin /> Đang tải cuộc hội thoại...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 16 }}>
            <Empty description="Chưa có cuộc hội thoại" />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={conversations}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleSelectConversation(item)}
                style={{ cursor: "pointer", background: selectedConv?.id === item.id ? "#f5faff" : "transparent", paddingLeft: 16, paddingRight: 16 }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={buyerAvatar(item)} alt={buyerName(item)}>{buyerName(item).charAt(0)}</Avatar>}
                  title={<span>{buyerName(item)}</span>}
                  description={<Text type="secondary">#{item.id}</Text>}
                />
              </List.Item>
            )}
          />
        )}
      </Sider>
      <Content style={{ padding: window.innerWidth < 768 ? 8 : 16 }}>
        {!selectedConv ? (
          <div>
            {/* Mobile: Show conversation list when no selection */}
            {window.innerWidth < 768 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ marginBottom: 12 }}>
                  Hộp thư
                </Title>
                <Button onClick={fetchConversations} style={{ marginBottom: 12 }}>Làm mới</Button>
                {loadingConvs ? (
                  <div style={{ padding: 16 }}>
                    <Spin /> Đang tải cuộc hội thoại...
                  </div>
                ) : conversations.length === 0 ? (
                  <div style={{ padding: 16 }}>
                    <Empty description="Chưa có cuộc hội thoại" />
                  </div>
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={conversations}
                    renderItem={(item) => (
                      <List.Item
                        onClick={() => handleSelectConversation(item)}
                        style={{ cursor: "pointer", background: selectedConv?.id === item.id ? "#f5faff" : "transparent", paddingLeft: 16, paddingRight: 16 }}
                      >
                        <List.Item.Meta
                          avatar={<Avatar src={buyerAvatar(item)} alt={buyerName(item)}>{buyerName(item).charAt(0)}</Avatar>}
                          title={<span>{buyerName(item)}</span>}
                          description={<Text type="secondary">#{item.id}</Text>}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
            <Empty description="Chọn một cuộc hội thoại để xem chi tiết" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: window.innerWidth < 768 ? "calc(100vh - 200px)" : "calc(100vh - 140px)" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar src={buyerAvatar(selectedConv)} alt={buyerName(selectedConv)}>
                {buyerName(selectedConv).charAt(0)}
              </Avatar>
              <div>
                <Title level={5} style={{ margin: 0 }}>{buyerName(selectedConv)}</Title>
                <Text type="secondary">Cuộc hội thoại #{selectedConv.id}</Text>
              </div>
            </div>

            <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, marginTop: 12 }}>
              {loadingMsgs ? (
                <div style={{ padding: 16 }}>
                  <Spin /> Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <Empty description="Chưa có tin nhắn" />
              ) : (
                messages.map((m) => {
                  // Right align if message is from the current seller user
                  const isSeller = currentUserId && m.sender === currentUserId;

                  const displayNameBuyer = buyerName(selectedConv);
                  const displayAvatarBuyer = selectedConv?.user?.avatar;

                  const containerStyle = {
                    display: "flex",
                    justifyContent: isSeller ? "flex-end" : "flex-start",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 10,
                  };
                  const bubbleStyle = {
                    background: isSeller ? "#1677ff" : "#fff",
                    color: isSeller ? "#fff" : "#000",
                    border: isSeller ? "none" : "1px solid #eee",
                    padding: "8px 12px",
                    borderRadius: 16,
                    borderTopRightRadius: isSeller ? 4 : 16,
                    borderTopLeftRadius: isSeller ? 16 : 4,
                    maxWidth: window.innerWidth < 768 ? 280 : 520,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  };
                  return (
                    <div key={m.id} style={containerStyle}>
                      {/* Show buyer avatar on the left for buyer messages */}
                      {!isSeller && (
                        <Avatar src={buyerAvatar(selectedConv)} alt={buyerName(selectedConv)}>
                          {buyerName(selectedConv)?.charAt(0)}
                        </Avatar>
                      )}
                      <div style={bubbleStyle}>
                        {/* Show buyer name above their messages */}
                        {!isSeller && (
                          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                            {buyerName(selectedConv)}
                          </div>
                        )}
                        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
                          {new Date(m?.created_at).toLocaleString()}
                        </div>
                        {/* Text content (if any) */}
                        {m.content && <div style={{ marginBottom: m.image ? 8 : 0 }}>{m.content}</div>}
                        {/* Image attachment (if any) */}
                        {m.image && (
                          <div>
                            <img src={toAbsolute(m.image)} alt="attachment" style={{ maxWidth: window.innerWidth < 768 ? 250 : 300, borderRadius: 8, display: 'block' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: 'flex-end' }}>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                {/* Hidden native input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                {/* Icon button to trigger file dialog */}
                <Button
                  icon={<PictureOutlined />}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Chọn hình ảnh"
                />
                <Button type="primary" onClick={handleSend} disabled={uploading || (!input.trim() && !selectedFile)}>
                  {uploading ? 'Đang gửi...' : 'Gửi'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
}