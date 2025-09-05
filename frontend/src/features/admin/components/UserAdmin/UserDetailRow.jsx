// components/UserAdmin/UserDetailModal.jsx
import React, { useState } from "react";
import { Modal, Descriptions, Button, Divider } from "antd";
import { User, Mail, Phone, Shield, Activity } from "lucide-react";
import UserEditForm from "./UserEditForm";
import { useTranslation } from "react-i18next";

export default function UserDetailModal({ user, visible, onClose, onUserUpdated }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={isEditing ? t("edit_user") : t("user_info")}
      width={600}
      destroyOnClose
      centered
    >
      {isEditing ? (
        <UserEditForm
          editUser={user}
          onCancel={() => setIsEditing(false)}
          onSave={(updatedUser) => {
            setIsEditing(false);
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
        />
      ) : (
        <>
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item
              label={
                <span>
                  <User size={16} style={{ marginRight: 6 }} />
                  {t("users_page.table.username")}
                </span>
              }
            >
              {user.username}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <User size={16} style={{ marginRight: 6 }} />
                  {t("users_page.table.fullname")}
                </span>
              }
            >
              {user.full_name || t("not_available")}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <Mail size={16} style={{ marginRight: 6 }} />
                  {t("users_page.table.email")}
                </span>
              }
            >
              {user.email}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <Phone size={16} style={{ marginRight: 6 }} />
                  {t("users_page.table.phone")}
                </span>
              }
            >
              {user.phone || t("not_available")}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <Shield size={16} style={{ marginRight: 6 }} />
                  {t("users_page.table.role")}
                </span>
              }
            >
              {user.role ? user.role.name : t("not_available")}
            </Descriptions.Item>

            {/* Nếu muốn hiển thị status */}
            {/* <Descriptions.Item
              label={
                <span>
                  <Activity size={16} style={{ marginRight: 6 }} />
                  {t("users_page.table.status")}
                </span>
              }
            >
              {user.status === "active"
                ? t("active")
                : user.status === "inactive"
                ? t("inactive")
                : t("not_available")}
            </Descriptions.Item> */}
          </Descriptions>

          <Divider style={{ margin: "16px 0" }} />

          <div style={{ textAlign: "right" }}>
            <Button
              type="primary"
              style={{ marginRight: 8 }}
              onClick={() => setIsEditing(true)}
            >
              {t("edit")}
            </Button>
            <Button onClick={onClose}>{t("close")}</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
