import React from "react";
import { Link } from "react-router-dom";

const cardStyle = {
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  borderRadius: "12px",
  padding: "20px 28px",
  background: "#fff",
  marginBottom: "18px",
  border: "1px solid #f0f0f0",
  transition: "box-shadow 0.2s",
  display: "flex",
  alignItems: "center",
};

const linkStyle = {
  color: "#1a73e8",
  fontWeight: 500,
  fontSize: "1.08rem",
  textDecoration: "none",
  flex: 1,
};

const dangerLinkStyle = {
  ...linkStyle,
  color: "#d32f2f",
};

const Settings = () => {
  return (
    <div className="container mt-5" style={{maxWidth: 600, marginLeft: 0}}>
      <h2 className="mb-4" style={{fontWeight: 700, fontSize: "2rem", textAlign: "left"}}>Cài đặt tài khoản</h2>
      <div>
        <div style={cardStyle} className="settings-card">
          <Link to="/profile" style={linkStyle}>
            Hồ sơ của tôi (xem và chỉnh sửa thông tin cá nhân)
          </Link>
        </div>
        <div style={cardStyle} className="settings-card">
          <Link to="/security" style={linkStyle}>
            Bảo mật & mật khẩu (đổi mật khẩu, xác thực bảo mật)
          </Link>
        </div>
        <div style={cardStyle} className="settings-card">
          <Link to="/addresses" style={linkStyle}>
            Quản lý địa chỉ giao hàng (thêm, sửa, xóa địa chỉ nhận hàng)
          </Link>
        </div>
        <div style={cardStyle} className="settings-card">
          <Link to="/update-avatar" style={linkStyle}>
            Cập nhật ảnh đại diện
          </Link>
        </div>
        <div style={cardStyle} className="settings-card">
          <Link to="/order-history" style={linkStyle}>
            Quản lý đơn hàng (xem lịch sử mua hàng)
          </Link>
        </div>
        <div style={cardStyle} className="settings-card">
          <Link to="/notifications-settings" style={linkStyle}>
            Cài đặt thông báo (bật/tắt nhận thông báo)
          </Link>
        </div>
        <div style={{...cardStyle, border: "1px solid #ffd6d6", background: "#fff8f8"}} className="settings-card">
          <Link to="/delete-account" style={dangerLinkStyle}>
            Xóa tài khoản (xóa vĩnh viễn tài khoản khỏi hệ thống)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Settings;
