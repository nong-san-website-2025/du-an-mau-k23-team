import React, { useState, useEffect } from "react";
import { Layout, Avatar, Dropdown, Badge, Spin } from "antd";
import { UserOutlined, BellOutlined } from "@ant-design/icons";
import sellerService from "../services/api/sellerService"

const { Header } = Layout;

export default function SellerTopbar() {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Có đơn hàng mới", isRead: false },
    { id: 2, message: "Khách hủy đơn #1234", isRead: false },
    { id: 3, message: "Hệ thống bảo trì lúc 23h", isRead: true },
  ]);

  // State lưu thông tin seller
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

  // Menu user
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

  // Dropdown thông báo
  const notificationMenu = (
    <div style={{ width: 250, maxHeight: 300, overflowY: "auto" }}>
      {notifications.length === 0 ? (
        <p style={{ textAlign: "center", margin: 0 }}>Không có thông báo</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            style={{
              padding: "8px",
              backgroundColor: n.isRead ? "#fff" : "#f6f6f6",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            {n.message}
          </div>
        ))
      )}
    </div>
  );

  return (
    <Header
      className="bg-white px-6 shadow-sm"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "20px",
      }}
    >
      {/* Loading state */}
      {loading ? (
        <Spin size="small" />
      ) : (
        <>
          {/* Chuông thông báo */}
          <Dropdown overlay={notificationMenu} trigger={["click"]} placement="bottomRight">
            <Badge count={notifications.filter((n) => !n.isRead).length}>
              <BellOutlined style={{ fontSize: "20px", cursor: "pointer" }} />
            </Badge>
          </Dropdown>

          {/* Avatar user + Tên seller */}
          <Dropdown
            menu={{
              items: menuItems,
              onClick: onMenuClick,
            }}
            placement="bottomRight"
            arrow
          >
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "8px" }}>
              <Avatar
                size="large"
                src={seller?.avatar || null}
                icon={!seller?.avatar && <UserOutlined />}
              />
              <span style={{ fontWeight: "500" }}>{seller?.store_name || "Người bán"}</span>
            </div>
          </Dropdown>
        </>
      )}
    </Header>
  );
}
