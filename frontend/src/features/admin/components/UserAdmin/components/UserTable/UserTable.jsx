// components/UserTable/UserTable.jsx
// Bảng danh sách người dùng - Di chuyển từ UserTable.jsx gốc
import React, { useMemo, useState, useEffect } from "react";
import { Table, Button, Modal, message, Tag } from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import UserAddModal from "../UserForms/UserAddModal";
import { toggleUserStatus, deleteUser } from "../../api/userApi";
import { exportUsersToExcel, exportUsersToPDF } from "../../Utils/exportUtils";

export default function UserTable({
  users = [],
  setUsers,
  loading = false,
  selectedRole = "all",
  statusFilter = "all",
  searchTerm = "",
  roles = [],
  checkedIds = [],
  setCheckedIds,
  onShowDetail,
  triggerAddUser,
  setTriggerAddUser,
  onRow,
}) {
  const { confirm } = Modal;

  const [showAddModal, setShowAddModal] = useState(false);

  const norm = (v) =>
    (v ?? "").toString().normalize("NFC").toLowerCase().trim();

  const filteredUsers = useMemo(() => {
    const s = norm(searchTerm);

    return (Array.isArray(users) ? users : [])
      .filter((u) => {
        if (selectedRole === "all") return true;
        const roleMatch = selectedRole === "customer"
          ? u?.role?.name?.toLowerCase() === "customer"
          : u?.role?.name?.toLowerCase() === "seller";
        return roleMatch;
      })
      .filter((u) => {
        if (statusFilter === "all") return true;
        return statusFilter === "active" ? u.is_active : !u.is_active;
      })
      .filter((u) => {
        const hitSearch =
          s === "" ||
          norm(u.username).includes(s) ||
          norm(u.full_name).includes(s) ||
          norm(u.email).includes(s) ||
          norm(u.phone).includes(s);
        return hitSearch;
      });
  }, [users, searchTerm, selectedRole, statusFilter]);

  const rowSelection = {
    selectedRowKeys: checkedIds,
    onChange: (keys) => setCheckedIds(keys),
    getCheckboxProps: (record) => ({
      disabled: record?.role?.name?.toLowerCase() === "admin",
    }),
  };

  // Trigger thêm user
  useEffect(() => {
    if (triggerAddUser) {
      setShowAddModal(true);
      setTriggerAddUser(false);
    }
  }, [triggerAddUser, setTriggerAddUser]);

  // Toggle user active status
  const handleToggleUser = async (user) => {
    try {
      const result = await toggleUserStatus(user.id, !user.is_active);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: result.is_active } : u
        )
      );
      message.success(result.is_active ? "✅ Đã mở khóa" : "✅ Đã khóa");
    } catch (error) {
      message.error("❌ Thay đổi trạng thái thất bại");
      console.error(error);
    }
  };

  // Delete user
  const handleDeleteUser = (user) => {
    if (!user?.id) return;

    confirm({
      title: `Xóa người dùng "${user.username}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteUser(user.id);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setCheckedIds((prev) => prev.filter((id) => id !== user.id));
          message.success("✅ Xóa thành công!");
        } catch (error) {
          message.error("❌ Xóa thất bại!");
          console.error(error);
        }
      },
    });
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
      title: "Tên người dùng",
      dataIndex: "username",
      key: "username",
      width: 200,
      sorter: (a, b) => (a.username || "").localeCompare(b.username || ""),
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{text || "—"}</div>
          <small style={{ color: "#999" }}>
            {record.full_name || "Chưa có tên"}
          </small>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone) => phone || "Chưa có",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Tag
          color={record.is_active ? "green" : "red"}
          style={{ fontWeight: 600, borderRadius: 8, padding: "4px 10px" }}
        >
          {record.is_active ? "✓ Hoạt động" : "✗ Khóa"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
            danger={!record.is_active}
            type={record.is_active ? "default" : "primary"}
            size="small"
            title={record.is_active ? "Khóa" : "Mở khóa"}
            onClick={() => handleToggleUser(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            type="primary"
            danger
            size="small"
            title="Xóa"
            onClick={() => handleDeleteUser(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Button type="primary" onClick={() => exportUsersToExcel(users)}>
          📊 Xuất Excel
        </Button>
        <Button onClick={() => exportUsersToPDF(users)}>
          📄 Xuất PDF
        </Button>
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
        onRow={onRow}
        rowClassName="table-row"
      />

      {showAddModal && (
        <UserAddModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={(newUser) => {
            setUsers((prev) => [newUser, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}
    </>
  );
}
