// components/UserAdmin/UserDetailModal.jsx
import React, { useState } from "react";
import { Modal, Descriptions, Button, Divider } from "antd";
import { User, Mail, Phone, Shield } from "lucide-react";
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

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={isEditing ? t("edit_user") : t("Chi tiết")}
      width={600}
      destroyOnClose
      centered
    >
      {isEditing ? (
        <div>
          {/* Debug log để chắc chắn roles có load */}
          <p style={{ fontSize: 13, color: "gray" }}>
            👉 Đang ở chế độ chỉnh sửa user: <b>{user.username}</b>
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
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item
              label={
                <span>
                  <User size={16} style={{ marginRight: 6 }} />
                  {t("Tên người dùng")}
                </span>
              }
            >
              {user.username}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <Mail size={16} style={{ marginRight: 6 }} />
                  {t("Email")}
                </span>
              }
            >
              {user.email}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <Phone size={16} style={{ marginRight: 6 }} />
                  {t("Số điện thoại")}
                </span>
              }
            >
              {user.phone || t("not_available")}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <Shield size={16} style={{ marginRight: 6 }} />
                  {t("Vai trò")}
                </span>
              }
            >
              {user.role ? user.role.name : t("not_available")}
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
          </Descriptions>

          <Divider style={{ margin: "16px 0" }} />

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
