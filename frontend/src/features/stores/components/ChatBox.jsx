/**
 * ChatBox.jsx - Phiên bản đã tái cấu trúc
 *
 * Chức năng chính:
 * - Đóng vai trò là component điều phối, kết hợp các UI component và logic từ custom hook.
 * - Quản lý state của ô nhập liệu (input) và file được chọn.
 *
 * Cải tiến:
 * - Code cực kỳ gọn gàng, dễ đọc và dễ hiểu.
 * - Logic và UI được tách biệt hoàn toàn.
 * - Dễ dàng bảo trì và mở rộng trong tương lai.
 */
import React, { useState, useMemo, useCallback } from 'react';
import useUserProfile from '../../users/services/useUserProfile';
import { useChatManager } from './chat/useChatManager';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import styles from './chat/ChatBox.module.css';

export default function ChatBox({ sellerId, sellerName, sellerImage, token }) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { messages, status, sendMessage } = useChatManager(sellerId, token);
  const profile = useUserProfile();

  const currentUser = useMemo(() => ({
    id: profile?.id,
    name: profile?.full_name || profile?.username,
    avatar: profile?.avatar,
  }), [profile]);

  const handleSendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !selectedFile) return;

    setUploading(true);
    try {
      await sendMessage(text, selectedFile);
      setInput('');
      setSelectedFile(null);
    } catch (e) {
      console.error(e);
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  }, [input, selectedFile, sendMessage]);

  return (
    <div className={styles.chatboxContainer}>
      <ChatHeader
        sellerId={sellerId}
        sellerName={sellerName}
        sellerImage={sellerImage}
        status={status}
      />
      <MessageList
        messages={messages}
        status={status}
        currentUser={currentUser}
        sellerImage={sellerImage}
        sellerName={sellerName}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleSendMessage={handleSendMessage}
        uploading={uploading}
        status={status}
      />
    </div>
  );
}