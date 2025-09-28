import { Layout, Menu } from "antd";
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
  GiftOutlined,
  TagOutlined,
} from "@ant-design/icons";
import "../styles/AdminSidebar.css";

const { Sider } = Layout;

const Sidebar = () => {

  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Sider width={250} className="sidebar">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => {
          if (typeof key === 'string' && key.startsWith('/')) navigate(key);
        }}
        style={{ height: "100%", borderRight: 0 }}
      >
        <Menu.Item key="dashboard" icon={<HomeOutlined />}>
          <Link to="/admin/">Tổng quan</Link>
        </Menu.Item>

        <Menu.SubMenu key="users" icon={<UserOutlined />} title="Người dùng">
          <Menu.Item key="users-list">
            <Link to="/admin/users">Quản lý người dùng</Link>
          </Menu.Item>
          {/* <Menu.Item key="roles">
            <Link to="/admin/roles">Phân quyền & vai trò</Link>
          </Menu.Item> */}
        </Menu.SubMenu>

        <Menu.SubMenu
          key="seller-management"
          icon={<ShopOutlined />}
          title="Cửa hàng"
        >
          <Menu.Item key="/admin/sellers/business">
            <Link to="/admin/sellers/business">Quản lý cửa hàng</Link>
          </Menu.Item>
          <Menu.Item key="/admin/sellers/approval">
            <Link to="/admin/sellers/approval">Duyệt cửa hàng</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="products"
          icon={<InboxOutlined />}
          title="Sản phẩm & Danh mục"
        >
          <Menu.Item key="/admin/products/approval">
            <Link to="/admin/products/approval">Duyệt sản phẩm</Link>
          </Menu.Item>
          <Menu.Item key="/admin/products/categories">
            <Link to="/admin/categories">Quản lý danh mục</Link>
          </Menu.Item>
          <Menu.Item key="brands">
            <Link to="/admin/brands">Quản lý thương hiệu</Link>
          </Menu.Item>
          <Menu.Item key="violations">
            <Link to="/admin/products/violations">Sản phẩm vi phạm</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="orders"
          icon={<ShoppingCartOutlined />}
          title="Đơn hàng & Vận chuyển"
        >
          <Menu.Item key="/admin/orders">
            <Link to="/admin/orders">{("Order_monitor")}</Link>
          </Menu.Item>
          <Menu.Item key="/admin/shipping">
            <Link to="/admin/shipping">{("Shipping_partners")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="payments"
          icon={<DollarOutlined />}
          title="Thanh toán"
        >
          <Menu.Item key="transactions">
            <Link to="/admin/payments/transactions">Giao dịch</Link>
          </Menu.Item>
          <Menu.Item key="wallets">
            <Link to="/admin/payments/wallets">Ví tiền seller</Link>
          </Menu.Item>
          <Menu.Item key="revenue">
            <Link to="/admin/payments/revenue">Đối soát doanh thu</Link>
          </Menu.Item>
          <Menu.Item key="fraud">
            <Link to="/admin/payments/fraud">Phát hiện gian lận</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
              key="reports"
              icon={<BarChartOutlined />}
              title="Thống kê & Báo cáo"
            >
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
                <Link to="/admin/reports/agriculture">Nông sản</Link>
              </Menu.Item>
            </Menu.SubMenu>


          <Menu.SubMenu
            key="marketing"
            icon={<NotificationOutlined />}
            title="Marketing"
          >
            <Menu.Item key="/admin/marketing/banners">
              <Link to="/admin/marketing/banners">{("Banner")}</Link>
            </Menu.Item>
            <Menu.Item key="flash-sale">
              <Link to="/admin/marketing/flashsale">{("Flash_sale")}</Link>
            </Menu.Item>
          </Menu.SubMenu>

        {/* 📑 Khiếu nại / Báo cáo */}
        <Menu.SubMenu key="complaints" icon={<WarningOutlined />} title="Khiếu nại / Báo cáo">
          <Menu.Item key="/admin/complaints/user-reports">
            <Link to="/admin/complaints/user-reports">Người dùng báo cáo</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="promotions"
          icon={<TagOutlined />}
          title="Khuyến mãi"
        >
          <Menu.Item key="/admin/promotions">
            <Link to="/admin/promotions">Quản lý khuyến mãi</Link>
          </Menu.Item>
          <Menu.Item key="/admin/promotions/flashsale">
            <Link to="/admin/promotions/flashsale">Flash Sale</Link>
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
