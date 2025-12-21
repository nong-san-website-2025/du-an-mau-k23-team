import React, { useState, useEffect, useRef } from "react";
import { Bell, Package, Tag, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationLogic } from "../hooks/useNotificationLogic";

const NotificationDropdown = ({ userId, showDropdown, setShowDropdown }) => {
  const navigate = useNavigate();

  const timerRef = useRef(null);
  const [isHoverable, setIsHoverable] = useState(false);

  useEffect(() => {
    const computeHoverable = () => {
      let hoverable = false;
      try {
        hoverable = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
      } catch (_) {
        hoverable = false;
      }
      // Fallback theo kích thước: từ tablet/desktop trở lên dùng hover
      if (!hoverable && window.innerWidth >= 768) hoverable = true;
      setIsHoverable(hoverable);
    };
    computeHoverable();
    window.addEventListener('resize', computeHoverable);
    return () => window.removeEventListener('resize', computeHoverable);
  }, []);
  
    const handleMouseEnter = () => {
      if (!isHoverable) return; // Mobile: bỏ hover
      if (timerRef.current) {
        clearTimeout(timerRef.current); // Xóa bộ đếm hủy
      }
      setShowDropdown(true);
    };
  
    const handleMouseLeave = () => {
      if (!isHoverable) return; // Mobile: bỏ hover
      timerRef.current = setTimeout(() => {
        setShowDropdown(false);
      }, 200); // 200ms là thời gian vàng, đủ nhanh nhưng không bị giật
    };
  

  const { unreadCount, sortedNotifications, handleMarkAllRead } = useNotificationLogic(userId, navigate);

  const getIcon = (type) => {
    switch (type) {
      case "ORDER": return <Package size={20} />;
      case "PROMO": return <Tag size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div
      className="action-item"
      onMouseEnter={isHoverable ? handleMouseEnter : undefined}
      onMouseLeave={isHoverable ? handleMouseLeave : undefined}
    >
      <button className="action-btn" onClick={() => navigate("/notifications")}>
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
      </button>

      {isHoverable && showDropdown && (
        <div className="dropdown-panel" style={{ width: 400 }}>
          <div className="dropdown-header">
            <span>Thông báo mới nhận</span>
            <span className="dropdown-link" onClick={handleMarkAllRead}>Đánh dấu đã đọc</span>
          </div>

          <div className="dropdown-body">
            {!sortedNotifications?.length ? (
              <div className="empty-state">
                <Bell size={48} className="empty-icon" />
                <span>Bạn không có thông báo nào</span>
              </div>
            ) : (
              sortedNotifications.slice(0, 6).map((noti, idx) => (
                <div 
                    key={idx} 
                    className={`noti-item-row ${!noti.read ? "unread" : ""}`}
                    onClick={() => { setShowDropdown(false); navigate("/notifications"); }}
                >
                  <div className="noti-icon-box">
                    {noti.thumbnail ? (
                        <img src={noti.thumbnail} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                    ) : getIcon(noti.type)}
                  </div>
                  <div className="noti-content">
                    <h4>{noti.title}</h4>
                    <p>{noti.message}</p>
                    <div className="noti-time">{formatTime(noti.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <button 
                className="btn-primary-full" 
                style={{background: '#f1f5f9', color: '#059669'}}
                onClick={() => navigate("/notifications")}
            >
              Xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;