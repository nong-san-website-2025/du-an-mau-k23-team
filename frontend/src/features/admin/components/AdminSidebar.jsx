import React, { useEffect, useState } from "react";
import { Layout, Menu, Badge } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  HomeOutlined,
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  BarChartOutlined,
  NotificationOutlined,
  InboxOutlined,
  WarningOutlined,
  TagOutlined,
  CommentOutlined,
  BankOutlined,
  AppstoreOutlined,
  BugOutlined,
} from "@ant-design/icons";

// Import file CSS styles
import "../styles/AdminSidebar.css"; 

const { Sider } = Layout;

const AdminSidebar = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingSellers, setPendingSellers] = useState(0);

  // Logic API giữ nguyên
  useEffect(() => {
    const fetchPendingSellers = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_API_URL; 
        
        const res = await axios.get(
          `${apiUrl}/sellers/pending-count/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPendingSellers(res.data.count || 0);
      } catch (err) {
        // console.error("Lỗi lấy pending sellers:", err);
      }
    };

    fetchPendingSellers();
    const interval = setInterval(fetchPendingSellers, 30000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { key: "/admin", icon: <HomeOutlined />, label: "Tổng quan" },
    { type: "divider" },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Người dùng",
      children: [{ key: "/admin/users", label: "Quản lý người dùng" }],
    },
    {
      key: "sellers",
      icon: <ShopOutlined />,
      label: "Cửa hàng",
      children: [
        { key: "/admin/sellers/business", label: "Quản lý cửa hàng" },
        {
          key: "/admin/sellers/approval",
          label: (
            <div
              className="menu-badge-item"
              style={{
                justifyContent: "space-between",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span>Duyệt cửa hàng</span>
              <Badge count={pendingSellers} size="small" overflowCount={99} />
            </div>
          ),
        },
      ],
    },
    {
      key: "products",
      icon: <InboxOutlined />,
      label: "Sản phẩm & Danh mục",
      children: [
        { key: "/admin/products/approval", label: "Quản lý sản phẩm" },
        { key: "/admin/products/categories", label: "Quản lý danh mục" },
      ],
    },
    {
      key: "/admin/orders",
      icon: <ShoppingCartOutlined />,
      label: "Giám sát đơn hàng",
    },
    {
      key: "payments",
      icon: <BankOutlined />,
      label: "Thanh toán",
      children: [{ key: "/admin/payments/wallets", label: "Ví tiền seller" }],
    },
    { key: "/admin/revenue", icon: <DollarOutlined />, label: "Doanh thu" },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Thống kê",
      children: [
        { key: "/admin/reports/products", label: "Sản phẩm" },
        { key: "/admin/reports/orders", label: "Đơn hàng" },
        { key: "/admin/reports/customers", label: "Khách hàng" },
        { key: "/admin/reports/agriculture", label: "Cửa hàng" },
      ],
    },
    {
      key: "marketing",
      icon: <NotificationOutlined />,
      label: "Marketing",
      children: [
        { key: "/admin/marketing/banners", label: "Quản lý Banner" },
        { key: "/admin/marketing/blogs", label: "Quản lý Bài Viết" },
        { key: "/admin/promotions/flashsale", label: "Quản lý Flash Sale" },
      ],
    },
    {
      key: "complaints",
      icon: <WarningOutlined />,
      label: "Quản lý trả hàng",
      children: [{ key: "/admin/complaints/user-reports", label: "Trả hàng/ hoàn tiền" }],
    },
    {
      key: "reviews",
      icon: <CommentOutlined />,
      label: "Đánh giá",
      children: [{ key: "/admin/reviews", label: "Quản lý đánh giá" }],
    },
    // === PHẦN ĐÃ CHỈNH SỬA ===
    {
      key: "promotions",
      icon: <TagOutlined />,
      label: "Khuyến mãi",
      children: [
        { key: "/admin/promotions", label: "Quản lý khuyến mãi" },
        // Thêm dòng này để tạo menu mới
        { key: "/admin/promotions/usage", label: "Quản lý sử dụng voucher" } 
      ],
    },
    // ==========================

    {
      key: "test-ui-group", // Key của menu cha
      icon: <BugOutlined />, // Icon màu đỏ nổi bật
      label: "Thông báo",
      children: [
        {
          key: "/admin/notifications", // Key này phải khớp chính xác với Route path trong AdminRoutes
          label: "Quản lý thông báo",
        },
      ],
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      theme="light"
      className="custom-sidebar" // Thêm class để CSS hook vào
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed', // QUAN TRỌNG: Phải là fixed để đi kèm với marginLeft bên Layout
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100, // Đảm bảo luôn nổi lên trên
        boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
        borderRight: "1px solid #f0f0f0"
      }}
    >
      {/* Logo */}
      <div 
        className="d-flex align-items-center justify-content-center" 
        style={{ 
          height: 64, 
          position: 'sticky', 
          top: 0, 
          zIndex: 1, 
          background: '#fff',
          borderBottom: '1px solid #f0f0f0' 
        }}
      >
        <img src="/assets/logo/defaultLogo.png" alt="Logo" style={{ height: 36 }} />
        {!collapsed && (
          <span className="ms-2 fs-5 fw-bold text-success" style={{ whiteSpace: 'nowrap', transition: 'all 0.3s' }}>
            GreenFarm
          </span>
        )}
      </div>
      
      {/* Menu */}
      <Menu
        mode="inline"
        defaultSelectedKeys={[location.pathname]}
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['users', 'sellers', 'products', 'orders', 'promotions']} // Thêm 'promotions' vào để mặc định mở menu này nếu cần
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, paddingTop: 10, paddingBottom: 60 }}
      />
    </Sider>
  );
};

export default AdminSidebar;