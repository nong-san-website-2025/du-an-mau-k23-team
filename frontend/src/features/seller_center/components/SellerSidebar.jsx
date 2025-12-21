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
      label: "Tin nhắn",
    },
    {
      key: "/seller-center/notifications",
      icon: (
        <Badge
          count={unreadCount} // Lấy từ Hook
          overflowCount={99}
          size="small"
          offset={[5, 0]}
        >
          <BellOutlined />
        </Badge>
      ),
      label: "Thông báo",
    },
    {
      key: "products",
      icon: <AppstoreOutlined />,
      label: "Sản phẩm",
      children: [{ key: "/seller-center/products", label: "Quản lý sản phẩm" }],
    },
    {
      key: "orders",
      icon: <ShoppingCartOutlined />,
      label: "Đơn hàng",
      children: [
        { key: "/seller-center/orders/new", label: "Đơn mới" },
        { key: "/seller-center/orders/processing", label: "Đang xử lý" },
        { key: "/seller-center/orders/delivered", label: "Đơn hoàn tất" },
        { key: "/seller-center/orders/cancelled", label: "Đơn đã hủy" },
      ],
    },
    {
      key: "/seller-center/finance",
      icon: <DollarOutlined />,
      label: "Doanh thu",
    },
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
      label: "Cửa hàng",
    },
  ], [unreadCount]); // Re-render menu khi số lượng tin nhắn thay đổi

  const defaultOpenKeys = useMemo(() => {
    const foundParent = menuItems.find((item) =>
      item.children?.some((child) => child.key === location.pathname)
    );
    return foundParent ? [foundParent.key] : [];
  }, [location.pathname, menuItems]);

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
      width={250}
      theme="light"
      className="seller-sidebar h-screen"
      style={{
        position: isMobile ? "relative" : "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className="flex items-center justify-center cursor-pointer border-b border-gray-200 bg-white px-4"
        style={{ height: 64 }}
      >
        <Tooltip title={collapsed ? "Seller Center" : ""} placement="right">
          <img
            src="/assets/logo/defaultLogo.png"
            alt="Seller"
            className="h-10 w-auto object-contain"
          />
        </Tooltip>
      </div>

      <div className="overflow-y-auto" style={{ height: "calc(100vh - 64px)" }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          className="seller-menu"
          style={{ borderRight: 0, paddingTop: "8px" }}
        />
      </div>
    </Sider>
  );
}