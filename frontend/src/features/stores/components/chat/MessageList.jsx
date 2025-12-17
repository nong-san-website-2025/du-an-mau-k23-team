import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import styles from './ChatBox.module.css';

const LoadingSkeleton = () => (
  <div className={styles.loadingSkeleton}>
    <div className={`${styles.skeletonItem} ${styles.theirs}`}></div>
    <div className={`${styles.skeletonItem} ${styles.mine}`}></div>
    <div className={`${styles.skeletonItem} ${styles.theirs}`}></div>
  </div>
);

// Thêm prop isPartnerTyping
const MessageList = ({ messages, status, currentUser, sellerImage, sellerName, isPartnerTyping }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]); // Cuộn xuống khi có người đang gõ

  return (
    <main className={styles.messageList}>
      {status === 'loading' ? (
        <LoadingSkeleton />
      ) : (
        <>
          {messages.map(msg => (
            <MessageItem 
              key={msg.id || `msg-${Date.now()}`}
              message={msg}
              isMine={msg.sender === currentUser.id}
              avatarSrc={msg.sender === currentUser.id ? currentUser.avatar : sellerImage}
              name={msg.sender === currentUser.id ? currentUser.name : sellerName}
            />
          ))}
          
          {/* HIỂN THỊ TRẠNG THÁI ĐANG SOẠN TIN Ở ĐÂY */}
          {isPartnerTyping && (
            <div className={styles.typingIndicatorWrapper}>
               <img src={sellerImage} className={styles.smallAvatar} alt="" />
               <div className={styles.typingDots}>
                  <span></span><span></span><span></span>
               </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </main>
  );
};

export default MessageList;
