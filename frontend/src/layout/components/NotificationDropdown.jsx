import React, { useRef } from "react";
import { Bell, Package, Tag, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationLogic } from "../hooks/useNotificationLogic";

const NotificationDropdown = ({ userId, showDropdown, setShowDropdown }) => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // --- 1. LOGIC HOVER (Giữ UX mượt mà từ HEAD) ---
  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const { unreadCount, sortedNotifications, handleMarkAllRead } = useNotificationLogic(userId, navigate);

  // --- 2. HELPERS ---
  const getIcon = (type) => {
    switch (type) {
      case "ORDER":
      case "order_created":
      case "order_status_changed":
        return <Package size={20} />;
      case "PROMO": 
        return <Tag size={20} />;
      default: 
        return <Bell size={20} />;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    });
  };

  // --- 3. XỬ LÝ METADATA (Tích hợp từ MinhKhanh để hiện chi tiết đơn) ---
  const getMetadataDetails = (noti) => {
    const md = noti.metadata || {};
    const details = [];
    
    // Ưu tiên hiển thị Mã đơn hàng và Giá
    if (md.order_code || md.order_id) details.push(`Mã đơn: #${md.order_code || md.order_id}`);
    if (md.shop_name) details.push(`Shop: ${md.shop_name}`);
    if (md.order_total) details.push(`Tổng: ${Number(md.order_total).toLocaleString()} đ`);
    
    // Xử lý reply/review
    const isReply = (noti.type || "").toLowerCase().includes("reply");
    if (isReply && md.reply_text) details.push(`Phản hồi: "${md.reply_text}"`);

    return details;
  };

  return (
    <div
      className="action-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="action-btn" onClick={() => navigate("/notifications")}>
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="dropdown-panel" style={{ width: 400 }}>
          {/* Header */}
          <div className="dropdown-header">
            <span>Thông báo mới nhận</span>
            <span 
                className="dropdown-link" 
                onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllRead();
                }}
                style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#059669' }}
            >
                Đánh dấu đã đọc
            </span>
          </div>

          {/* Body */}
          <div className="dropdown-body">
            {!sortedNotifications?.length ? (
              <div className="empty-state">
                <Bell size={48} className="empty-icon" />
                <span>Bạn không có thông báo nào</span>
              </div>
            ) : (
              sortedNotifications.slice(0, 6).map((noti, idx) => {
                const details = getMetadataDetails(noti);
                
                return (
                  <div 
                    key={idx} 
                    className={`noti-item-row ${!noti.read ? "unread" : ""}`}
                    onClick={() => { 
                        setShowDropdown(false); 
                        navigate("/notifications"); 
                    }}
                  >
                    {/* Icon / Avatar */}
                    <div className="noti-icon-box">
                      {noti.thumbnail ? (
                        <img 
                            src={noti.thumbnail} 
                            alt="" 
                            style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} 
                        />
                      ) : (
                         // Fallback icon đẹp hơn placeholder xám
                         getIcon(noti.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="noti-content">
                      <h4 className="text-truncate" style={{ marginBottom: '2px' }}>{noti.title}</h4>
                      <p style={{ margin: 0, lineHeight: '1.4' }}>{noti.message}</p>
                      
                      {/* Render Metadata Details (từ MinhKhanh) */}
                      {details.length > 0 && (
                          <div className="noti-meta" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                            {details.map((line, i) => (
                                <span key={i} style={{ display: 'block' }}>• {line}</span>
                            ))}
                          </div>
                      )}
                      
                      <div className="noti-time" style={{ marginTop: '4px' }}>
                        {formatTime(noti.created_at || noti.time)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="dropdown-footer">
            <button 
                className="btn-primary-full" 
                style={{
                    background: '#f1f5f9', 
                    color: '#059669', 
                    border: 'none', 
                    padding: '10px', 
                    width: '100%',
                    cursor: 'pointer',
                    fontWeight: 500
                }}
                onClick={() => navigate("/notifications")}
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;