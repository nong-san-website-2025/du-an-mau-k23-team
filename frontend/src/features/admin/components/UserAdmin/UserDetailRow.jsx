// components/UserAdmin/UserDetailModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Divider,
  Tag,
  Avatar,
  Tooltip,
} from "antd";
import { User, Mail, Phone, Shield, Home, Star, Calendar } from "lucide-react";
import UserEditForm from "./UserEditForm";
import { useTranslation } from "react-i18next";

export default function UserDetailModal({
  user,
  visible,
  onClose,
  onUserUpdated,
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const avatarUrl =
    user?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "U"}`;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={isEditing ? t("edit_user") : t("Chi tiết người dùng")}
      width={1000}
      destroyOnClose
      centered
    >
      {isEditing ? (
        <div>
          <p style={{ fontSize: 13, color: "gray" }}>
            👉 {t("Đang chỉnh sửa tài khoản")} <b>{user.username}</b>
          </p>
          <UserEditForm
            editUser={user}
            onCancel={() => setIsEditing(false)}
            onSave={(updatedUser) => {
              setIsEditing(false);
              if (onUserUpdated) onUserUpdated(updatedUser);
            }}
          />
        </div>
      ) : (
        <>
          {/* --- Bố cục 2 cột: thông tin bên trái, avatar bên phải --- */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            {/* --- Cột trái: Thông tin chi tiết --- */}
            <div style={{ flex: 1 }}>
              <Descriptions
                column={1}
                bordered
                size="middle"
                labelStyle={{ width: "200px" }}
              >
                <Descriptions.Item
                  label={
                    <span>
                      <User size={16} style={{ marginRight: 6 }} />
                      {t("Tài khoản")}
                    </span>
                  }
                >
                  {user.username || t("Chưa có")}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <Mail size={16} style={{ marginRight: 6 }} />
                      {t("Email")}
                    </span>
                  }
                >
                  {user.email_masked}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <Phone size={16} style={{ marginRight: 6 }} />
                      {t("Số điện thoại")}
                    </span>
                  }
                >
                  {user.phone_masked || t("Không có")}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <Home size={16} style={{ marginRight: 6 }} />
                      {t("Địa chỉ mặc định")}
                    </span>
                  }
                >
                  {user.default_address || t("Chưa có địa chỉ")}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <Star
                        size={16}
                        style={{ marginRight: 6, color: "#f59e0b" }}
                      />
                      {t("Điểm thưởng")}
                    </span>
                  }
                >
                  <Tooltip
                    title={t(
                      "Điểm tích lũy có thể dùng để đổi quà hoặc giảm giá"
                    )}
                  >
                    <b style={{ color: "#f59e0b" }}>{user.points ?? 0}</b>
                  </Tooltip>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <Shield size={16} style={{ marginRight: 6 }} />
                      {t("Trạng thái")}
                    </span>
                  }
                >
                  {user.is_active ? t("Đang hoạt động") : t("Đã bị khóa")}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span>
                      <Calendar size={16} style={{ marginRight: 6 }} />
                      {t("Ngày tạo tài khoản")}
                    </span>
                  }
                >
                  {new Date(user.created_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* --- Cột phải: Avatar và tag --- */}
            <div
              style={{
                width: 220,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #f0f0f0",
                borderRadius: 12,
                padding: 16,
                backgroundColor: "#fafafa",
              }}
            >
              <Avatar
                src={avatarUrl}
                size={100}
                style={{
                  border: "2px solid #e5e7eb",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              />
              <h3 style={{ marginTop: 12, marginBottom: 4 }}>
                {user.full_name}
              </h3>
              <Tag
                color={user.is_active ? "green" : "red"}
                style={{ marginBottom: 6 }}
              >
                {user.is_active ? t("Đang hoạt động") : t("Đã bị khóa")}
              </Tag>
              {user.role?.name && (
                <Tag color="blue">
                  {t("Vai trò")}: {user.role.name}
                </Tag>
              )}
            </div>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          {/* --- Nút hành động --- */}
          <div style={{ textAlign: "right" }}>
            <Button
              type="primary"
              style={{ marginRight: 8 }}
              onClick={() => setIsEditing(true)}
            >
              {t("Sửa")}
            </Button>
            <Button onClick={onClose}>{t("Đóng")}</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
