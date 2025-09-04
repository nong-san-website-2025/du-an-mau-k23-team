// src/layouts/AdminLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Bell, User, Settings, Globe } from "lucide-react";
import { useAuth } from "../../login_register/services/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <div className="admin-shell bg-light">
      {/* Top utility bar */}
      <TopBar onLogout={handleLogout} />

      {/* Main area with left sidebar */}
      <div className="admin-main ">
        <AdminSidebar /> {/* 👉 Sidebar đã tách riêng */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ----------------- Components ----------------- */
function TopBar({ onLogout }) {
  return (
    <div className="admin-topbar fixed-top" style={{ zIndex: 999 }}>
      <div className="d-flex align-items-center">
        <img
          src="/assets/logo/imagelogo.png"
          alt="Logo"
          className="admin-logo"
        />
        <span className="admin-brand">GreenFarm</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <TopBarButton
          Icon={Bell}
          title="Thông báo"
          style={{ color: "black" }}
        />
        <TopBarButton
          Icon={Globe}
          title="Ngôn ngữ"
          style={{ color: "black" }}
        />
        <TopBarButton
          Icon={Settings}
          title="Cài đặt"
          style={{ color: "black" }}
        />
        <TopBarButton
          Icon={User}
          title="Tài khoản"
          style={{ color: "black" }}
        ></TopBarButton>
        {/* <TopBarButton
          Icon={User}
          title="Đăng xuất"
          style={{ color: "black" }}
          onClick={onLogout}
        /> */}
      </div>
    </div>
  );
}

function TopBarButton({ Icon, title, style, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 0px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        ...style, // nhận inline style từ props
      }}
    >
      <Icon style={{ fontSize: "18px", ...style }} />
    </button>
  );
}
