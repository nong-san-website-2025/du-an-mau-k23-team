import React from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationLogic } from "../hooks/useNotificationLogic"; // Import hook
import "../styles/UserActions.css";

const NotificationDropdown = ({
  userId,
  showDropdown,
  setShowDropdown,
}) => {
  const navigate = useNavigate();
  const {
    unreadCount,
    sortedNotifications,
    handleHover,
    handleMarkAllRead
  } = useNotificationLogic(userId, navigate);

  // Helper render text
  const getNotiContent = (noti) => {
    const md = noti.metadata || {};
    const isReply = (noti.type || "").toLowerCase() === "review_reply" || md.reply_text;
    
    // Title
    const title = isReply
      ? (md.product_name ? "Phản hồi đánh giá" : "Phản hồi")
      : (noti.title || noti.message);

    // Detail Lines
    const details = [];
    if (md.order_code) details.push(`Mã đơn: ${md.order_code}`);
    if (md.shop_name) details.push(`Cửa hàng: ${md.shop_name}`);
    if (!isReply && md.order_total) details.push(`Giá: ${Number(md.order_total).toLocaleString()} đ`);
    
    if (isReply) {
        if (md.product_name) details.push(`SP: ${md.product_name}`);
        if (md.reply_text) details.push(`Trả lời: ${md.reply_text}`);
    }

    return { title, details, isReply };
  };

  return (
    <div
      className="action-item"
      onMouseEnter={() => {
        setShowDropdown(true);
        handleHover();
      }}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button
        className="action-btn"
        onClick={handleMarkAllRead}
        aria-label="Thông báo"
      >
        <Bell size={22} className="icon-default" />
        {unreadCount > 0 && (
          <span className="badge-count badge-red">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-panel noti-panel">
          <div className="dropdown-header">Thông báo</div>
          
          {(!sortedNotifications || sortedNotifications.length === 0) ? (
            <div className="empty-state">Không có thông báo mới</div>
          ) : (
            <>
              {sortedNotifications.slice(0, 3).map((noti, idx) => {
                const { title, details } = getNotiContent(noti);
                return (
                  <div
                    key={noti.id || idx}
                    className={`noti-item ${noti.read ? "read" : "unread"}`}
                    onClick={() => navigate("/notifications")}
                  >
                    {noti.thumbnail && (
                      <img src={noti.thumbnail} alt="thumb" className="noti-thumb" />
                    )}
                    <div className="noti-content">
                      <div className="noti-title">{title}</div>
                      <div className="noti-meta">
                        {details.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                      </div>
                      {!noti.metadata?.reply_text && noti.detail && (
                          <div className="noti-meta" style={{marginTop: 4}}>{noti.detail}</div>
                      )}
                      <span className="noti-time">
                        {new Date(noti.time || Date.now()).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                );
              })}
              <button className="view-all-btn" onClick={handleMarkAllRead}>
                Xem tất cả thông báo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;