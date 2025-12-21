// useChatManager.js - BẢN FIX IP ĐỘNG
import { useState, useEffect, useRef, useCallback } from 'react';

// 1. SỬA API BASE URL: Tự động lấy IP hiện tại thay vì fix cứng localhost
const getApiBaseUrl = () => {
  // Nếu có biến môi trường thì dùng, nếu không thì tự sinh URL theo IP hiện tại
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  
  const protocol = window.location.protocol; // http: hoặc https:
  const host = window.location.hostname;     // Lấy 192.168.x.x hoặc localhost
  const port = '8000';                       // Port của Django
  return `${protocol}//${host}:${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export const useChatManager = (sellerId, token, currentUserId) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const wsRef = useRef(null);

  // 1. Khởi tạo Conversation
  useEffect(() => {
    let isCancelled = false;
    const initConversation = async () => {
      if (!sellerId || !token) return;
      try {
        const convRes = await fetch(`${API_BASE_URL}/chat/conversations/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ seller: Number(sellerId) }),
        });
        const conv = await convRes.json();
        if (isCancelled) return;
        setConversationId(conv.id);

        const msgRes = await fetch(`${API_BASE_URL}/chat/conversations/${conv.id}/messages/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await msgRes.json();
        if (isCancelled) return;
        setMessages(Array.isArray(data) ? data : data?.results || []);
        setStatus('ready');
      } catch (e) {
        console.error("Lỗi init chat:", e);
        if (!isCancelled) setStatus('error');
      }
    };
    initConversation();
    return () => { isCancelled = true; };
  }, [sellerId, token]);

  // 2. WebSocket Logic
  useEffect(() => {
    if (!conversationId || !token) return;

    // --- SỬA ĐOẠN NÀY: Logic tạo URL WebSocket động ---
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname; // Tự động lấy IP (192.168...)
    const port = '8000';                   // Port Django
    
    // Kết quả sẽ là: ws://192.168.1.5:8000/ws/chat/...
    const url = `${protocol}//${host}:${port}/ws/chat/conv/${conversationId}/?token=${encodeURIComponent(token)}`;
    // ----------------------------------------------------

    console.log("Connecting WS to:", url); // Log để kiểm tra
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      switch (payload.event) {
        case 'message':
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.data.id)) return prev;
            return [...prev, payload.data];
          });
          break;
        case 'typing':
          if (Number(payload.sender_id) !== Number(currentUserId)) {
            setIsPartnerTyping(payload.typing);
          }
          break;
        default:
          break;
      }
    };

    ws.onopen = () => setStatus('ready');
    ws.onclose = () => setStatus('disconnected');

    return () => ws.close();
  }, [conversationId, token, currentUserId]);

  const sendTypingSignal = useCallback((isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', typing: isTyping }));
    }
  }, []);

  const sendMessage = useCallback(async (text, file) => {
    if (file) {
      const formData = new FormData();
      formData.append('content', text);
      formData.append('image', file);
      // API_BASE_URL đã được sửa ở trên nên đoạn này an toàn
      await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content: text }));
      sendTypingSignal(false);
    }
  }, [conversationId, token, sendTypingSignal]);

  return { messages, status, sendMessage, isPartnerTyping, sendTypingSignal };
};