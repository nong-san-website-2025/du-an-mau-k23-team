import React, { useState, useEffect } from "react";
import { Layout, Avatar, Dropdown, Badge, Spin } from "antd";
import { UserOutlined, BellOutlined } from "@ant-design/icons";
import sellerService from "../services/api/sellerService";

const { Header } = Layout;

export default function SellerTopbar() {
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

  // Lấy chữ cái đầu (loại bỏ dấu) và in hoa
  const getInitial = (name) => {
    if (!name) return "?";
    // lấy chữ đầu của từ đầu tiên
    const firstWord = name.trim().split(/\s+/)[0] || name.trim().charAt(0);
    // loại bỏ dấu (normalize -> remove combining diacritics)
    const withoutDiacritics = firstWord
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const ch = withoutDiacritics.charAt(0) || "?";
    return ch.toUpperCase();
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
      {loading ? (
        <Spin size="small" />
      ) : (
        <>
          <Dropdown
            overlay={notificationMenu}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Badge count={notifications.filter((n) => !n.isRead).length}>
              <BellOutlined style={{ fontSize: "20px", cursor: "pointer" }} />
            </Badge>
          </Dropdown>

          <Dropdown
            menu={{
              items: menuItems,
              onClick: onMenuClick,
            }}
            placement="bottomRight"
            arrow
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: "8px",
              }}
            >

              {/* Nếu có avatar thì dùng src, ngược lại hiển thị chữ cái đầu */}
              {seller?.avatar ? (
                <Avatar size="large" src={seller.avatar} />
              ) : (
                <Avatar size="large">
                  {getInitial(seller?.store_name || seller?.name || "")}
                </Avatar>
              )}
            </div>
          </Dropdown>
        </>
      )}
    </Header>
  );
}
