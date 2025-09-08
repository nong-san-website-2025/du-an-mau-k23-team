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
import { useTranslation } from "react-i18next";
import "../styles/AdminSidebar.css";

const { Sider } = Layout;

const Sidebar = () => {
  const { t } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sider width={250} className="sidebar">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        style={{ height: "100%", borderRight: 0 }}
      >
        <Menu.Item key="" icon={<HomeOutlined />}>
          <Link to="/admin/">{t("Dashboard")}</Link>
        </Menu.Item>

        <Menu.SubMenu key="users" icon={<UserOutlined />} title={t("Users")}>
          <Menu.Item key="users">
            <Link to="/admin/users">{t("User_manage")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="seller-management"
          icon={<ShopOutlined />}
          title={t("Shops")}
        >
          <Menu.Item key="/admin/sellers/business">
            <Link to="/admin/sellers/business">{t("Shops_active_blocked")}</Link>
          </Menu.Item>
          <Menu.Item key="/admin/sellers/approval">
            <Link to="/admin/sellers/approval">{t("Approve_shops")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="products"
          icon={<InboxOutlined />}
          title={t("Products_categories")}
        >
          <Menu.Item key="/admin/products/approval">
            <Link to="/admin/products/approval">{t("Approve_products")}</Link>
          </Menu.Item>
          <Menu.Item key="/admin/products/categories">
            <Link to="/admin/categories">{t("Manage_categories")}</Link>
          </Menu.Item>
          <Menu.Item key="brands">
            <Link to="/admin/brands">{t("Manage_brands")}</Link>
          </Menu.Item>
          <Menu.Item key="violations">
            <Link to="/admin/products/violations">{t("Violations")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="orders"
          icon={<ShoppingCartOutlined />}
          title={t("Orders_shipping")}
        >
          <Menu.Item key="order-monitor">
            <Link to="/admin/orders">{t("Order_monitor")}</Link>
          </Menu.Item>
          <Menu.Item key="shipping-partners">
            <Link to="/admin/shipping">{t("Shipping_partners")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="payments"
          icon={<DollarOutlined />}
          title="Thanh toán"
        >
          <Menu.Item key="transactions">
            <Link to="/admin/payments/transactions">{t("Transactions")}</Link>
          </Menu.Item>
          <Menu.Item key="wallets">
            <Link to="/admin/payments/wallets">{t("Wallets")}</Link>
          </Menu.Item>
          <Menu.Item key="revenue">
            <Link to="/admin/payments/revenue">{t("Revenue")}</Link>
          </Menu.Item>
          <Menu.Item key="fraud">
            <Link to="/admin/payments/fraud">{t("Fraud")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="reports"
          icon={<BarChartOutlined />}
          title="Thống kê & Báo cáo"
        >
          <Menu.Item key="report-revenue">
            <Link to="/admin/reports/revenue">{t("Report_revenue")}</Link>
          </Menu.Item>
          <Menu.Item key="report-top-products">
            <Link to="/admin/reports/top-products">{t("Report_top_products")}</Link>
          </Menu.Item>
          <Menu.Item key="report-cancel-rate">
            <Link to="/admin/reports/cancel-rate">{t("Report_cancel_rate")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu
          key="marketing"
          icon={<NotificationOutlined />}
          title="Marketing"
        >
          <Menu.Item key="banner">
            <Link to="/admin/marketing/banners">{t("Banner")}</Link>
          </Menu.Item>
          <Menu.Item key="flash-sale">
            <Link to="/admin/marketing/flashsale">{t("Flash_sale")}</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* 📑 Khiếu nại / Báo cáo */}
        <Menu.SubMenu key="complaints" icon={<WarningOutlined />} title="Khiếu nại / Báo cáo">
          <Menu.Item key="/admin/complaints/user-reports">
            <Link to="/admin/complaints/user-reports">Người dùng báo cáo</Link>
          </Menu.Item>
        </Menu.SubMenu>

        {/* 🎁 Khuyến mãi */}
        <Menu.SubMenu key="promotions" icon={<GiftOutlined />} title="Khuyến mãi">
          <Menu.Item key="/admin/promotions/coupons">
            <Link to="/admin/promotions/coupons">Mã giảm giá hệ thống</Link>
          </Menu.Item>
          <Menu.Item key="/admin/promotions/flashsale">
            <Link to="/admin/promotions/flashsale">Flash Sale / Voucher</Link>
          </Menu.Item>
          <Menu.Item key="/admin/promotions/seller-support">
            <Link to="/admin/promotions/seller-support">Hỗ trợ seller</Link>
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
