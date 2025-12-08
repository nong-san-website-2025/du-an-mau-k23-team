import { Badge, Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "@ant-design/icons";
import axios from "axios";
import "../styles/AdminSidebar.css";

import React, { useEffect, useState } from "react";

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingSellers, setPendingSellers] = useState(0);

  useEffect(() => {
    const fetchPendingSellers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/sellers/pending-count/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPendingSellers(res.data.count || 0);
      } catch (err) {
        console.error("Lỗi lấy pending sellers:", err);
      }
    };

    fetchPendingSellers();
    const interval = setInterval(fetchPendingSellers, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      key: "/admin",
      icon: <HomeOutlined />,
      label: "Tổng quan",
    },
    {
      type: "divider",
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Người dùng",
      children: [
        {
          key: "/admin/users",
          label: "Quản lý người dùng",
        },
      ],
    },
    {
      key: "sellers",
      icon: <ShopOutlined />,
      label: "Cửa hàng",
      children: [
        {
          key: "/admin/sellers/business",
          label: "Quản lý cửa hàng",
        },
        {
          key: "/admin/sellers/approval",
          label: (
            <div className="menu-badge-item" style={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}>
              <span>Duyệt cửa hàng</span>
              <Badge count={pendingSellers} size="small" overflowCount={99}  />
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
        {
          key: "/admin/products/approval",
          label: "Duyệt sản phẩm",
        },
        {
          key: "/admin/products/categories",
          label: "Quản lý danh mục",
        },
      ],
    },
    {
      key: "orders",
      icon: <ShoppingCartOutlined />,
      label: "Đơn hàng",
      children: [
        {
          key: "/admin/orders",
          label: "Quản lý đơn hàng",
        },
      ],
    },
    {
      key: "payments",
      icon: <BankOutlined />,
      label: "Thanh toán",
      children: [
        {
          key: "/admin/payments/wallets",
          label: "Ví tiền seller",
        },
      ],
    },
    {
      key: "/admin/revenue",
      icon: <DollarOutlined />,
      label: "Doanh thu",
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Thống kê",
      children: [
        {
          key: "/admin/reports/products",
          label: "Sản phẩm",
        },
        {
          key: "/admin/reports/orders",
          label: "Đơn hàng",
        },
        {
          key: "/admin/reports/customers",
          label: "Khách hàng",
        },
        {
          key: "/admin/reports/agriculture",
          label: "Cửa hàng",
        },
      ],
    },
    {
      key: "marketing",
      icon: <NotificationOutlined />,
      label: "Marketing",
      children: [
        {
          key: "/admin/marketing/banners",
          label: "Quản lý Banner",
        },
        {
          key: "/admin/marketing/blogs",
          label: "Quản lý Bài Viết",
        },
        {
          key: "/admin/promotions/flashsale",
          label: "Quản lý Flash Sale",
        },
      ],
    },
    {
      key: "complaints",
      icon: <WarningOutlined />,
      label: "Khiếu nại",
      children: [
        {
          key: "/admin/complaints/user-reports",
          label: "Người dùng báo cáo",
        },
      ],
    },
    {
      key: "reviews",
      icon: <CommentOutlined />,
      label: "Đánh giá",
      children: [
        {
          key: "/admin/reviews",
          label: "Quản lý đánh giá",
        },
      ],
    },
    {
      key: "promotions",
      icon: <TagOutlined />,
      label: "Khuyến mãi",
      children: [
        {
          key: "/admin/promotions",
          label: "Quản lý khuyến mãi",
        },
      ],
    },
  ];

  const onClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider width={250} className="sidebar">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={onClick}
        items={menuItems}
        inlineIndent={24}
        style={{ borderRight: 0, height: "100%" }}
        className="custom-menu"
      />
    </Sider>
  );
};

export default Sidebar;
