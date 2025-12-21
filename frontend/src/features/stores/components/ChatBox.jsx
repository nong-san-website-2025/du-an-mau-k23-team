import React, { useState, useMemo, useCallback, useRef } from 'react';
import useUserProfile from '../../users/services/useUserProfile';
import { useChatManager } from './chat/useChatManager';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import styles from '../styles/ChatBox.module.css';

export default function ChatBox({ sellerId, sellerName, sellerImage, token }) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const profile = useUserProfile();
  const typingTimeoutRef = useRef(null);
  
  const currentUser = useMemo(() => ({
    id: profile?.id,
    name: profile?.full_name || profile?.username,
    avatar: profile?.avatar,
  }), [profile]);

  const { messages, status, sendMessage, isPartnerTyping, sendTypingSignal } = useChatManager(sellerId, token, currentUser?.id);

  const handleSendTyping = useCallback((isTyping) => {
    sendTypingSignal(isTyping);
    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingSignal(false), 2000);
    }
  }, [sendTypingSignal]);

  const handleSendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !selectedFile) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingSignal(false);

    if (selectedFile) {
      setUploading(true);
      try { await sendMessage(text, selectedFile); setSelectedFile(null); }
      catch (e) { console.error("Lỗi gửi file:", e); }
      finally { setUploading(false); }
    } else {
      sendMessage(text); 
    }
    setInput('');
  }, [input, selectedFile, sendMessage, sendTypingSignal]);

  return (
    <div className={styles.chatboxContainer}>
      {/* 1. Header ChatBox */}
      <div className={styles.chatHeader}>
        <div className={styles.headerAvatar}>
          <img src={sellerImage} alt={sellerName} style={{width: '100%', height:'100%', objectFit:'cover'}} />
        </div>
        <div className={styles.headerInfo}>
          <h4>{sellerName}</h4>
          {status === 'connected' && <span className={styles.onlineStatus}>Đang hoạt động</span>}
        </div>
      </div>

      {/* 2. Message List */}
      <MessageList
        messages={messages}
        status={status}
        currentUser={currentUser}
        sellerImage={sellerImage}
        sellerName={sellerName}
        isPartnerTyping={isPartnerTyping}
      />

      {/* 3. Input Area */}
      <ChatInput
        input={input}
        setInput={(val) => { setInput(val); handleSendTyping(val.length > 0); }}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleSendMessage={handleSendMessage}
        uploading={uploading}
        status={status}
      />
    </div>
  );
}