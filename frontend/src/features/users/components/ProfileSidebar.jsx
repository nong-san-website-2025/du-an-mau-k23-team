import React from "react";
import { Button, Card } from "react-bootstrap";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLock,
  FaBell,
  FaGift,
  FaStar,
  FaSeedling,
  FaWallet,
} from "react-icons/fa";

const mainColor = "#2E8B57";
const accentColor = "#F57C00";
const sidebarBg = "#fff";
const sidebarActive = mainColor;
const sidebarInactive = "#eee";
const iconColor = mainColor;

const ProfileSidebar = ({ activeTab, setActiveTab }) => (
  <Card className="shadow border-0 p-3 mb-4" style={{ background: sidebarBg }}>
    <div
      style={{
        fontWeight: 700,
        fontSize: 18,
        marginBottom: 18,
        color: mainColor,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <FaUser color={iconColor} size={22} style={{ marginRight: 4 }} /> Tài khoản của tôi
    </div>
    <div style={{ marginBottom: 18 }}>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "profile" ? sidebarActive : sidebarInactive,
          color: activeTab === "profile" ? "#fff" : mainColor,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("profile")}
      >
        <FaUser style={{ marginRight: 6 }} /> Hồ Sơ
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "address" ? sidebarActive : sidebarInactive,
          color: activeTab === "address" ? "#fff" : mainColor,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("address")}
      >
        <FaMapMarkerAlt style={{ marginRight: 6 }} /> Địa Chỉ
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "password" ? sidebarActive : sidebarInactive,
          color: activeTab === "password" ? "#fff" : mainColor,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("password")}
      >
        <FaLock style={{ marginRight: 6 }} /> Đổi Mật Khẩu
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "notification" ? sidebarActive : sidebarInactive,
          color: activeTab === "notification" ? "#fff" : mainColor,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("notification")}
      >
        <FaBell style={{ marginRight: 6 }} /> Cài Đặt Thông Báo
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "voucher" ? accentColor : sidebarInactive,
          color: activeTab === "voucher" ? "#fff" : accentColor,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("voucher")}
      >
        <FaGift style={{ marginRight: 6 }} /> Kho Voucher
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "point" ? "#FFD700" : sidebarInactive,
          color: activeTab === "point" ? "#fff" : "#FFD700",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("point")}
      >
        <FaStar style={{ marginRight: 6 }} /> Điểm Thưởng
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "special" ? "#D32F2F" : sidebarInactive,
          color: activeTab === "special" ? "#fff" : "#D32F2F",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("special")}
      >
        <FaSeedling style={{ marginRight: 6 }} /> Ưu Đãi Đặc Biệt
      </Button>
      <Button
        className="w-100 mb-2"
        style={{
          fontWeight: 700,
          borderRadius: 8,
          background: activeTab === "wallet" ? "#4B0082" : sidebarInactive,
          color: activeTab === "wallet" ? "#fff" : "#4B0082",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onClick={() => setActiveTab("wallet")}
      >
        <FaWallet style={{ marginRight: 6 }} /> Ví
      </Button>
    </div>
  </Card>
);

export default ProfileSidebar;
