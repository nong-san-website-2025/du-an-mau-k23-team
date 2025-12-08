import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Avatar,
  Dropdown,
  Badge,
  Spin,
  Button,
  List,
  Typography,
  Tooltip,
  Skeleton,
} from "antd";
import { UserOutlined, BellOutlined, MenuOutlined } from "@ant-design/icons";
import sellerService from "../services/api/sellerService";

const { Header } = Layout;

export default function SellerTopbar({ onToggleSidebar }) {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Có đơn hàng mới", isRead: false },
    { id: 2, message: "Khách hủy đơn #1234", isRead: false },
    { id: 3, message: "Hệ thống bảo trì lúc 23h", isRead: true },
  ]);

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const data = await sellerService.getMe();
        setSeller(data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin seller:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, []);

  const getInitial = (name) => {
    if (!name) return "?";
    const firstWord = name.trim().split(/\s+/)[0] || name.trim().charAt(0);
    const withoutDiacritics = firstWord
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return (withoutDiacritics.charAt(0) || "?").toUpperCase();
  };

  const menuItems = [
    { key: "profile", label: "Hồ sơ" },
    { key: "logout", label: "Đăng xuất" },
  ];

  const onMenuClick = ({ key }) => {
    if (key === "logout") {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  const notificationMenu = useMemo(
    () => (
      <List
        size="small"
        style={{ width: 300, maxHeight: 320, overflowY: "auto" }}
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            style={{
              backgroundColor: item.isRead ? "#fff" : "#f5f5f5",
              cursor: "pointer",
              padding: "8px 12px",
            }}
          >
            <Typography.Text strong={!item.isRead}>
              {item.message}
            </Typography.Text>
          </List.Item>
        )}
      />
    ),
    [notifications]
  );

  return (
    <Header
      className="bg-white px-4 shadow-sm"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Toggle sidebar for mobile */}
      {onToggleSidebar && (
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onToggleSidebar}
          style={{ fontSize: 20 }}
        />
      )}
      <div style={{ flex: 1 }} /> {/* Spacer */}
      {/* Notifications */}
      {loading ? (
        <Spin size="small" style={{ marginRight: 16 }} />
      ) : (
        <Dropdown
          overlay={notificationMenu}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Badge
            count={notifications.filter((n) => !n.isRead).length}
            offset={[0, 0]}
          >
            <BellOutlined
              style={{ fontSize: 20, cursor: "pointer", marginRight: 16 }}
            />
          </Badge>
        </Dropdown>
      )}
      {/* Seller avatar + menu */}
      {loading ? (
        <Skeleton.Avatar active size="large" shape="circle" />
      ) : (
        <Dropdown
          menu={{ items: menuItems, onClick: onMenuClick }}
          placement="bottomRight"
          arrow
        >
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            {seller?.avatar ? (
              <Avatar size="large" src={seller.avatar} />
            ) : (
              <Avatar size="large">
                {getInitial(seller?.store_name || seller?.name || "")}
              </Avatar>
            )}
          </div>
        </Dropdown>
      )}
    </Header>
  );
}
