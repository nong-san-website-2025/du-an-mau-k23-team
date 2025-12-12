import React, { useMemo } from "react";
import { Menu, Layout, Tooltip } from "antd";
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
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SellerSidebar.css";

const { Sider } = Layout;

export default function SellerSidebar({ collapsed, isMobile, onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: "/seller-center/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
    },
    { type: "divider" },
    { key: "/seller-center/messages", icon: <WechatOutlined />, label: "Tin nhắn" },
    {
      key: "products",
      icon: <AppstoreOutlined />,
      label: "Sản phẩm",
      children: [
        { key: "/seller-center/products", label: "Quản lý sản phẩm" },
      ],
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
      label: "Cửa hàng",
    },
  ];

  const defaultOpenKeys = useMemo(() => {
    const foundParent = menuItems.find((item) =>
      item.children?.some((child) => child.key === location.pathname)
    );
    return foundParent ? [foundParent.key] : [];
  }, [location.pathname]);

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile && onItemClick) onItemClick();
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      theme="light"
      className="seller-sidebar h-screen left-0 top-0 bottom-0 z-50"
      style={{
        position: isMobile ? "relative" : "fixed",
        borderRight: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* --- LOGO AREA --- */}
      <div
        className="flex items-center justify-center cursor-pointer border-b border-gray-200 bg-white px-4 transition-all duration-300"
        style={{ height: 64 }}
      >
        <Tooltip
          title={collapsed ? "Seller Center" : ""}
          placement="right"
        >
          <img
            src="/assets/logo/defaultLogo.png"
            alt="Seller"
            className="h-10 w-auto object-contain transition-all duration-300"
          />
        </Tooltip>

        {!collapsed && (
          <span
            className="ml-2 font-bold text-gray-800 whitespace-nowrap transition-opacity duration-200 custom-title-logo"
            style={{ fontSize: "26px", fontWeight: 600, marginTop: 10 }}
          >
          </span>
        )}
      </div>

      {/* --- SCROLLABLE MENU AREA --- */}
      <div
        className="seller-sidebar-menu overflow-y-auto"
        style={{ height: "calc(100vh - 64px)" }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            paddingTop: "8px",
            paddingBottom: "8px",
          }}
          className="seller-menu"
        />
      </div>
    </Sider>
  );
}