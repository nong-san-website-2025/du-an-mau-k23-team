import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, ShoppingBag, Clock, LogOut, Store,
  Settings, MapPin, Heart
} from "lucide-react";

const UserProfileDropdown = ({ isUserLoggedIn, userProfile, handleLogout, sellerStatus }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHoverable, setIsHoverable] = useState(false); // Thiết bị có hover (desktop)
  const navigate = useNavigate();

  const timerRef = useRef(null);

  useEffect(() => {
    const computeHoverable = () => {
      let hoverable = false;
      try {
        // Thiết bị hỗ trợ hover (desktop, laptop)
        hoverable = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
      } catch (_) {
        hoverable = false;
      }
      // Fallback: nếu màn hình ≥ 768px, coi như desktop -> dùng hover
      if (!hoverable && window.innerWidth >= 768) hoverable = true;
      setIsHoverable(hoverable);
    };

    computeHoverable();
    window.addEventListener('resize', computeHoverable);
    return () => window.removeEventListener('resize', computeHoverable);
  }, []);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current); // Xóa bộ đếm hủy
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    // Trên thiết bị không có hover (mobile), bỏ qua việc auto-hide theo hover
    if (!isHoverable) return;
    timerRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200); // 200ms là thời gian vàng, đủ nhanh nhưng không bị giật
  };

  // Toggle bằng click để phù hợp trên mobile (tap lần 1 mở, lần 2 đóng)
  const handleButtonClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowDropdown(prev => !prev);
  };


  if (!isUserLoggedIn) {
    return (
      <div className="action-item">
        <Link to="/login" className="action-btn" aria-label="Đăng nhập">
          <User size={22} strokeWidth={2} />
        </Link>
      </div>
    );
  }

  // Fallback avatar bằng chữ cái đầu
  const initial = (userProfile?.full_name || "U").charAt(0).toUpperCase();

  return (
    <div
      className="action-item"
      onMouseEnter={isHoverable ? handleMouseEnter : undefined}
      onMouseLeave={isHoverable ? handleMouseLeave : undefined}
    >
      <button className="action-btn" style={{ padding: 2 }} onClick={handleButtonClick} aria-expanded={showDropdown} aria-haspopup="menu">
        {userProfile?.avatar ? (
          <img
            src={userProfile.avatar}
            alt="User"
            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
          />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: "#dcfce7", color: "#15803d",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", border: "2px solid #fff"
          }}>
            {initial}
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-panel" style={{ width: 280 }}>
          {/* Header với Gradient */}
          <div className="user-dropdown-header">
            {!userProfile?.avatar && (
              <div className="user-avatar-lg" style={{ background: 'white', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                {initial}
              </div>
            )}
            <div className="user-info-box">
              <div className="user-name">{userProfile?.full_name || "Khách hàng"}</div>
              {sellerStatus === "active" && <span className="user-role">Seller</span>}
            </div>
          </div>

          <div className="menu-list">
            <Link to="/profile" className="menu-item">
              <User size={18} /> Hồ sơ cá nhân
            </Link>
            <div className="menu-divider"></div>

            <Link to="/orders" className="menu-item">
              <ShoppingBag size={18} /> Đơn mua
            </Link>
            <Link to="/wishlist" className="menu-item">
              <Heart size={18} /> Yêu thích
            </Link>

            <div className="menu-divider"></div>

            {/* Mục dành cho Seller */}
            <Link
              to={["active", "approved"].includes(sellerStatus) ? "/seller-center" : "/register-seller"}
              className="menu-item"
              style={{ color: '#d97706' }} // Màu vàng cam nổi bật
            >
              <Store size={18} color="#d97706" />
              {["active", "approved"].includes(sellerStatus) ? "Kênh người bán" : "Đăng ký bán hàng"}
            </Link>

            <div className="menu-divider"></div>

            <button className="menu-item danger" onClick={handleLogout}>
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;