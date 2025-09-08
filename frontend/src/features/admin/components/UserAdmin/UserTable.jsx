// src/features/admin/components/UserTable.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Table, Dropdown, Button, Modal, message } from "antd";
import {
  EllipsisOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import axios from "axios";
import UserAddModal from "./UserAddModal";
import { useTranslation } from "react-i18next";

import { ExclamationCircleOutlined } from "@ant-design/icons";

export default function UserTable({
  users = [],
  setUsers,
  loading = false,
  selectedRole = "all",
  searchTerm = "",
  roles = [],
  checkedIds = [],
  setCheckedIds,
  onShowDetail,
  triggerAddUser,
  setTriggerAddUser,
}) {
  const { t } = useTranslation();
  const { confirm } = Modal;

  const norm = (v) =>
    (v ?? "").toString().normalize("NFC").toLowerCase().trim();
  const sameId = (a, b) => String(a ?? "") === String(b ?? "");

  const filteredUsers = useMemo(() => {
    const s = norm(searchTerm);
    const roleKey =
      selectedRole === "all" || selectedRole === ""
        ? null
        : String(selectedRole);

    return (Array.isArray(users) ? users : [])
      .filter((u) => u?.role?.name?.toLowerCase() !== "admin")
      .filter((u) => {
        const hitSearch =
          s === "" ||
          norm(u.username).includes(s) ||
          norm(u.full_name).includes(s) ||
          norm(u.email).includes(s) ||
          norm(u.phone).includes(s);

        const hitRole = !roleKey || sameId(roleKey, u?.role?.id);
        return hitSearch && hitRole;
      });
  }, [users, searchTerm, selectedRole]);

  const rowSelection = {
    selectedRowKeys: checkedIds,
    onChange: (keys) => setCheckedIds(keys),
    getCheckboxProps: (record) => ({
      disabled: record?.role?.name?.toLowerCase() === "admin",
    }),
  };

  const handleDeleteUser = (user) => {
    if (!user?.id) return;

    confirm({
      title: `Bạn có chắc chắn muốn xóa người dùng "${user.username}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:8000/api/users/${user.id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          // Cập nhật danh sách users
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setCheckedIds((prev) => prev.filter((id) => id !== user.id));

          message.success("Xóa người dùng thành công!");
        } catch (err) {
          console.error(err);
          message.error("Xóa người dùng thất bại!");
        }
      },
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
    if (triggerAddUser) {
      setShowAddModal(true);
      setTriggerAddUser(false);
    }
  }, [triggerAddUser, setTriggerAddUser]);

  const handleUserAdded = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    {
      title: t("users_page.table.username"),
      dataIndex: "username",
      key: "username",
      width: 200,
      sorter: (a, b) => (a.username || "").localeCompare(b.username || ""),
      render: (text, record) => (
        <div>
          <div className="fw-bold">{text || "—"}</div>
          <small className="text-muted">
            {record.full_name || t("no_name")}
          </small>
        </div>
      ),
    },
    {
      title: t("users_page.table.role"),
      key: "role",
      dataIndex: ["role", "name"],
      width: 120,
      align: "center",
      sorter: (a, b) => (a.role?.name || "").localeCompare(b.role?.name || ""),
      render: (role) => {
        const roleName = role?.toLowerCase();
        if (roleName === "seller")
          return <span className="badge bg-success">{t("seller")}</span>;
        if (roleName === "support")
          return <span className="badge bg-warning">{t("support")}</span>;
        return <span className="badge bg-secondary">{role || t("user")}</span>;
      },
    },
    {
      title: t("users_page.table.email"),
      dataIndex: "email",
      key: "email",
      width: 200,
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: t("users_page.table.phone"),
      dataIndex: "phone",
      key: "phone",
      width: 140,
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      render: (phone) => phone || t("no_phone"),
    },
    {
      title: t("users_page.table.actions"),
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "detail",
                label: (
                  <span>
                    <EyeOutlined className="me-2" />
                    {t("Detail")}
                  </span>
                ),
                onClick: () => onShowDetail?.(record),
              },
              {
                key: "delete",
                label: (
                  <span style={{ color: "black" }}>
                    <DeleteOutlined className="me-2" />
                    {t("Delete")}
                  </span>
                ),
                onClick: () => handleDeleteUser(record),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        bordered
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 1000 }}
      />

      {showAddModal && (
        <UserAddModal
          visible={showAddModal} // chỉ cần 1 state
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
        />
      )}
    </>
  );
}
