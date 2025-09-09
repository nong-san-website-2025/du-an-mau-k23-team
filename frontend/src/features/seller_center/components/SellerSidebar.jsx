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
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../assets/logo/imagelogo.png";

const { Sider } = Layout;

export default function SellerSidebar() {
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
      key: "store",
      icon: <ShopOutlined />,
      label: "Cửa hàng",
      children: [
        { key: "/seller-center/store/info", label: "Thông tin cửa hàng" },
      ],
    },
    {
      key: "products",
      icon: <AppstoreOutlined />,
      label: "Sản phẩm",
      children: [
        { key: "/seller-center/products", label: "Danh sách" },
        { key: "/seller-center/products/add", label: "Thêm sản phẩm" },
      ],
    },
    {
      key: "orders",
      icon: <ShoppingCartOutlined />,
      label: "Đơn hàng",
      children: [
        { key: "/seller-center/orders/new", label: "Đơn mới" },
        { key: "/seller-center/orders/processing", label: "Đang xử lý" },
      ],
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
      key: "/seller-center/finance",
      icon: <DollarOutlined />,
      label: "Doanh thu",
    },
    {
      key: "/seller-center/analytics",
      icon: <BarChartOutlined />,
      label: "Thống kê",
    },
    {
      key: "/seller-center/settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
  ];

  // Hàm điều hướng
  const onClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider width={250} className="h-screen bg-white shadow-md" >
      <div
        className="flex items-center justify-center gap-2 py-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/assets/logo/imagelogo.png" // 👉 thay bằng logo thật của bạn
          alt="Logo"
          style={{ height: "36px", marginLeft: "10px" }}
        />
        <span className="font-bold text-green-600 text-lg">Seller Center</span>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={onClick}
        items={menuItems}
        style={{ height: "100%" }}
      />
    </Sider>
  );
}
