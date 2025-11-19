import { Badge, Layout, Menu } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

  return (
    <Sider width={250} className="sidebar">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => key.startsWith("/") && navigate(key)}
        style={{ borderRight: 0 }}
      >

        {/* Tổng quan */}
        <Menu.Item key="/admin" icon={<HomeOutlined />}>
          <Link to="/admin">Tổng quan</Link>
        </Menu.Item>

        {/* Người dùng */}
        <Menu.SubMenu key="users" icon={<UserOutlined />} title="Người dùng">
          <Menu.Item key="/admin/users">
            <Link to="/admin/users">Quản lý người dùng</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Cửa hàng */}
        <Menu.SubMenu key="sellers" icon={<ShopOutlined />} title="Cửa hàng">
          <Menu.Item key="/admin/sellers/business">
            <Link to="/admin/sellers/business">Quản lý cửa hàng</Link>
          </Menu.Item>

          <Menu.Item key="/admin/sellers/approval">
            <div className="menu-badge-item">
              <Link to="/admin/sellers/approval">Duyệt cửa hàng</Link>
              <Badge count={pendingSellers} size="small" overflowCount={99} />
            </div>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Sản phẩm */}
        <Menu.SubMenu key="products" icon={<InboxOutlined />} title="Sản phẩm & Danh mục">
          <Menu.Item key="/admin/products/approval">
            <Link to="/admin/products/approval">Duyệt sản phẩm</Link>
          </Menu.Item>
          <Menu.Item key="/admin/products/categories">
            <Link to="/admin/categories">Quản lý danh mục</Link>
          </Menu.Item>
          <Menu.Item key="/admin/brands">
            <Link to="/admin/brands">Quản lý thương hiệu</Link>
          </Menu.Item>
          <Menu.Item key="/admin/products/violations">
            <Link to="/admin/products/violations">Sản phẩm vi phạm</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Đơn hàng */}
        <Menu.SubMenu key="orders" icon={<ShoppingCartOutlined />} title="Đơn hàng & Vận chuyển">
          <Menu.Item key="/admin/orders">
            <Link to="/admin/orders">Quản lý đơn hàng</Link>
          </Menu.Item>
          <Menu.Item key="/admin/shipping">
            <Link to="/admin/shipping">Đối tác vận chuyển</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Thanh toán */}
        <Menu.SubMenu key="payments" icon={<DollarOutlined />} title="Thanh toán">
          <Menu.Item key="/admin/payments/transactions">
            <Link to="/admin/payments/transactions">Giao dịch</Link>
          </Menu.Item>
          <Menu.Item key="/admin/payments/wallets">
            <Link to="/admin/payments/wallets">Ví tiền seller</Link>
          </Menu.Item>
          <Menu.Item key="/admin/payments/revenue">
            <Link to="/admin/payments/revenue">Đối soát doanh thu</Link>
          </Menu.Item>
          <Menu.Item key="/admin/payments/fraud">
            <Link to="/admin/payments/fraud">Phát hiện gian lận</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Báo cáo */}
        <Menu.SubMenu key="reports" icon={<BarChartOutlined />} title="Thống kê & Báo cáo">
          <Menu.Item key="/admin/reports/revenue">
            <Link to="/admin/reports/revenue">Doanh thu</Link>
          </Menu.Item>
          <Menu.Item key="/admin/reports/products">
            <Link to="/admin/reports/products">Sản phẩm</Link>
          </Menu.Item>
          <Menu.Item key="/admin/reports/orders">
            <Link to="/admin/reports/orders">Đơn hàng</Link>
          </Menu.Item>
          <Menu.Item key="/admin/reports/customers">
            <Link to="/admin/reports/customers">Khách hàng</Link>
          </Menu.Item>
          <Menu.Item key="/admin/reports/agriculture">
            <Link to="/admin/reports/agriculture">Cửa hàng</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Marketing */}
        <Menu.SubMenu key="marketing" icon={<NotificationOutlined />} title="Marketing">
          <Menu.Item key="/admin/marketing/banners">
            <Link to="/admin/marketing/banners">Quản lý Banner</Link>
          </Menu.Item>
          <Menu.Item key="/admin/marketing/blogs">
            <Link to="/admin/marketing/blogs">Quản lý Bài Viết</Link>
          </Menu.Item>
          <Menu.Item key="/admin/promotions/flashsale">
            <Link to="/admin/promotions/flashsale">Quản lý Flash Sale</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Khiếu nại */}
        <Menu.SubMenu key="complaints" icon={<WarningOutlined />} title="Khiếu nại">
          <Menu.Item key="/admin/complaints/user-reports">
            <Link to="/admin/complaints/user-reports">Người dùng báo cáo</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* Khuyến mãi */}
        <Menu.SubMenu key="promotions" icon={<TagOutlined />} title="Khuyến mãi">
          <Menu.Item key="/admin/promotions">
            <Link to="/admin/promotions">Quản lý khuyến mãi</Link>
          </Menu.Item>
        </Menu.SubMenu>

      </Menu>
    </Sider>
  );
};

export default Sidebar;
