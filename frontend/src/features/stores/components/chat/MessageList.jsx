import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import styles from '../../styles/ChatBox.module.css';

const MessageList = ({ messages, status, currentUser, sellerImage, sellerName, isPartnerTyping }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  return (
    <main className={styles.messageList}>
      {/* Loading State */}
      {status === 'loading' && <div style={{textAlign: 'center', color: '#999', marginTop: 20}}>Đang tải tin nhắn...</div>}

      {/* Messages */}
      {messages.map(msg => (
        <MessageItem 
          key={msg.id || `msg-${Date.now()}`}
          message={msg}
          isMine={msg.sender === currentUser.id}
          avatarSrc={msg.sender === currentUser.id ? currentUser.avatar : sellerImage}
          name={msg.sender === currentUser.id ? currentUser.name : sellerName}
        />
      ))}
      
      {/* Typing Indicator: Nằm ngay trong list để đẩy scroll */}
      {isPartnerTyping && (
        <div className={styles.typingIndicatorWrapper}>
           <div className={styles.msgAvatar}>
              <img src={sellerImage} alt="typing" style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
           </div>
           <div className={styles.typingBubble}>
             <div className={styles.typingDot}></div>
             <div className={styles.typingDot}></div>
             <div className={styles.typingDot}></div>
           </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </main>
  );
};

export default MessageList;