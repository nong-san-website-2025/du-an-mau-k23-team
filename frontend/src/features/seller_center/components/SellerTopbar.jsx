import React from "react";
import { Layout, Avatar, Dropdown } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Header } = Layout;

export default function SellerTopbar() {
  const menuItems = [
    { key: "profile", label: "Hồ sơ" },
    { key: "logout", label: "Đăng xuất" },
  ];

  const onMenuClick = ({ key }) => {
    if (key === "logout") {
      // Xử lý logout
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  return (
    <Header className="bg-white flex justify-end items-center px-4 shadow-sm">
      <Dropdown menu={{ items: menuItems, onClick: onMenuClick }}>
        <Avatar size="large" icon={<UserOutlined />} className="cursor-pointer" />
      </Dropdown>
    </Header>
  );
}
