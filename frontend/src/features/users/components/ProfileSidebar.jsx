import React from "react";
import { Button, Card } from "react-bootstrap";
import {
  FaUser,
  FaMapMarkerAlt,
  FaLock,
  FaBell,
  FaGift,
  FaStar,
  FaSeedling,
  FaWallet,
} from "react-icons/fa";

// 🎨 Tông màu nông sản – hiện đại và nhất quán
const colors = {
  primary: "#4CAF50",       // Màu xanh lá chủ đạo
  background: "#FAFAF0",     // Nền sáng tự nhiên
  text: "#333",              // Chữ đậm dễ đọc
  white: "#FFFFFF",
  border: "#E0E0E0",
};

const navItems = [
  { key: "profile", label: "Hồ Sơ", icon: <FaUser /> },
  { key: "address", label: "Địa Chỉ", icon: <FaMapMarkerAlt /> },
  { key: "password", label: "Đổi Mật Khẩu", icon: <FaLock /> },
  { key: "notification", label: "Cài Đặt Thông Báo", icon: <FaBell /> },
  { key: "voucher", label: "Kho Voucher", icon: <FaGift /> },
  { key: "point", label: "Điểm Thưởng", icon: <FaStar /> },
  { key: "special", label: "Ưu Đãi Đặc Biệt", icon: <FaSeedling /> },
  { key: "wallet", label: "Ví", icon: <FaWallet /> },
];

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <Card
      className="shadow-sm border-0 p-4"
      style={{
        backgroundColor: colors.background,
        borderRadius: 16,
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: 18,
          marginBottom: 20,
          color: colors.primary,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FaUser size={20} /> Tài khoản của tôi
      </div>

      <div className="d-flex flex-column gap-2">
        {navItems.map(({ key, label, icon }) => {
          const isActive = activeTab === key;

          return (
            <Button
              key={key}
              variant="light"
              onClick={() => setActiveTab(key)}
              className="text-start d-flex align-items-center gap-3"
              style={{
                backgroundColor: isActive ? colors.primary : colors.white,
                color: isActive ? colors.white : colors.text,
                border: `1px solid ${isActive ? colors.primary : colors.border}`,
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 16,
                fontWeight: 500,
                transition: "all 0.25s ease",
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span> {label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default ProfileSidebar;
