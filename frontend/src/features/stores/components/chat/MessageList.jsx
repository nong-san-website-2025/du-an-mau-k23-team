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

const MessageList = ({ messages, status, currentUser, sellerImage, sellerName }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className={styles.messageList}>
      {status === 'loading' ? (
        <LoadingSkeleton />
      ) : (
        messages.map(msg => {
          const isMine = msg.sender === currentUser.id;
          return (
            <MessageItem
              key={msg.id || `msg-${Date.now()}`}
              message={msg}
              isMine={isMine}
              avatarSrc={isMine ? currentUser.avatar : sellerImage}
              name={isMine ? currentUser.name : sellerName}
            />
          );
        })
      )}
      <div ref={messagesEndRef} />
    </main>
  );
};

export default MessageList;
