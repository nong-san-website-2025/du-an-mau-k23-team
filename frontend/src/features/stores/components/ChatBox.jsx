/**
 * ChatBox.jsx - Đã sửa lỗi Undefined và tối ưu Realtime
 */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import useUserProfile from '../../users/services/useUserProfile';
import { useChatManager } from './chat/useChatManager';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import styles from './chat/ChatBox.module.css';

import { Avatar, Typography } from 'antd'; 
const { Text } = Typography;

export default function ChatBox({ sellerId, sellerName, sellerImage, token }) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const profile = useUserProfile();
  const typingTimeoutRef = useRef(null);
  
  // Thông tin người dùng hiện tại
  const currentUser = useMemo(() => ({
    id: profile?.id,
    name: profile?.full_name || profile?.username,
    avatar: profile?.avatar,
  }), [profile]);

  // Lấy các state và hàm từ Chat Manager Hook
  const { 
    messages, 
    status, 
    sendMessage, 
    isPartnerTyping, // Trạng thái đối phương đang gõ
    sendTypingSignal // Hàm để mình gửi tín hiệu "đang gõ" cho đối phương
  } = useChatManager(sellerId, token, currentUser?.id);

  /**
   * Xử lý gửi tín hiệu "Đang gõ tin"
   * Được gọi từ ChatInput mỗi khi người dùng nhập liệu
   */
  const handleSendTyping = useCallback((isTyping) => {
    sendTypingSignal(isTyping);

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Sau 2 giây không nhấn phím, tự động gửi tín hiệu ngừng gõ
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingSignal(false);
      }, 2000);
    }
  }, [sendTypingSignal]);

  /**
   * Hàm gửi tin nhắn (Text hoặc File)
   */
  const handleSendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !selectedFile) return;

    // Ngừng gửi tín hiệu "đang gõ" khi đã bấm gửi
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingSignal(false);

    if (selectedFile) {
      setUploading(true);
      try {
        await sendMessage(text, selectedFile); 
        setSelectedFile(null);
      } catch (e) {
        console.error("Lỗi gửi file:", e);
      } finally {
        setUploading(false);
      }
    } else {
      // Gửi text qua WebSocket (xử lý trong hook)
      sendMessage(text); 
    }
    
    setInput(''); // Clear ô nhập liệu ngay lập tức
  }, [input, selectedFile, sendMessage, sendTypingSignal]);

  return (
    <div className={styles.chatboxContainer}>
      {/* Header hiển thị thông tin người bán */}
      <ChatHeader
        sellerId={sellerId}
        sellerName={sellerName}
        sellerImage={sellerImage}
        status={status}
      />

      {/* Danh sách tin nhắn */}
      <MessageList
        messages={messages}
        status={status}
        currentUser={currentUser}
        sellerImage={sellerImage}
        sellerName={sellerName}
      />

      {/* Vùng hiển thị trạng thái đối phương đang soạn tin */}
      {isPartnerTyping && (
        <div className={styles.typingIndicatorContainer} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} src={sellerImage} />
          <div style={{ 
            background: '#f0f0f0', 
            padding: '6px 12px', 
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Text type="secondary" italic style={{ fontSize: '12px' }}>
              {sellerName} đang soạn tin...
            </Text>
            <div className={styles.dotFlashing} style={{ marginLeft: '8px' }}></div>
          </div>
        </div>
      )}

      {/* Ô nhập liệu */}
      <ChatInput
        input={input}
        setInput={(val) => {
            setInput(val);
            handleSendTyping(val.length > 0);
        }}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleSendMessage={handleSendMessage}
        uploading={uploading}
        status={status}
      />
    </div>
  );
}