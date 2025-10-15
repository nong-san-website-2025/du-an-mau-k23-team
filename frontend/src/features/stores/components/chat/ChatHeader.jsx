import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import styles from './ChatBox.module.css';

const StatusIndicator = ({ status }) => {
  if (status === 'ready') {
    return <><Wifi size={14} /><span>Đã kết nối</span></>;
  }
  if (status === 'disconnected') {
    return <><WifiOff size={14} /><span>Đã mất kết nối</span></>;
  }
  if (status === 'loading') {
    return <span>Đang tải...</span>;
  }
  return <span>Lỗi</span>;
};

const ChatHeader = ({ sellerName, sellerImage, sellerId, status }) => {
  return (
    <header className={styles.chatboxHeader}>
      <div className={styles.headerAvatar}>
        {sellerImage ? (
          <img src={sellerImage} alt={sellerName} />
        ) : (
          <span>{(sellerName || 'S').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className={styles.headerInfo}>
        <strong>{sellerName || `Cửa hàng #${sellerId}`}</strong>
        <div className={`${styles.statusIndicator} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
          <StatusIndicator status={status} />
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
