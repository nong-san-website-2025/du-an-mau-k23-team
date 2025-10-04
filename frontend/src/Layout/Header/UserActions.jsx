import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Bell } from "lucide-react";
import "../../styles/layouts/header/UserActions.css";
import { Avatar, Button, Dropdown, Menu } from "antd";

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

  const isUserLoggedIn = !!localStorage.getItem("token");

  // Lấy thông báo từ localStorage và sắp xếp giống NotificationPage
  const getNotifications = () => {
    let notis = [];
    try {
      notis = JSON.parse(localStorage.getItem("notifications")) || [];
    } catch {
      notis = [];
    }
    return notis;
  };
  const [unified, setUnified] = useState([]);
  const userId = userProfile?.id;

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const run = async () => {
      if (!userId) return;
      try {
        const { fetchUnifiedNotifications, annotateRead } = await import(
          "../../features/users/services/notificationService"
        );
        const list = await fetchUnifiedNotifications(userId);
        const annotated = annotateRead(list, userId);
        if (mounted) setUnified(annotated);
      } catch (e) {
        if (mounted) setUnified([]);
      }
    };

    // Initial load
    run();

    // Polling to update without page reload
    const POLL_MS = 2000; // 2s for faster near-instant updates without page reload
    intervalId = setInterval(run, POLL_MS);

    // Refresh when window regains focus (fast catch-up)
    const onFocus = () => run();
    window.addEventListener("focus", onFocus);

    // Keep in sync across tabs when read-state changes
    const onStorage = (e) => {
      if (e?.key && String(e.key).startsWith("notif_read_")) run();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId]);

  const sortedNotifications = useMemo(() => {
    const arr = [...(unified || [])];
    arr.sort((a, b) => {
      const ta = Number.isFinite(a?.ts)
        ? a.ts
        : a?.time
          ? new Date(a.time).getTime()
          : 0;
      const tb = Number.isFinite(b?.ts)
        ? b.ts
        : b?.time
          ? new Date(b.time).getTime()
          : 0;
      if (tb !== ta) return tb - ta; // newest first by numeric timestamp
      return String(b?.id ?? "").localeCompare(String(a?.id ?? ""));
    });
    return arr;
  }, [unified]);

  const unreadCount = useMemo(() => {
    return (sortedNotifications || []).filter((n) => !n.read).length;
  }, [sortedNotifications]);

  return (
    <div
      className="d-flex align-items-center ms-3"
      style={{ flexShrink: 0, flexWrap: "nowrap" }}
    >
      {/* Mobile search button */}
      <button className="btn btn-light rounded-circle me-2 p-2 d-md-none">
        <Search size={22} className="text-white" />
      </button>

      <Link
        to="/wishlist"
        className=" me-2 p-2 d-none d-sm-inline-block"
        style={{ flexShrink: 0 }}
      >
        <Heart size={22} className="text-white" />
      </Link>

      {/* Notification icon */}
      <div
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={() =>
          setShowNotificationDropdown && setShowNotificationDropdown(true)
        }
        onMouseLeave={() =>
          setShowNotificationDropdown && setShowNotificationDropdown(false)
        }
      >
        <button
          className="notification-btn"
          style={{
            flexShrink: 0,
            position: "relative",
            border: "none",
            boxShadow: "none",
            borderRadius: "50%",
            padding: 8,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          aria-label="Thông báo"
          onClick={async () => {
            try {
              const { markAsRead } = await import(
                "../../features/users/services/notificationService"
              );
              markAsRead(
                userId,
                (sortedNotifications || []).map((n) => n.id)
              );
              setUnified((prev) =>
                (prev || []).map((n) => ({ ...n, read: true }))
              );
            } catch {}
            navigate("/notifications");
          }}
        >
          <Bell size={22} className="bell-icon" />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                background: "#c62828", // đỏ
                color: "#fff",
                borderRadius: "50%",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                zIndex: 10,
                boxShadow: "0 1px 4px #0002",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {showNotificationDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "110%",
              minWidth: 340,
              maxWidth: 400,
              background: "#fff",
              boxShadow: "0 4px 24px #16a34a22",
              borderRadius: 16,
              zIndex: 2000,
              padding: "12px 0",
              color: "#166534",
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                padding: "0 18px 10px 18px",
                color: "#16a34a",
              }}
            >
              Thông báo
            </div>
            {!sortedNotifications || sortedNotifications.length === 0 ? (
              <div style={{ padding: "12px 18px", color: "#6b7280" }}>
                Không có thông báo mới
              </div>
            ) : (
              <>
                {sortedNotifications.slice(0, 3).map((noti, idx) => (
                  <div
                    key={noti.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: noti.read ? "#f0fdf4" : "#e6f4ea",
                      borderRadius: 10,
                      border: "1px solid #bbf7d0",
                      padding: "12px 16px",
                      margin: "0 12px 10px 12px",
                      color: "#166534",
                      fontWeight: noti.read ? 400 : 600,
                      boxShadow: noti.read ? "none" : "0 2px 10px #16a34a22",
                      transition: "background 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#d1fae5";
                      e.currentTarget.style.boxShadow = noti.read
                        ? "none"
                        : "0 4px 16px #16a34a33";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = noti.read
                        ? "#f0fdf4"
                        : "#e6f4ea";
                      e.currentTarget.style.boxShadow = noti.read
                        ? "none"
                        : "0 2px 10px #16a34a22";
                    }}
                  >
                    {noti.thumbnail && (
                      <img
                        src={noti.thumbnail}
                        alt="thumb"
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: 6,
                          marginRight: 10,
                          border: "1px solid #bbf7d0",
                          background: "#fff",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#166534",
                          fontSize: 15,
                        }}
                      >
                        {noti.title || noti.message}
                      </div>
                      {noti.detail && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#166534",
                            marginTop: 2,
                          }}
                        >
                          {noti.detail}
                        </div>
                      )}
                      {noti.time && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                        >
                          {typeof noti.time === "string"
                            ? noti.time
                            : noti.time && noti.time.toLocaleString
                              ? noti.time.toLocaleString()
                              : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "10px 0 0 0" }}>
                  <button
                    className="btn btn-link"
                    style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}
                    onClick={async () => {
                      try {
                        const { markAsRead } = await import(
                          "../../features/users/services/notificationService"
                        );
                        markAsRead(
                          userId,
                          (sortedNotifications || []).map((n) => n.id)
                        );
                        setUnified((prev) =>
                          (prev || []).map((n) => ({ ...n, read: true }))
                        );
                      } catch {}
                      navigate("/notifications");
                    }}
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Cart icon + dropdown */}
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setShowCartDropdown(true)}
        onMouseLeave={() => setShowCartDropdown(false)}
      >
        <button
          className="me-2 p-2 position-relative cart-button"
          style={{
            flexShrink: 0,
            position: "relative",
            border: "none",
            boxShadow: "none",
          }}
          aria-label="Giỏ hàng"
          onClick={() => navigate("/cart")}
        >
          <ShoppingCart size={22} className="cart-icon" />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 18,
                height: 18,
                background: "#faad14  ",
                color: "#fff",
                borderRadius: "50%",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
                zIndex: 10,
                boxShadow: "0 1px 4px #0002",
              }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {showCartDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              minWidth: 320,
              maxWidth: 400,
              background: "#fff",
              boxShadow: "0 4px 16px #0002",
              borderRadius: 10,
              zIndex: 2000,
              padding: "12px 0",
            }}
          >
            <div
              style={{
                fontWeight: 500,
                fontSize: 14,
                padding: "0 18px 8px 18px",
                color: "#16a34a",
              }}
            >
              Sản phẩm trong giỏ hàng
            </div>
            {cartItems.length === 0 ? (
              <div style={{ padding: "12px 18px", color: "#888" }}>
                Giỏ hàng trống
              </div>
            ) : (
              <>
                {cartItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id || item.product_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 18px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      fontSize: 15,
                      color: "#333",
                      transition: "background 0.2s",
                    }}
                    onClick={() => {
                      setShowCartDropdown(false);
                      navigate(`/cart`);
                    }}
                  >
                    <img
                      src={item.product?.image || "/media/products/default.png"}
                      alt="thumb"
                      style={{
                        width: 38,
                        height: 38,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginRight: 8,
                        background: "#f0fdf4",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <span>{item.product?.name || "Sản phẩm"}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      x{item.quantity}
                    </span>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "10px 0 0 0" }}>
                  <button
                    className="btn btn-link"
                    style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}
                    onClick={() => {
                      setShowCartDropdown(false);
                      navigate("/cart");
                    }}
                  >
                    Xem giỏ hàng
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User profile or login button */}
      {isUserLoggedIn ? (
        <Dropdown
          overlay={
            <Menu
              style={{
                borderRadius: 6,
                overflow: "hidden",
                minWidth: 220,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header thông tin người dùng */}
              <Menu.Item
                key="profile-header"
                disabled
                style={{ padding: 12, background: "#f0fdf4" }}
              >
                <div style={{ textAlign: "center" }}>
                  {userProfile?.avatar ? (
                    <Avatar
                      src={userProfile?.avatar}
                      size={48}
                      style={{
                        border: "2px solid #22C55E",
                        boxShadow: "0 2px 8px #22c55e22",
                      }}
                    />
                  ) : (
                    <Avatar
                      size={48}
                      style={{
                        backgroundColor: "#22C55E",
                        boxShadow: "0 2px 8px #22c55e22",
                        fontWeight: "bold",
                      }}
                    >
                      {localStorage.getItem("username")?.[0]?.toUpperCase() ||
                        ""}
                    </Avatar>
                  )}
                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#16a34a",
                    }}
                  >
                    {userProfile?.full_name || "___"}
                  </div>
                  <Button
                    type="default"
                    size="small"
                    style={{ marginTop: 8, borderRadius: 4, fontSize: 15 }}
                    onClick={() => navigate("/profile")}
                  >
                    Xem hồ sơ
                  </Button>
                </div>
              </Menu.Item>

              <Menu.Divider />

              {/* Đơn hàng */}
              <Menu.Item key="orders">
                <Link style={{ textDecoration: "none" }} to="/orders">
                  Đơn hàng của tôi
                </Link>
              </Menu.Item>

              {/* Cửa hàng */}
              <Menu.Item
                key="seller"
                style={{
                  background:
                    hoveredDropdown === "register" ? "#16a34a" : "#22C55E",
                  color: "#fff",
                  transition: "0.2s",
                }}
                onMouseEnter={() => setHoveredDropdown("register")}
                onMouseLeave={() => setHoveredDropdown(null)}
              >
                <Link
                  to={storeName ? "/seller-center" : "/register-seller"}
                  style={{ color: "#fff", textDecoration: "none" }}
                >
                  {storeName
                    ? "Cửa hàng của tôi"
                    : sellerStatus === "pending"
                      ? "Đang chờ duyệt"
                      : "Đăng ký bán hàng"}
                </Link>
              </Menu.Item>

              <Menu.Divider />

              {/* Đăng xuất */}
              <Menu.Item
                key="logout"
                style={{
                  color: hoveredDropdown === "logout" ? "#b91c1c" : "#dc2626",
                  background:
                    hoveredDropdown === "logout" ? "#fee2e2" : "transparent",
                  transition: "0.2s",
                }}
                onMouseEnter={() => setHoveredDropdown("logout")}
                onMouseLeave={() => setHoveredDropdown(null)}
                onClick={handleLogout}
              >
                Đăng xuất
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            shape="circle"
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
              padding: 0,
            }}
          >
            {userProfile?.avatar ? (
              <Avatar
                src={userProfile?.avatar}
                size={32}
                style={{ border: "2px solid #eee" }}
              />
            ) : (
              // Trong phần hiển thị avatar
              <Avatar
                style={{ backgroundColor: "#16a34a", fontWeight: "bold" }}
                size={32}
              >
                
              </Avatar>
            )}
          </Button>
        </Dropdown>
      ) : (
        <Link
          to="/login"
          className="p-2"
          style={{
            flexShrink: 0,
            position: "relative",
            background: "transparent",
            border: "none",
            boxShadow: "none",
            textDecoration: "none",
          }}
        >
          <User size={22} className="text-white" />
        </Link>
      )}
    </div>
  );
}
