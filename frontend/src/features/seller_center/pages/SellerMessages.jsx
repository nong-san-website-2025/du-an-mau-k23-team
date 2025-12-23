import React, { useEffect, useMemo, useRef, useState } from "react";
import { Layout, Typography, Button, message as antdMessage, Drawer, Avatar } from "antd";
import { ArrowLeftOutlined, MoreOutlined } from "@ant-design/icons";

import ConversationList from "../components/ChatSeller/ConversationList";
import MessageList from "../components/ChatSeller/MessageList";
import ChatInput from "../components/ChatSeller/ChatInput";
import { THEME_COLOR, getBuyerName, getBuyerAvatar } from "../utils/chatUtils";

import "../styles/SellerMessages.css"; // Import file CSS

const { Sider, Content } = Layout;
const { Text } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function SellerMessages() {
    const token = useMemo(() => localStorage.getItem("token"), []);
    const currentUserId = useMemo(() => {
        try {
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.user_id || payload.id || payload.sub || null;
        } catch (e) { return null; }
    }, [token]);

    // State
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loadingConvs, setLoadingConvs] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Refs
    const wsRef = useRef(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;

    // --- API Functions ---
    const fetchConversations = async () => {
        if (!token) return;
        setLoadingConvs(true);
        try {
            const res = await fetch(`${API_BASE_URL}/chat/conversations/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setConversations(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingConvs(false); }
    };

    const fetchMessages = async (convId) => {
        if (!token) return;
        setLoadingMsgs(true);
        try {
            const res = await fetch(`${API_BASE_URL}/chat/conversations/${convId}/messages/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data : data.results || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingMsgs(false); }
    };

    const handleSend = async () => {
        if (!input.trim() && !selectedFile) return;
        if (!selectedConv) return;

        try {
            setUploading(!!selectedFile);
            let res;
            const form = new FormData();
            form.append("content", input);
            if (selectedFile) form.append("image", selectedFile);

            res = await fetch(`${API_BASE_URL}/chat/conversations/${selectedConv.id}/messages/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, ...(selectedFile ? {} : { "Content-Type": "application/json" }) },
                body: selectedFile ? form : JSON.stringify({ content: input })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data]); // Optimistic update
                setInput("");
                setSelectedFile(null);
            }
        } catch (e) { antdMessage.error("Gửi lỗi"); }
        finally { setUploading(false); }
    };

    // --- Effects ---
    useEffect(() => { fetchConversations(); }, [token]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedConv && token) {
            // 1. Fetch tin nhắn cũ (API)
            fetchMessages(selectedConv.id);

            // 2. Setup WebSocket để nghe tin mới
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const port = '8000'; // Port backend, cần chỉnh nếu khác

            // URL kết nối vào đúng phòng chat của khách này
            const url = `${protocol}//${host}:${port}/ws/chat/conv/${selectedConv.id}/?token=${encodeURIComponent(token)}`;

            console.log("Seller connecting WS:", url);
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Seller connected to chat room");
            };

            ws.onmessage = (event) => {
                const payload = JSON.parse(event.data);
                if (payload.event === 'message') {
                    // Khi có tin nhắn mới (từ khách HOẶC từ chính mình gửi qua API)
                    setMessages((prev) => {
                        // Check trùng lặp
                        if (prev.some(m => m.id === payload.data.id)) return prev;
                        return [...prev, payload.data];
                    });
                }
            };

            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        }
    }, [selectedConv, token]);

    // --- Render ---
    const handleSelectConv = (conv) => {
        setSelectedConv(conv);
        setDrawerVisible(false);
    };

    return (
        <Layout className="chat-layout">
            {/* Sidebar Desktop */}
            {!isMobile && (
                <Sider width={320} className="chat-sider" theme="light">
                    <ConversationList
                        conversations={conversations}
                        loading={loadingConvs}
                        selectedConv={selectedConv}
                        onSelectConv={handleSelectConv}
                        onRefresh={fetchConversations}
                        currentUserId={currentUserId}
                    />
                </Sider>
            )}

            {/* Main Content */}
            <Content className="chat-main">
                {!selectedConv ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#8c8c8c" }}>
                        <img src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg" alt="empty" style={{ height: 180, marginBottom: 20 }} />
                        <Typography.Title level={4} style={{ color: '#595959' }}>Chào mừng đến với GreenFarm Chat</Typography.Title>
                        <Text type="secondary">Chọn một hội thoại để bắt đầu tư vấn khách hàng</Text>
                        {isMobile && (
                            <Button 
                                type="primary" 
                                style={{ marginTop: 20, background: THEME_COLOR }} 
                                onClick={() => setDrawerVisible(true)}
                            >
                                Danh sách tin nhắn
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="chat-header">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {isMobile && <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedConv(null)} style={{ marginRight: 10, border: 'none' }} />}
                                <Avatar size={40} src={getBuyerAvatar(selectedConv)} style={{ backgroundColor: THEME_COLOR }}>
                                    {getBuyerName(selectedConv, currentUserId)?.charAt(0)}
                                </Avatar>
                                <div className="user-status">
                                    <span className="user-name">{getBuyerName(selectedConv, currentUserId)}</span>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className="status-dot"></span>
                                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>Đang hoạt động</span>
                                    </div>
                                </div>
                            </div>
                            <Button type="text" icon={<MoreOutlined style={{ fontSize: 20 }} />} />
                        </div>

                        {/* Messages Area */}
                        <MessageList
                            messages={messages}
                            loading={loadingMsgs}
                            currentUserId={currentUserId}
                            selectedConv={selectedConv}
                        />

                        {/* Input Area */}
                        <ChatInput
                            input={input}
                            setInput={setInput}
                            onSend={handleSend}
                            uploading={uploading}
                            selectedFile={selectedFile}
                            setSelectedFile={setSelectedFile}
                        />
                    </>
                )}
            </Content>

            {/* Drawer Mobile */}
            <Drawer
                placement="left"
                closable={false}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width="80%"
                bodyStyle={{ padding: 0 }}
            >
                <ConversationList
                    conversations={conversations}
                    loading={loadingConvs}
                    selectedConv={selectedConv}
                    onSelectConv={handleSelectConv}
                    onRefresh={fetchConversations}
                    currentUserId={currentUserId}
                />
            </Drawer>
        </Layout>
    );
}