import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

export const useChatManager = (sellerId, token) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading'); // loading, ready, error, disconnected
  const wsRef = useRef(null);

  // 1. Khởi tạo cuộc trò chuyện và lấy lịch sử tin nhắn
  useEffect(() => {
    let isCancelled = false;
    const initConversation = async () => {
      if (!sellerId || !token) return;
      setStatus('loading');
      try {
        const convRes = await fetch(`${API_BASE_URL}/chat/conversations/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ seller: Number(sellerId) }),
        });
        if (!convRes.ok) throw new Error('Failed to create conversation');
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
        console.error(e);
        if (!isCancelled) setStatus('error');
      }
    };
    initConversation();
    return () => { isCancelled = true; };
  }, [sellerId, token]);

  // 2. Thiết lập WebSocket
  useEffect(() => {
    if (!conversationId || !token) return;

    const connect = () => {
      const url = `${WS_BASE_URL}/chat/conv/${conversationId}/?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setStatus('ready');
      ws.onclose = () => {
        setStatus('disconnected');
        setTimeout(() => {
            // Chỉ kết nối lại nếu component vẫn còn active
            if (wsRef.current) connect();
        }, 3000);
      };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message' && payload.data) {
            setMessages(prev => [...prev, payload.data]);
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Vô hiệu hóa onclose để tránh kết nối lại
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [conversationId, token]);

  const sendMessage = useCallback(async (text, file) => {
    if (!conversationId) throw new Error('No conversation ID');

    const formData = new FormData();
    formData.append('content', text);
    if (file) {
      formData.append('image', file);
    }

    const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to send message');
    }

    const sentMessage = await res.json();

    // Nếu WebSocket không kết nối, tự thêm tin nhắn vào state
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessages(prev => [...prev, sentMessage]);
    }
    // Nếu WS kết nối, nó sẽ tự nhận và cập nhật

  }, [conversationId, token]);

  return { messages, status, sendMessage };
};
