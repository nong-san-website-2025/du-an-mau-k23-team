import React, { useEffect, useMemo, useRef, useState } from "react";
import { List, Avatar, Layout, Input, Button, Typography, Empty, Spin, message as antdMessage } from "antd";

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
  const wsRef = useRef(null);
  const listRef = useRef(null);

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedConv) return;
    try {
      // Prefer WebSocket for realtime sync; fallback to REST
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "message", content: text }));
        setInput("");
      } else {
        const res = await fetch(`${API_BASE_URL}/chat/conversations/${selectedConv.id}/messages/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        });
        if (!res.ok) throw new Error(`Send failed (${res.status})`);
        const data = await res.json();
        // If WS isn't open, append locally; otherwise WS broadcast will come
        if (!(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
          addUnique(data);
        }
        setInput("");
      }
    } catch (err) {
      console.error(err);
      antdMessage.error("Gửi tin nhắn thất bại");
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

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

  const buyerName = (conv) => {
    // conv.user may contain fields like full_name, username, email
    const u = conv?.user || {};
    return u.full_name || u.username || u.email || `Người mua #${u.id || "?"}`;
  };

  return (
    <Layout style={{ background: "#fff", height: "100%", minHeight: "80vh" }}>
      <Sider width={320} style={{ background: "#fff", borderRight: "1px solid #eee" }}>
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
                  avatar={<Avatar src={item?.user?.avatar} alt={buyerName(item)}>{buyerName(item).charAt(0)}</Avatar>}
                  title={<span>{buyerName(item)}</span>}
                  description={<Text type="secondary">#{item.id}</Text>}
                />
              </List.Item>
            )}
          />
        )}
      </Sider>
      <Content style={{ padding: 16 }}>
        {!selectedConv ? (
          <Empty description="Chọn một cuộc hội thoại để xem chi tiết" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>
              <Title level={5} style={{ margin: 0 }}>{buyerName(selectedConv)}</Title>
              <Text type="secondary">Cuộc hội thoại #{selectedConv.id}</Text>
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
                  const containerStyle = {
                    display: "flex",
                    justifyContent: isSeller ? "flex-end" : "flex-start",
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
                    maxWidth: 520,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  };
                  return (
                    <div key={m.id} style={containerStyle}>
                      <div style={bubbleStyle}>
                        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
                          {new Date(m?.created_at).toLocaleString()}
                        </div>
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="primary" onClick={handleSend} disabled={!input.trim()}>
                Gửi
              </Button>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
}