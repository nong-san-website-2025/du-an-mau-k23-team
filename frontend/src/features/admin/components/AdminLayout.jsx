import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Dropdown, Button, Avatar, theme, Modal } from "antd";
import { UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../login_register/services/AuthContext";
import "../styles/AdminLayout.css";

const { Header, Content } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Sử dụng Modal của Antd để đồng bộ giao diện
  const handleLogout = () => {
    Modal.confirm({
      title: "Xác nhận đăng xuất",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn rời khỏi hệ thống?",
      okText: "Đăng xuất",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        logout();
        navigate("/login");
      },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar: Cố định bên trái */}
      <AdminSidebar collapsed={collapsed} />

      {/* Main Content Wrapper */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? 80 : 260, 
          transition: "all 0.2s ease", 
          minHeight: "100vh",
          background: '#f5f5f5'
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
          <Outlet />
          
          <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: "13px" }}>
              GreenFarm Admin ©2025. Phát triển bởi <span style={{ color: '#52c41a', fontWeight: 'bold' }}>GreenFarm Dev Team</span>.
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

/**
 * Component UserDropdown đã được merge logic
 * Ưu tiên dùng data từ AuthContext để tránh gọi API trùng lặp
 */
function UserDropdown({ onLogout, navigate }) {
  const { user } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || "";

  // Xử lý URL avatar: Ưu tiên URL tuyệt đối, sau đó là URL nối từ backend, cuối cùng là null
  const avatarUrl = React.useMemo(() => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith("http")) return user.avatar;
    
    // Loại bỏ '/api' khỏi URL nếu backend trả về đường dẫn static media
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${user.avatar}`;
  }, [user?.avatar, apiUrl]);

  const menuItems = [
    { key: "profile", label: "Thông tin cá nhân", onClick: () => navigate("/admin/profile") },
    { key: "content", label: "GreenFarm & Chính Sách", onClick: () => navigate("/admin/content/pages") },
    { type: "divider" },
    { key: "logout", label: "Đăng xuất", onClick: onLogout, danger: true },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow trigger={['click']}>
      <div className="d-flex align-items-center gap-2 p-1 px-2 rounded hover-bg-light" style={{ cursor: "pointer" }}>
        <span className="fw-semibold d-none d-md-block text-secondary">
          {user?.username || user?.full_name || "Admin"}
        </span>
        <Avatar 
          size="large" 
          icon={<UserOutlined />} 
          src={avatarUrl} 
          style={{ border: '1px solid #e5e7eb', backgroundColor: '#52c41a' }} 
        /> 
      </div>
    </Dropdown>
  );
}