import React, { useState, useEffect } from "react";
import {
  Layout,
  Avatar,
  Dropdown,
  Button,
  Typography,
  Space,
  theme,
  Spin,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  ShopOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import sellerService from "../services/api/sellerService"; // Check path import này nhé

const { Header } = Layout;
const { Text } = Typography;

export default function SellerTopbar({ collapsed, onToggleSidebar }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true);
        // Giả lập hoặc gọi API thật
        const data = await sellerService.getMe();
        setSeller(data);
      } catch (error) {
        console.error("Lỗi lấy thông tin seller:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, []);

  const userMenuItems = [
    {
      key: "info",
      label: (
        <div className="d-flex flex-column px-2 py-1" style={{ cursor: "default" }}>
            <Text strong>{seller?.store_name || "Cửa hàng của tôi"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {seller?.email || "seller@example.com"}
            </Text>
        </div>
      ),
    },
    { type: "divider" },
    { 
        key: "profile", 
        icon: <ShopOutlined />, 
        label: "Hồ sơ cửa hàng",
        onClick: () => navigate("/seller-center/store/info")
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: () => {
          localStorage.removeItem("accessToken");
          navigate("/login");
      }
    },
  ];

  return (
    <Header
      style={{
        padding: 0,
        background: token.colorBgContainer,
        position: "sticky",
        top: 0,
        zIndex: 99,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingRight: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", // Shadow nhẹ giống Admin
        height: 64
      }}
    >
      {/* Left: Toggle Button & Title */}
      <div className="d-flex align-items-center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleSidebar}
          style={{ fontSize: "16px", width: 64, height: 64 }}
        />
        <h5 className="m-0 ms-2 text-secondary" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
             SELLER CENTER
        </h5>
      </div>

      {/* Right: User Profile */}
      <Space size={16}>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={["click"]}>
          <div 
            className="d-flex align-items-center gap-2 p-1 px-2 rounded hover-bg-light" 
            style={{ cursor: "pointer", transition: 'background 0.3s' }}
          >
            {loading ? (
                <Spin size="small" />
            ) : (
                <>
                    <span className="fw-semibold d-none d-md-block text-secondary">
                        {seller?.name || "Seller User"}
                    </span>
                    <Avatar
                        size="large"
                        src={seller?.avatar}
                        icon={<UserOutlined />}
                        style={{ border: '1px solid #e5e7eb' }}
                    />
                </>
            )}
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
}