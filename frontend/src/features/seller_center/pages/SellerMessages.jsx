import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  List, Avatar, Layout, Input, Button, Typography, Empty, Spin,
  message as antdMessage, Drawer, Badge, Tooltip, theme, Dropdown, Menu
} from "antd";
import {
  PictureOutlined, MenuOutlined, SendOutlined,
  UserOutlined, CloseCircleFilled, MoreOutlined, ReloadOutlined,
  FileImageOutlined
} from "@ant-design/icons";

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;
const { useToken } = theme;

const API_BASE_URL = "http://localhost:8000/api";

// --- FORMAT DATE HELPER (Senior UX: Hiển thị thời gian thông minh) ---
const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Format: HH:mm - DD/MM/YYYY
  return date.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', minute: '2-digit', 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  });
};

export default function SellerMessages() {
  // ================= STATE & LOGIC (GIỮ NGUYÊN) =================
  const { token: antdToken } = useToken(); // Sử dụng Token của Antd để đồng bộ màu

  const token = useMemo(() => localStorage.getItem("token"), []);

  const currentUserId = useMemo(() => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.id || payload.sub || null;
    } catch (e) {
      return null;
    }
  }, [token]);
  
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);
  const listRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!token || !currentUserId) return;
    
    // Kết nối vào group updates của riêng user này
    const url = `ws://localhost:8000/ws/updates/?token=${encodeURIComponent(token)}`;
    const updateWs = new WebSocket(url);

    updateWs.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.event === "sidebar_refresh") {
            // Khi có khách mới hoặc tin mới, tự động fetch lại list hoặc chèn vào đầu list
            fetchConversations(); 
            antdMessage.info(`Bạn có tin nhắn mới từ ${payload.data.sender_name || 'khách hàng'}`);
        }
    };
    return () => updateWs.close();
}, [token, currentUserId]);

  const isMobile = windowWidth < 768;
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [profiles, setProfiles] = useState({});

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
    if (isMobile) setDrawerVisible(false);
  };

  useEffect(() => {
    let alive = true;
    async function loadBuyerProfile() {
      try {
        setBuyerProfile(null);
        if (!selectedConv || !token) return;
        const buyerId = getBuyerId(selectedConv);
        if (!buyerId) return;

        const res = await fetch(`${API_BASE_URL}/users/info/${buyerId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Fetch buyer profile failed (${res.status})`);
        const data = await res.json();
        if (!alive) return;
        setBuyerProfile(data);
        mergeProfileIntoCache(buyerId, data);
      } catch (e) {
        console.warn("Load buyer profile failed", e);
      }
    }
    loadBuyerProfile();
    return () => { alive = false; };
  }, [selectedConv, token, currentUserId]);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const previewImage = useMemo(() => {
    return selectedFile ? URL.createObjectURL(selectedFile) : null;
  }, [selectedFile]);

  const handleSend = async () => {
    const text = input.trim();
    const file = selectedFile || fileInputRef.current?.files?.[0] || null;
    if (!selectedConv) return;
    if (!text && !file) return;
    try {
      if (!file && text && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "message", content: text }));
        setInput("");
        return;
      }
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

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (!token || !conversations || conversations.length === 0) return;
    const idsSet = new Set();
    conversations.forEach((c) => {
      const id = getBuyerId(c);
      if (id) idsSet.add(id);
    });
    const ids = Array.from(idsSet);
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
              if (!res.ok) throw new Error();
              const data = await res.json();
              return { id, data };
            } catch (e) { return null; }
          })
        );
        results.filter(Boolean).forEach((r) => mergeProfileIntoCache(r.id, r.data));
      } catch (e) { }
    })();
  }, [conversations, token]);

  const addUnique = (msg) => {
    setMessages((prev) => {
      if (!msg?.id) return [...prev, msg];
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  useEffect(() => { if (selectedConv?.id) fetchMessages(selectedConv.id); }, [selectedConv?.id]);

  useEffect(() => {
    if (!selectedConv?.id || !token) return;
    const url = `ws://localhost:8000/ws/chat/conv/${selectedConv.id}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "message" && payload.data) addUnique(payload.data);
      } catch (e) { console.error(e); }
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => ws.close();
  }, [selectedConv?.id, token]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, selectedConv, previewImage]);

  const buyerName = (conv) => {
    const id = getBuyerId(conv);
    const cached = id ? profiles[id] : null;
    if (cached) return cached.full_name || cached.name || cached.username || cached.email || `User #${id}`;
    if (buyerProfile && conv?.id === selectedConv?.id) return buyerProfile.full_name || buyerProfile.name || buyerProfile.username || buyerProfile.email;
    const u = conv?.user;
    if (u && typeof u === "object") return u.full_name || u.name || u.username || u.email;
    return `Người mua #${u ?? "?"}`;
  };

  const apiOrigin = useMemo(() => {
    try { return new URL(API_BASE_URL).origin; } catch { return ""; }
  }, []);

  const toAbsolute = (src) => {
    if (!src) return null;
    if (typeof src !== "string") return null;
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    if (src.startsWith("/")) return `${apiOrigin}${src}`;
    return `${apiOrigin}/${src}`;
  };

  const buyerAvatar = (conv) => {
    const id = getBuyerId(conv);
    const cached = id ? profiles[id] : null;
    if (cached?.avatar) return toAbsolute(cached.avatar);
    if (buyerProfile?.avatar && conv?.id === selectedConv?.id) return toAbsolute(buyerProfile.avatar);
    const u = conv?.user;
    if (u && typeof u === "object" && u.avatar) return toAbsolute(u.avatar);
    return null;
  };

  // ================= STYLE OBJECTS (DESIGN SYSTEM) =================
  const styles = {
    layout: { 
      height: "calc(100vh - 64px)", 
      background: antdToken.colorBgLayout,
      overflow: 'hidden',
    },
    sider: {
      background: antdToken.colorBgContainer,
      borderRight: `1px solid ${antdToken.colorBorderSecondary}`,
      height: "100%",
      display: 'flex',
      flexDirection: 'column'
    },
    siderHeader: {
      padding: "16px",
      borderBottom: `1px solid ${antdToken.colorBorderSecondary}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: antdToken.colorBgContainer,
    },
    conversationList: {
        overflowY: "auto",
        height: 'calc(100% - 65px)',
        padding: '0 8px' // Thêm padding 2 bên cho list đẹp hơn
    },
    conversationItem: (isActive) => ({
      cursor: "pointer",
      background: isActive ? antdToken.controlItemBgActive : "transparent",
      borderRadius: antdToken.borderRadiusLG,
      padding: "12px",
      margin: "4px 0",
      transition: "all 0.2s ease",
      borderLeft: isActive ? `4px solid ${antdToken.colorPrimary}` : "4px solid transparent",
    }),
    chatContainer: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: antdToken.colorBgContainer, // Trắng hoàn toàn cho hiện đại
      position: 'relative'
    },
    chatHeader: {
      padding: "0 20px",
      height: "64px",
      borderBottom: `1px solid ${antdToken.colorBorderSecondary}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(8px)",
      zIndex: 10,
    },
    messagesArea: {
      flex: 1,
      overflowY: "auto",
      padding: "24px",
      background: "#f0f2f5", // Màu nền nhẹ nhàng tách biệt khung chat
      backgroundImage: "radial-gradient(#e1e3e6 1px, transparent 1px)", // Pattern nhẹ
      backgroundSize: "20px 20px",
      display: "flex",
      flexDirection: "column"
    },
    messageRow: (isMine) => ({
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: 20, // Tăng khoảng cách giữa các tin nhắn
        gap: 12
    }),
    messageBubble: (isMine) => ({
      position: 'relative',
      maxWidth: "70%",
      minWidth: "60px",
      padding: "12px 16px",
      borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
      background: isMine ? antdToken.colorPrimary : antdToken.colorBgContainer,
      color: isMine ? "#fff" : antdToken.colorText,
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word", 
      fontSize: "15px", // Font chữ to hơn xíu cho dễ đọc
      lineHeight: "1.6",
      border: isMine ? 'none' : `1px solid ${antdToken.colorBorderSecondary}`
    }),
    timestamp: (isMine) => ({
        fontSize: "11px",
        color: isMine ? "rgba(255,255,255,0.8)" : antdToken.colorTextSecondary,
        marginTop: 4,
        display: 'block',
        textAlign: 'right'
    }),
    externalTimestamp: (isMine) => ({
        fontSize: "11px",
        color: antdToken.colorTextSecondary,
        marginTop: 4,
        padding: "0 4px",
        textAlign: isMine ? 'right' : 'left',
        opacity: 0.8
    }),
    inputWrapper: {
      padding: "16px 24px",
      borderTop: `1px solid ${antdToken.colorBorderSecondary}`,
      background: antdToken.colorBgContainer,
      flexShrink: 0
    },
    previewBox: {
        position: 'absolute',
        bottom: '100%',
        left: 20,
        marginBottom: 10,
        padding: 8,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        zIndex: 5,
        border: '1px solid #f0f0f0'
    }
  };

  // --- RENDER HELPERS ---
  const renderConversationList = () => (
    <div style={styles.conversationList} className="custom-scroll">
      {loadingConvs ? (
        <div style={{ padding: 40, textAlign: "center" }}><Spin size="large" /></div>
      ) : conversations.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
             <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">Chưa có hội thoại</Text>} />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={conversations}
          split={false}
          renderItem={(item) => {
            const isActive = selectedConv?.id === item.id;
            const name = buyerName(item);
            return (
              <List.Item
                onClick={() => handleSelectConversation(item)}
                style={styles.conversationItem(isActive)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={true} offset={[-5, 35]} color="green" style={{ display: isActive ? 'block' : 'none' }}>
                         <Avatar size={48} src={buyerAvatar(item)} style={{ backgroundColor: antdToken.colorPrimaryBg, color: antdToken.colorPrimary }}>
                            {name?.charAt(0)?.toUpperCase()}
                         </Avatar>
                    </Badge>
                  }
                  title={
                    <Text strong style={{ fontSize: 15, color: isActive ? antdToken.colorPrimary : antdToken.colorText }}>
                        {name}
                    </Text>
                  }
                  description={
                    <Text ellipsis type="secondary" style={{ fontSize: 13 }}>
                        Nhấn để xem tin nhắn...
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <Layout style={styles.layout}>
      {/* --- SIDER (DESKTOP) --- */}
      {!isMobile && (
        <Sider width={320} style={styles.sider} theme="light">
          <div style={styles.siderHeader}>
            <Title level={4} style={{ margin: 0, fontSize: 20 }}>Chat</Title>
            <Tooltip title="Tải lại">
              <Button type="text" shape="circle" icon={<ReloadOutlined />} onClick={fetchConversations} />
            </Tooltip>
          </div>
          {renderConversationList()}
        </Sider>
      )}

      {/* --- MAIN CHAT AREA --- */}
      <Content style={styles.chatContainer}>
        {/* MOBILE HEADER BUTTON */}
        {isMobile && !selectedConv && (
          <div style={{ padding: 16, borderBottom: `1px solid ${antdToken.colorBorderSecondary}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <Title level={5} style={{ margin: 0 }}>Hộp thư</Title>
            <Button type="primary" ghost icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)}>
              Danh sách
            </Button>
          </div>
        )}

        {!selectedConv ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", background: '#fafafa' }}>
            <Empty
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                imageStyle={{ height: 160 }}
                description={
                    <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                        Chào mừng trở lại! <br/> Chọn một khách hàng để bắt đầu hỗ trợ.
                    </Typography.Text>
                }
            />
            {isMobile && <Button type="primary" style={{ marginTop: 24 }} onClick={() => setDrawerVisible(true)}>Mở danh sách hội thoại</Button>}
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isMobile && (
                  <Button icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} />
                )}
                <Avatar size={42} src={buyerAvatar(selectedConv)} style={{ backgroundColor: antdToken.colorPrimary }}>
                   {buyerName(selectedConv)?.charAt(0)}
                </Avatar>
                <div>
                    <Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>{buyerName(selectedConv)}</Title>
                    <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 12 }}>Đang hoạt động</Text>} />
                </div>
              </div>
              <Button type="text" icon={<MoreOutlined style={{ fontSize: 20 }} />} />
            </div>

            {/* MESSAGES LIST */}
            <div ref={listRef} style={styles.messagesArea}>
              {loadingMsgs ? (
                <div style={{ textAlign: "center", padding: 40 }}><Spin tip="Đang tải tin nhắn..." /></div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 40, opacity: 0.6 }}>
                  <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                  <Text display="block" type="secondary">Bắt đầu cuộc trò chuyện mới ngay bây giờ.</Text>
                </div>
              ) : (
                messages.map((m) => {
                  const isSeller = currentUserId && m.sender === currentUserId;
                  return (
                    <div key={m.id || Math.random()} style={styles.messageRow(isSeller)}>
                      {!isSeller && (
                        <Avatar size={36} src={buyerAvatar(selectedConv)} icon={<UserOutlined />} style={{ marginTop: 4 }} />
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSeller ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                        <div style={styles.messageBubble(isSeller)}>
                          {m.content && <div>{m.content}</div>}
                          {m.image && (
                            <div style={{ marginTop: m.content ? 8 : 0 }}>
                              <img
                                src={toAbsolute(m.image)}
                                alt="attachment"
                                style={{ borderRadius: 12, maxWidth: "100%", maxHeight: 250, objectFit: 'cover', display: "block" }}
                              />
                            </div>
                          )}
                        </div>
                        {/* TIMESTAMP DƯỚI TIN NHẮN */}
                        <div style={styles.externalTimestamp(isSeller)}>
                            {formatMessageTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* INPUT AREA */}
            <div style={styles.inputWrapper}>
              {previewImage && (
                <div style={styles.previewBox}>
                  <div style={{ position: 'relative' }}>
                    <img src={previewImage} alt="Preview" style={{ height: 100, borderRadius: 6, display: 'block' }} />
                    <Button
                      type="primary" danger shape="circle"
                      icon={<CloseCircleFilled />} size="small"
                      style={{ position: 'absolute', top: -8, right: -8 }}
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <input
                  type="file" accept="image/*" ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                
                <Tooltip title="Gửi ảnh">
                  <Button 
                    icon={<FileImageOutlined />} 
                    size="large" 
                    shape="circle"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                    style={{ border: 'none', background: '#f5f5f5' }}
                  />
                </Tooltip>

                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  style={{ 
                    borderRadius: 20, 
                    resize: 'none', 
                    padding: '8px 16px',
                    background: '#f5f5f5',
                    border: 'none',
                    fontSize: 14
                  }}
                />

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size="large"
                  shape="circle"
                  onClick={handleSend}
                  loading={uploading}
                  disabled={!input.trim() && !selectedFile}
                  style={{ flexShrink: 0 }}
                />
              </div>
            </div>
          </>
        )}
      </Content>

      {/* DRAWER CHO MOBILE */}
      <Drawer
        title={<Text strong>Danh sách hội thoại</Text>}
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={300}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: 12, borderBottom: `1px solid ${antdToken.colorBorderSecondary}` }}>
            <Button block icon={<ReloadOutlined />} onClick={fetchConversations}>Cập nhật</Button>
        </div>
        {renderConversationList()}
      </Drawer>
    </Layout>
  );
}