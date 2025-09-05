// components/UserAdmin/UserSidebar.jsx
import React, { useState } from "react";
import { Button, Select, Modal, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export default function UserSidebar({
  roles,
  selectedRole,
  setSelectedRole,
  onRoleCreated,
}) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      Modal.warning({ content: t("user_sidebar.please_enter_role_name") });
      return;
    }

    try {
      setLoading(true);
      const roleData = { name: newRoleName.trim() };
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8000/api/users/roles/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      Modal.success({ content: t("user_sidebar.create_role_success") });

      if (onRoleCreated) onRoleCreated();

      setNewRoleName("");
      setShowModal(false);
    } catch (error) {
      console.error("Error creating role:", error);
      Modal.error({
        content: t("user_sidebar.create_role_error", { error: error.message }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      {/* Filter by role */}
      <div className="d-flex align-items-center gap-2">
        <span className="fw-bold">{t("user_sidebar.role")}:</span>
        <Select
          value={selectedRole}
          style={{ width: 200 }}
          onChange={(value) => setSelectedRole(value)}
        >
          <Select.Option value="all">
            {t("user_sidebar.all_roles")}
          </Select.Option>
          {roles.map((role) => (
            <Select.Option key={role.id} value={String(role.id)}>
              {role.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Create role button */}
      

      {/* Modal create role */}
      <Modal
        open={showModal}
        title={t("user_sidebar.create_new_role")}
        onCancel={() => setShowModal(false)}
        onOk={handleCreateRole}
        confirmLoading={loading}
        okText={t("user_sidebar.create")}
        cancelText={t("user_sidebar.cancel")}
      >
        <Input
          placeholder={t("user_sidebar.role_name")}
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
        />
      </Modal>
    </div>
  );
}
