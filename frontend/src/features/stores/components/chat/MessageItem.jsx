import React from 'react';
import styles from '../../styles/ChatBox.module.css';

const MessageItem = React.memo(({ message, isMine, avatarSrc, name }) => {
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <div className={`${styles.messageItem} ${isMine ? styles.mine : ''}`}>
      <div className={styles.msgAvatar} title={name}>
        {avatarSrc ? <img src={avatarSrc} alt={name} /> : <span>{initial}</span>}
      </div>
      <div className={styles.msgContent}>
        {message.content && <p>{message.content}</p>}
        {message.image && <img src={message.image} alt="attachment" className={styles.msgImage} />}
      </div>
    </div>
  );
});

export default MessageItem;
