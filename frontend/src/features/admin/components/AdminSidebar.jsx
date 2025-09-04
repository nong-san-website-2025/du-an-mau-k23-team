import { Layout, Menu } from "antd";
import { Link, useLocation, useNavigate  } from "react-router-dom";
import {
  HomeOutlined,
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  BarChartOutlined,
  NotificationOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import "../styles/AdminSidebar.css"

const { Sider } = Layout;


const Sidebar = () => {
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
          <Link to="/admin/">Dashboard</Link>
        </Menu.Item>

        <Menu.SubMenu key="users" icon={<UserOutlined />} title="Người dùng">
          <Menu.Item key="users">
            <Link to="/admin/users">Quản lý người dùng</Link>
          </Menu.Item>
          {/* <Menu.Item key="roles">
            <Link to="/admin/roles">Phân quyền & vai trò</Link>
          </Menu.Item> */}
        </Menu.SubMenu>

        <Menu.SubMenu key="seller-management" icon={<ShopOutlined  />} title="Cửa hàng">
          <Menu.Item key="/admin/sellers/business">
            <Link to="/admin/sellers/business">Cửa hàng hoạt động/khóa</Link>
          </Menu.Item>
          <Menu.Item key="/admin/sellers/approval">
            <Link to="/admin/sellers/approval">Duyệt cửa hàng đăng ký</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu key="products" icon={<InboxOutlined /> } title="Sản phẩm & Danh mục">
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

        <Menu.SubMenu key="orders" icon={<ShoppingCartOutlined />} title="Đơn hàng & Vận chuyển">
          <Menu.Item key="order-monitor">
            <Link to="/admin/orders">Giám sát đơn hàng</Link>
          </Menu.Item>
          <Menu.Item key="shipping-partners">
            <Link to="/admin/shipping">Đối tác vận chuyển</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu key="payments" icon={<DollarOutlined />} title="Thanh toán">
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

        <Menu.SubMenu key="reports" icon={<BarChartOutlined />} title="Thống kê & Báo cáo">
          <Menu.Item key="report-revenue">
            <Link to="/admin/reports/revenue">Doanh thu</Link>
          </Menu.Item>
          <Menu.Item key="report-top-products">
            <Link to="/admin/reports/top-products">Sản phẩm bán chạy</Link>
          </Menu.Item>
          <Menu.Item key="report-cancel-rate">
            <Link to="/admin/reports/cancel-rate">Tỉ lệ huỷ/hoàn đơn</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu key="marketing" icon={<NotificationOutlined />} title="Marketing">
          <Menu.Item key="banner">
            <Link to="/admin/marketing/banners">Banner quảng cáo</Link>
          </Menu.Item>
          <Menu.Item key="flash-sale">
            <Link to="/admin/marketing/flashsale">Flash Sale / Campaign</Link>
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
