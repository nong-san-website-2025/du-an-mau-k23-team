import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Dropdown, Button, Avatar, theme } from "antd";
import { UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../login_register/services/AuthContext";
import axios from "axios";
import "../styles/AdminLayout.css";

const { Header, Content } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    // Sử dụng Modal.confirm của Antd sẽ đẹp hơn, nhưng window.confirm vẫn ok
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar: Fixed position, width 260px */}
      <AdminSidebar collapsed={collapsed} />

      {/* Main Content Wrapper: 
          Dùng marginLeft để "tránh" Sidebar. 
          Khi Sidebar thu nhỏ, width là 80px => marginLeft 80px.
          Khi Sidebar mở rộng, width là 260px => marginLeft 260px.
      */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? 80 : 260, 
          transition: "all 0.2s ease", 
          minHeight: "100vh",
          background: '#f5f5f5' // Nền xám nhạt tổng thể
        }}
      >
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            zIndex: 99,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="d-flex align-items-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: "16px", width: 64, height: 64 }}
            />
            <h5 className="m-0 ms-2 text-secondary" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
              DASHBOARD
            </h5>
          </div>

          <div className="d-flex align-items-center gap-3">
             <UserDropdown onLogout={handleLogout} navigate={navigate} />
          </div>
        </Header>

        <Content style={{ margin: "24px 24px 0", overflow: "initial" }}>
          {/* Outlet chứa các trang con */}
          <Outlet />
          
          <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: "13px" }}>
             GreenFarm Admin ©2025 Created by GreenFarm Dev Team
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

// UserDropdown Component giữ nguyên như cũ, rất tốt rồi
function UserDropdown({ onLogout, navigate }) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000"; 
        
        const res = await axios.get(`${apiUrl}/api/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data.avatar) {
          const fullUrl = res.data.avatar.startsWith("http")
            ? res.data.avatar
            : `${apiUrl}${res.data.avatar}`;
          setAvatarUrl(fullUrl);
        }
      } catch (err) {
        // console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const menuItems = [
    { key: "profile", label: "Thông tin cá nhân", onClick: () => navigate("/admin/profile") },
    { type: "divider" },
    { key: "logout", label: "Đăng xuất", onClick: onLogout, danger: true },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow trigger={['click']}>
      <div className="d-flex align-items-center gap-2 p-1 px-2 rounded hover-bg-light" style={{ cursor: "pointer" }}>
        <span className="fw-semibold d-none d-md-block text-secondary">Admin User</span>
        <Avatar size="large" icon={<UserOutlined />} src={avatarUrl} style={{ border: '1px solid #e5e7eb' }} /> 
      </div>
    </Dropdown>
  );
}