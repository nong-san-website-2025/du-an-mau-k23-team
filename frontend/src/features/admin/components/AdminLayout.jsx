// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, User, Settings, Globe } from "lucide-react";
import { useAuth } from "../../login_register/services/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/AdminLayout.css";
import { useTranslation } from "react-i18next";
import { Badge, Dropdown, List, Button, Menu } from "antd";
import axios from "axios";

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
      <TopBar onLogout={handleLogout} />
      <div className="admin-main">
        <AdminSidebar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ----------------- TopBar ----------------- */
function TopBar({ onLogout }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLangLabel = i18n.language === "en" ? "English" : "Tiếng Việt";

  const notifications = [{ text: "Không có thông báo!" }];

  return (
    <div
      className="admin-topbar fixed-top d-flex justify-content-between align-items-center px-3"
      style={{ zIndex: 999 }}
    >
      <div className="d-flex align-items-center">
        <img
          src="/assets/logo/imagelogo.png"
          alt="Logo"
          className="admin-logo"
        />
        <span className="admin-brand ms-2">GreenFarm</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <NotificationDropdown notifications={notifications} />
        {/* <DropdownTopBarButton
          Icon={Globe}
          defaultLabel={currentLangLabel}
          items={[
            {
              label: "Tiếng Việt",
              onClick: () => {
                i18n.changeLanguage("vi");
                localStorage.setItem("i18nextLng", "vi");
              },
            },
            {
              label: "English",
              onClick: () => {
                i18n.changeLanguage("en");
                localStorage.setItem("i18nextLng", "en");
              },
            },
          ]}
        /> */}
        <DropdownTopBarButton
          Icon={Settings}
          items={[
            {
              label: t("Trang cài đặt"),
              onClick: () => navigate("/admin/settings"),
            },
            {
              label: t("Quản lý tài khoản"),
              onClick: () => navigate("/admin/account"),
            },
            { label: "Phân quyền", onClick: () => navigate("/admin/roles") },
            {
              label: "Cấu hình hệ thống",
              onClick: () => navigate("/admin/system-config"),
            },
            {
              label: "Log hệ thống",
              onClick: () => navigate("/admin/system-logs"),
            },
          ]}
        />
        {/* Thay UserDropdown vào đây */}
        <UserDropdown onLogout={onLogout} t={t} navigate={navigate} />
      </div>
    </div>
  );
}

/* ----------------- UserDropdown ----------------- */
function UserDropdown({ onLogout, t, navigate }) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/users/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.avatar) {
          // nếu backend chỉ trả tên file thì ghép base url
          const fullUrl = res.data.avatar.startsWith("http")
            ? res.data.avatar
            : `http://localhost:8000${res.data.avatar}`;
          setAvatarUrl(fullUrl);
        }
      } catch (err) {
        console.error("Lỗi load avatar:", err);
      }
    };
    fetchProfile();
  }, []);

  const menu = (
    <Menu
      items={[
        {
          key: "profile",
          label: t("Thông tin"),
          onClick: () => navigate("/admin/profile"),
        },
        { key: "logout", label: t("Đăng xuất"), onClick: onLogout },
      ]}
    />
  );

  return (
    <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="avatar"
          className="rounded-circle"
          style={{
            width: 32,
            height: 32,
            objectFit: "cover",
            cursor: "pointer",
          }}
        />
      ) : (
        <Button type="text" icon={<User size={20} />} />
      )}
    </Dropdown>
  );
}

/* ----------------- Dropdown TopBarButton ----------------- */
function DropdownTopBarButton({ Icon, items, defaultLabel }) {
  const menu = (
    <Menu
      items={items.map((item) => ({
        key: item.label,
        label: item.label,
        disabled: item.disabled,
        onClick: () => item.onClick && item.onClick(),
      }))}
    />
  );

  return (
    <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
      <Button type="text" icon={<Icon size={20} />} />
    </Dropdown>
  );
}

/* ----------------- Notification Dropdown ----------------- */
function NotificationDropdown({ notifications }) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      overlay={
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => <List.Item>{item.text}</List.Item>}
          style={{ width: 250 }}
        />
      }
      trigger={["click"]}
      open={open}
      onOpenChange={(flag) => setOpen(flag)}
      placement="bottomRight"
    >
      <Badge count={notifications.length} offset={[0, 0]}>
        <Button type="text" icon={<Bell size={20} />} />
      </Badge>
    </Dropdown>
  );
}
