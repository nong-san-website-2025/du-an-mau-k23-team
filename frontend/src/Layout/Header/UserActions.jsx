import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Bell } from "lucide-react";
import "../../styles/layouts/header/UserActions.css"; // Import file CSS riêng

export default function UserActions({
  greenText,
  cartCount,
  cartItems,
  showCartDropdown,
  setShowCartDropdown,
  userProfile,
  showProfileDropdown,
  setShowProfileDropdown,
  handleLogout,
  notifications,
  showNotificationDropdown,
  setShowNotificationDropdown,
  hoveredDropdown,
  setHoveredDropdown,
  storeName,
  sellerStatus,
}) {
  const navigate = useNavigate();

  // ====== Lấy và sắp xếp thông báo ======
  const getNotifications = () => {
    let notis = [];
    try {
      notis = JSON.parse(localStorage.getItem("notifications")) || [];
    } catch {
      notis = [];
    }
    return notis;
  };
  const notificationsData = getNotifications();

  const getProduct = (noti) => {
    const match = noti.detail && noti.detail.match(/Khiếu nại sản phẩm: (.*?)(\.|\n)/);
    return match ? match[1] : "";
  };

  const sortedNotifications = [...notificationsData].sort((a, b) => {
    const prodA = getProduct(a).toLowerCase();
    const prodB = getProduct(b).toLowerCase();
    if (prodA < prodB) return -1;
    if (prodA > prodB) return 1;
    return b.id - a.id;
  });

  return (
    <div className="user-actions">
      {/* Mobile search button */}
      <button className="icon-btn d-md-none">
        <Search size={22} style={greenText} />
      </button>

      {/* Wishlist (Heart icon) */}
      <Link to="/wishlist" className="wishlist-btn">
        <Heart size={22} className="text-white" />
      </Link>

      {/* Notification icon + Dropdown */}
      <div
        className="dropdown-wrapper"
        onMouseEnter={() => setShowNotificationDropdown && setShowNotificationDropdown(true)}
        onMouseLeave={() => setShowNotificationDropdown && setShowNotificationDropdown(false)}
      >
        <button className="icon-btn" aria-label="Thông báo">
          <Bell size={22} className="text-white" />
          {sortedNotifications.length > 0 && (
            <span className="badge-red">{sortedNotifications.length}</span>
          )}
        </button>

        {showNotificationDropdown && (
          <div className="dropdown-menu-custom notification-menu">
            <div className="dropdown-header">Thông báo</div>
            {sortedNotifications.length === 0 ? (
              <div className="dropdown-empty">Không có thông báo mới</div>
            ) : (
              <>
                {sortedNotifications.slice(0, 3).map((noti, idx) => (
                  <div
                    key={noti.id || idx}
                    className={`notification-item ${noti.read ? "read" : "unread"}`}
                  >
                    {noti.thumbnail && (
                      <img src={noti.thumbnail} alt="thumb" className="notification-thumb" />
                    )}
                    <div className="notification-content">
                      <div className="notification-title">
                        {noti.title || noti.message}
                      </div>
                      {noti.detail && <div className="notification-detail">{noti.detail}</div>}
                      {noti.time && (
                        <div className="notification-time">
                          {typeof noti.time === "string"
                            ? noti.time
                            : noti.time?.toLocaleString?.() || ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="dropdown-footer">
                  <button
                    className="view-all-btn"
                    onClick={() => navigate("/payment/NotificationPage")}
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cart icon + Dropdown */}
      <div
        className="dropdown-wrapper"
        onMouseEnter={() => setShowCartDropdown(true)}
        onMouseLeave={() => setShowCartDropdown(false)}
      >
        <button
          className="icon-btn"
          aria-label="Giỏ hàng"
          onClick={() => navigate("/cart")}
        >
          <ShoppingCart size={22} style={greenText} />
          {cartCount > 0 && <span className="badge-red">{cartCount}</span>}
        </button>

        {showCartDropdown && (
          <div className="dropdown-menu-custom cart-menu">
            <div className="dropdown-header">Sản phẩm trong giỏ hàng</div>
            {cartItems.length === 0 ? (
              <div className="dropdown-empty">Giỏ hàng trống</div>
            ) : (
              <>
                {cartItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id || item.product_id}
                    className="cart-item"
                    onClick={() => {
                      setShowCartDropdown(false);
                      navigate("/cart");
                    }}
                  >
                    <img
                      src={item.product?.thumbnail || "/media/products/default.png"}
                      alt="thumb"
                      className="cart-thumb"
                    />
                    <span>{item.product?.name || "Sản phẩm"}</span>
                    <span className="cart-quantity">x{item.quantity}</span>
                  </div>
                ))}
                <div className="dropdown-footer">
                  <button
                    className="view-all-btn"
                    onClick={() => {
                      setShowCartDropdown(false);
                      navigate("/cart");
                    }}
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User profile */}
      {userProfile && userProfile.id ? (
        <div className="dropdown-wrapper">
          <button
            className="icon-btn"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-label="Tài khoản"
          >
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="avatar" className="profile-avatar" />
            ) : (
              <span className="profile-initial">
                {localStorage.getItem("username")[0]}
              </span>
            )}
          </button>

          {showProfileDropdown && (
            <div className="dropdown-menu-custom profile-menu">
              <div className="profile-header">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="avatar" className="profile-avatar-lg" />
                ) : (
                  <span className="profile-initial-lg">
                    {localStorage.getItem("username")[0]}
                  </span>
                )}
                <div className="profile-name">{localStorage.getItem("username")}</div>
                <button
                  className="btn-view-profile"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate("/profile");
                  }}
                >
                  Xem hồ sơ
                </button>
              </div>

              <Link to="/orders" className="dropdown-link" onClick={() => setShowProfileDropdown(false)}>
                Đơn hàng của tôi
              </Link>

              <Link
                to={storeName ? "/seller-center" : "/register-seller"}
                className={`dropdown-link seller-link ${hoveredDropdown === "register" ? "hover" : ""}`}
                onMouseEnter={() => setHoveredDropdown("register")}
                onMouseLeave={() => setHoveredDropdown(null)}
                onClick={() => setShowProfileDropdown(false)}
              >
                {storeName
                  ? "Cửa hàng của tôi"
                  : sellerStatus === "pending"
                  ? "Đang chờ duyệt"
                  : "Đăng ký bán hàng"}
              </Link>

              <div className="dropdown-divider"></div>

              <button
                className={`dropdown-link logout-link ${hoveredDropdown === "logout" ? "hover" : ""}`}
                onMouseEnter={() => setHoveredDropdown("logout")}
                onMouseLeave={() => setHoveredDropdown(null)}
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="icon-btn">
          <User size={22} style={greenText} />
        </Link>
      )}
    </div>
  );
}
