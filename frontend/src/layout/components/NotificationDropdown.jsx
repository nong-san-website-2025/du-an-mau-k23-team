import React from "react";
import { Bell, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationLogic } from "../hooks/useNotificationLogic";
import "../styles/UserActions.css";

const NotificationDropdown = ({ userId, showDropdown, setShowDropdown }) => {
  const navigate = useNavigate();
  const { unreadCount, sortedNotifications, handleHover, handleMarkAllRead } =
    useNotificationLogic(userId, navigate);

  const getNotiContent = (noti) => {
    const md = noti.metadata || {};
    const isReply = (noti.type || "").toLowerCase() === "review_reply" || md.reply_text;
    const title = isReply
      ? md.product_name ? "Phản hồi đánh giá" : "Phản hồi"
      : noti.title || noti.message;

    const details = [];
    if (md.order_code) details.push(`Mã đơn: ${md.order_code}`);
    if (md.shop_name) details.push(`Cửa hàng: ${md.shop_name}`);
    if (!isReply && md.order_total) details.push(`Giá: ${Number(md.order_total).toLocaleString()} đ`);
    if (isReply) {
      if (md.product_name) details.push(`Sản phẩm: ${md.product_name}`);
      if (md.reply_text) details.push(`Trả lời: ${md.reply_text}`);
    }
    return { title, details };
  };

  return (
    <div
      className="action-item"
      onMouseEnter={() => { setShowDropdown(true); handleHover(); }}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button className="action-btn" aria-label="Thông báo">
        <Bell size={22} className="icon-default" />
        {unreadCount > 0 && (
          <span className="badge-count badge-red">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-panel noti-panel">
          <div className="dropdown-header">
            <span>Thông báo mới nhận</span>
            <MoreHorizontal size={18} className="text-muted" style={{ cursor: 'pointer' }} />
          </div>

          <div className="noti-scroll-area">
            {!sortedNotifications?.length ? (
              <div className="empty-state">Hộp thư thông báo của bạn trống</div>
            ) : (
              sortedNotifications.slice(0, 5).map((noti, idx) => {
                const { title, details } = getNotiContent(noti);
                const isRead = noti.is_read ?? noti.read;

                return (
                  <div
                    key={noti.id || idx}
                    className={`noti-item ${isRead ? "read" : "unread"}`}
                    onClick={() => navigate("/notifications")}
                  >
                    {noti.thumbnail ? (
                      <img src={noti.thumbnail} alt="thumb" className="noti-thumb" />
                    ) : (
                      <div className="noti-icon-placeholder">
                        <Bell size={18} color="#94a3b8" />
                      </div>
                    )}

                    <div className="noti-content">
                      <div className="noti-title text-truncate" style={{ maxWidth: '260px' }}>
                        {title}
                      </div>
                      <div className="noti-meta">
                        {details.map((line, i) => (
                          <div key={i} className="noti-meta-line text-truncate" style={{ maxWidth: '260px' }}>
                            {line}
                          </div>
                        ))}
                      </div>
                      <span className="noti-time">
                        {new Date(noti.created_at || noti.time).toLocaleString("vi-VN", {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button className="view-all-btn" onClick={() => navigate("/notifications")}>
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;