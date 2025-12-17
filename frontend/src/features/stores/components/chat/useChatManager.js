// useChatManager.js - BẢN TỐI ƯU
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
        if (!isCancelled) setStatus('error');
      }
    };
    initConversation();
    return () => { isCancelled = true; };
  }, [sellerId, token]);

  // 2. WebSocket Logic
  useEffect(() => {
    if (!conversationId || !token) return;

    const url = `ws://127.0.0.1:8000/ws/chat/conv/${conversationId}/?token=${encodeURIComponent(token)}`;
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
          // FIX: So sánh ID cực chuẩn
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
      const res = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      // Tin nhắn từ API sẽ được nhận lại qua Socket nên không cần setMessages ở đây
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content: text }));
      sendTypingSignal(false);
    }
  }, [conversationId, token, sendTypingSignal]);

  return { messages, status, sendMessage, isPartnerTyping, sendTypingSignal };
};