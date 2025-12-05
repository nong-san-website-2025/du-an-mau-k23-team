import React from "react";
import { Menu, Layout } from "antd";
import {
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  StarOutlined,
  DollarOutlined,
  BarChartOutlined,
  WarningOutlined,
  WechatOutlined,
  WalletOutlined, //
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SellerSidebar.css";

const { Sider } = Layout;

export default function SellerSidebar({ onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Items cho Menu
  const menuItems = [
    {
      key: "/seller-center/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
    },

    {
      type: "divider",
    },

    {
      key: "/seller-center/messages",
      icon: <WechatOutlined />,
      label: "Tin nhắn",
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
      key: "/seller-center/promotions",
      icon: <GiftOutlined />,
      label: "Khuyến mãi",
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

  // Hàm điều hướng
  const onClick = ({ key }) => {
    navigate(key);
    if (onItemClick) onItemClick(); // Close drawer on mobile
  };

  return (
    <Sider width={250} className="h-screen bg-white shadow-md">
      {/* Logo */}
      <div
        className="flex items-center justify-center gap-3 py-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/assets/logo/defaultLogo.png"
          alt="Logo"
          style={{ height: "60px", width: "50px", paddingBottom: 16 }}
        />
        <span
          className=""
          style={{ fontSize: "24px", fontWeight: "bold", paddingTop: 10 }}
        >
          Trang người bán
        </span>
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={onClick}
        items={menuItems}
        style={{ height: "100%" }}
        className="custom-menu"
      />
    </Sider>
  );
}
