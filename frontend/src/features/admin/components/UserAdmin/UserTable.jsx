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
import { exportUsersToExcel, exportUsersToPDF } from "./Utils/exportUtils";

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
  const handleToggleUser = async (user) => {
    console.log("Trạng thái hiện tại:", user.is_active);
    try {
      const res = await axios.patch(
        `http://localhost:8000/api/users/${user.id}/toggle-active/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("Trạng thái sau khi toggle:", res.data.is_active);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: res.data.is_active } : u
        )
      );

      message.success(
        res.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"
      );
    } catch (err) {
      console.error(err);
      message.error("Không thể thay đổi trạng thái user");
    }
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
      title: t("Tên người dùng"),
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
      title: t("Vai trò"),
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
      title: t("Email"),
      dataIndex: "email",
      key: "email",
      width: 200,
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: t("Số điện thoại"),
      dataIndex: "phone",
      key: "phone",
      width: 140,
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      render: (phone) => phone || t("no_phone"),
    },

    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center",
      render: (_, record) => (
        <span
          className={`badge ${record.is_active ? "bg-success" : "bg-danger"}`}
        >
          {record.is_active ? "Đang hoạt động" : "Đang khóa"}
        </span>
      ),
    },
    {
      title: t("Hành động / Chi tiết"),
      key: "actions_detail",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "toggle",
                label: (
                  <span
                    style={{
                      color: record.is_active ? "orange" : "green",
                      fontWeight: 500,
                    }}
                  >
                    {record.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                  </span>
                ),
                onClick: () => handleToggleUser(record),
              },
              {
                key: "delete",
                label: (
                  <span
                    style={{
                      color: record.can_delete ? "red" : "gray",
                      cursor: record.can_delete ? "pointer" : "not-allowed",
                      opacity: record.can_delete ? 1 : 0.5,
                    }}
                  >
                    <DeleteOutlined className="me-2" />
                    {t("Delete")}
                  </span>
                ),
                disabled: !record.can_delete,
                onClick: () => record.can_delete && handleDeleteUser(record),
              },
              {
                key: "detail",
                label: (
                  <span
                    style={{
                      color: "blue",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    onClick={() => onShowDetail(record)}
                  >
                    <EyeOutlined className="me-2" />
                    {t("Chi tiết")}
                  </span>
                ),
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
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Button type="primary" onClick={() => exportUsersToExcel(users)}>
          Xuất Excel
        </Button>
        <Button onClick={() => exportUsersToPDF(users)}>Xuất PDF</Button>
      </div>
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
