import React, { useState, useEffect } from "react";
import {
  Layout,
  Avatar,
  Dropdown,
  Button,
  Typography,
  Space,
  theme,
  Skeleton,
  Spin,
  Input,
} from "antd";
import {
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import sellerService from "../services/api/sellerService";

const { Header } = Layout;
const { Text } = Typography;

const getAvatarLabel = (name) => {
  if (!name) return "?";
  const firstWord = name.trim().split(/\s+/)[0] || name.trim().charAt(0);
  return firstWord.charAt(0).toUpperCase();
};

export default function SellerTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true);
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
        <div
          className="flex flex-col px-2 py-1 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 100 }} />
          ) : (
            <>
              <Text strong>{seller?.store_name || "Chưa đặt tên Shop"}</Text>
              <Text type="secondary" className="text-xs truncate w-40">
                {seller?.email || seller?.name || "Seller"}
              </Text>
            </>
          )}
        </div>
      ),
    },
    { type: "divider" },
    { key: "profile", icon: <UserOutlined />, label: "Cửa hàng" },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  return (
    <Header
      style={{
        padding: "0 24px",
        background: token.colorBgContainer,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 8px rgba(0, 0, 0, 0.06)",
        height: 64,
        borderBottom: `1px solid ${token.colorBorder}`,
      }}
    >
      {/* Left: Toggle Button */}
      <div className="flex items-center">
        {onToggleSidebar && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onToggleSidebar}
            style={{ fontSize: "16px", width: 40, height: 40 }}
            className="hover:bg-gray-100 transition-colors duration-200"
          />
        )}
      </div>


      {/* Right: User Profile */}
      <Space size={16}>
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === "logout") {
                localStorage.removeItem("accessToken");
                navigate("/login");
              } else if (key === "profile") {
                navigate("/seller-center/store/info");
              }
            },
          }}
          placement="bottomRight"
          arrow
          trigger={["click"]}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            style={{ height: "48px" }}
          >
            {loading ? (
              <Spin size="small" />
            ) : (
              <>
                <Avatar
                  size={36}
                  style={{
                    backgroundColor: token.colorPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  src={seller?.avatar}
                  icon={!seller?.avatar && <UserOutlined />}
                >
                </Avatar>
              </>
            )}
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
}