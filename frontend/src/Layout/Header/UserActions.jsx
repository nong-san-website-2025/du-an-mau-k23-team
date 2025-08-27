import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User } from "lucide-react";

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

  return (
    <div className="d-flex align-items-center ms-3" style={{ flexShrink: 0, flexWrap: "nowrap" }}>
      {/* Mobile search button */}
      <button className="btn btn-light rounded-circle me-2 p-2 d-md-none">
        <Search size={22} style={greenText} />
      </button>

      <Link to="/wishlist" className="btn btn-light rounded-circle me-2 p-2 d-none d-sm-inline-block" style={{ flexShrink: 0 }}>
        <Heart size={22} style={greenText} />
      </Link>

      {/* Cart icon + dropdown */}
      <div style={{ position: "relative" }} onMouseEnter={() => setShowCartDropdown(true)} onMouseLeave={() => setShowCartDropdown(false)}>
        <button
          className="btn btn-light rounded-circle me-2 p-2 position-relative"
          style={{ flexShrink: 0 }}
          aria-label="Giỏ hàng"
          onClick={() => navigate("/cart")}
        >
          <ShoppingCart size={22} style={greenText} />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 18,
                height: 18,
                background: "#dc2626",
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
            <div style={{ fontWeight: 500, fontSize: 14, padding: "0 18px 8px 18px", color: "#16a34a" }}>Sản phẩm trong giỏ hàng</div>
            {cartItems.length === 0 ? (
              <div style={{ padding: "12px 18px", color: "#888" }}>Giỏ hàng trống</div>
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
                      src={item.product?.thumbnail || "/media/products/default.png"}
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
                    <span style={{ marginLeft: "auto", color: "#16a34a", fontWeight: 600 }}>x{item.quantity}</span>
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
                    Xem tất cả sản phẩm
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile or login */}
      {localStorage.getItem("token") && localStorage.getItem("username") ? (
        <div className="dropdown" style={{ position: "relative" }}>
          <button
            className="btn btn-light rounded-circle p-2"
            style={{ flexShrink: 0 }}
            id="profileDropdownBtn"
            onClick={() => setShowProfileDropdown((v) => !v)}
            aria-expanded={showProfileDropdown ? "true" : "false"}
          >
            {userProfile && userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt="avatar"
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "2px solid #eee" }}
              />
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#16a34a",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                {localStorage.getItem("username")[0]}
              </span>
            )}
          </button>

          {showProfileDropdown && (
            <div
              id="profileDropdownMenu"
              className="dropdown-menu show p-0"
              style={{
                position: "absolute",
                right: 0,
                top: "110%",
                minWidth: 220,
                boxShadow: "0 4px 16px #0002",
                borderRadius: 12,
                zIndex: 2000,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div className="d-flex flex-column align-items-center py-3 px-3 border-bottom" style={{ background: "#f0fdf4" }}>
                {userProfile && userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="avatar"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #22C55E",
                      boxShadow: "0 2px 8px #22c55e22",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "#22C55E",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 24,
                      textTransform: "uppercase",
                      boxShadow: "0 2px 8px #22c55e22",
                    }}
                  >
                    {localStorage.getItem("username")[0]}
                  </span>
                )}
                <div className="mt-2 text-center">
                  <span style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>{localStorage.getItem("username")}</span>
                </div>
                <button
                  className="btn btn-outline-success btn-sm mt-2 px-3 fw-bold"
                  style={{ borderRadius: 6, fontSize: 15 }}
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate("/profile");
                  }}
                >
                  Xem hồ sơ
                </button>
              </div>
              <Link to="/orders" className="dropdown-item" style={{ padding: "12px 18px", fontWeight: 500 }} onClick={() => setShowProfileDropdown(false)}>
                Đơn hàng của tôi
              </Link>
              <Link
                to={storeName ? "/manage-products" : sellerStatus === "pending" ? "/register-seller" : "/register-seller"}
                className="dropdown-item text-white fw-bold d-flex justify-content-left"
                style={{
                  background: hoveredDropdown === "register" ? "#16a34a" : "#22C55E",
                  borderRadius: 0,
                  margin: "0px 0px",
                  boxShadow: hoveredDropdown === "register" ? "0 4px 16px #16a34a44" : "0 2px 8px #22c55e44",
                  fontSize: 16,
                  padding: "12px 18px",
                  border: "none",
                  transition: "all 0.2s",
                  filter: hoveredDropdown === "register" ? "brightness(0.95)" : "none",
                }}
                onMouseEnter={() => setHoveredDropdown("register")}
                onMouseLeave={() => setHoveredDropdown(null)}
                onClick={() => setShowProfileDropdown(false)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {storeName
                    ? "Cửa hàng của tôi"
                    : sellerStatus === "pending"
                    ? "Đang chờ duyệt"
                    : "Đăng ký bán hàng"}
                </span>
              </Link>
              <div className="dropdown-divider" style={{ margin: 0, borderTop: "1px solid #eee" }} />
              <button
                className="dropdown-item text-danger"
                style={{
                  padding: "12px 18px",
                  fontWeight: 500,
                  background: hoveredDropdown === "logout" ? "#fee2e2" : "none",
                  color: hoveredDropdown === "logout" ? "#b91c1c" : "#dc2626",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
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
        <Link to="/login" className="btn btn-light rounded-circle p-2" style={{ flexShrink: 0 }}>
          <User size={22} style={greenText} />
        </Link>
      )}
    </div>
  );
}