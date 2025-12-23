import React, { useMemo } from "react";
import { Menu, Layout, Tooltip, Badge } from "antd";
import {
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  DollarOutlined,
  BarChartOutlined,
  WarningOutlined,
  WechatOutlined,
  WalletOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
// Dùng chung CSS của Admin hoặc file riêng tùy bạn
import "../../admin/styles/AdminSidebar.css"; 
import useUserProfile from "../../users/services/useUserProfile"; // Import để lấy userId
import { useNotificationLogic } from "../../../layout/hooks/useNotificationLogic"; // Dùng hook chung
import "../styles/SellerSidebar.css";

const { Sider } = Layout;

export default function SellerSidebar({ collapsed, isMobile, onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Lấy thông tin User để truyền vào hook thông báo
  const userProfile = useUserProfile();
  
  // 2. Sử dụng Hook logic đã viết (Hook này đã lo cả Fetch ban đầu + WebSocket)
  const { unreadCount } = useNotificationLogic(userProfile?.id, navigate);

  // 3. Định nghĩa Menu Items
  const menuItems = useMemo(() => [
    {
      key: "/seller-center/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
    },
    { type: "divider" },
    { 
        key: "/seller-center/messages", 
        icon: <WechatOutlined />, 
        label: (
            <div className="d-flex justify-content-between align-items-center w-100">
              <span>Tin nhắn</span>
              <Badge count={0} size="small" offset={[5, 0]} />
            </div>
        )
    },
    {
      key: "/seller-center/products",
      icon: <AppstoreOutlined />,
      label: "Quản lý sản phẩm",
    },
    // --- SỬA ĐỔI Ở ĐÂY: Gộp thành 1 mục duy nhất ---
    {
      key: "/seller-center/orders", // Link dẫn thẳng tới trang chứa Tabs
      icon: <ShoppingCartOutlined />,
      label: "Quản lý đơn hàng",
      // Đã bỏ children (sub-menu)
    },
    // ----------------------------------------------
    { key: "/seller-center/finance", icon: <DollarOutlined />, label: "Doanh thu" },
    {
      key: "/seller-center/wallet",
      icon: <WalletOutlined />,
      label: "Ví tiền",
    },
    {
      key: "/seller-center/analytics",
      icon: <BarChartOutlined />,
      label: "Thống kê",
    },
    {
      key: "/seller-center/reviews",
      icon: <StarOutlined />,
      label: "Đánh giá",
    },
    {
      key: "/seller-center/complaints",
      icon: <WarningOutlined />,
      label: "Khiếu nại",
    },
    {
      key: "/seller-center/store/info",
      icon: <ShopOutlined />,
      label: "Hồ sơ Cửa hàng",
    },
  ], [unreadCount]); // Re-render menu khi số lượng tin nhắn thay đổi

  const defaultOpenKeys = useMemo(() => {
    const foundParent = menuItems.find((item) =>
      item.children?.some((child) => child.key === location.pathname)
    );
    // Mặc định mở menu Sản phẩm nếu đang ở trong đó
    return foundParent ? [foundParent.key] : ['products'];
  }, [location.pathname]);

  const handleMenuClick = ({ key }) => {
    navigate(key);
    // Lưu ý: Việc setUnreadCount(0) nên để trang SellerNotificationPage xử lý khi người dùng vào xem
    if (isMobile && onItemClick) onItemClick();
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      theme="light"
      className="custom-sidebar"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: isMobile ? "relative" : "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
        borderRight: "1px solid #f0f0f0"
      }}
    >
      {/* --- LOGO AREA --- */}
      <div 
        className="d-flex align-items-center justify-content-center" 
        style={{ 
          height: 64, 
          position: 'sticky', 
          top: 0, 
          zIndex: 1, 
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/seller-center/dashboard')}
      >
        <img
          src="/assets/logo/defaultLogo.png" 
          alt="Seller"
          style={{ height: 36 }}
        />
        {!collapsed && (
          <span 
            className="ms-2 fs-5 fw-bold text-success" 
            style={{ whiteSpace: 'nowrap', transition: 'all 0.3s' }}
          >
            Kênh Người Bán
          </span>
        )}
      </div>

      {/* --- MENU AREA --- */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={defaultOpenKeys}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, paddingTop: 10, paddingBottom: 60 }}
      />
    </Sider>
  );
}