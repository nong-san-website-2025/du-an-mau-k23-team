import React, { useMemo, useState, useEffect } from "react";
import { Table, Modal, message, Tag, Avatar, Drawer, Spin, Space } from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Import các component con
import UserAddModal from "./UserAddModal";
import ButtonAction from "../../../../components/ButtonAction";
import StatusTag from "../../../../components/StatusTag";

// Import Form Sửa
import UserEditForm from "../../components/UserAdmin/components/UserForms/UserEditForm";
import { fetchRoles } from "./api/userApi";

export default function UserTable({
  users = [],
  setUsers,
  loading = false,
  selectedRole = "all",
  statusFilter = "all",
  searchTerm = "",
  checkedIds = [],
  setCheckedIds,
  triggerAddUser,
  setTriggerAddUser,
  onRow,
}) {
  const { t } = useTranslation();
  const { confirm } = Modal;
  const [isMobile, setIsMobile] = useState(false);

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE QUẢN LÝ ---
  const [editingUser, setEditingUser] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Preload roles & Detect mobile
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setRolesLoading(true);
      try {
        const data = await fetchRoles();
        if (mounted) setRoles(data || []);
      } catch (err) {
        console.error("Lỗi preload roles:", err);
      } finally {
        if (mounted) setRolesLoading(false);
      }
    };
    load();

    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
      mounted = false;
    };
  }, []);

  // --- LOGIC REALTIME SEARCH & FILTER ---
  // Sử dụng useMemo để bảng không bị khựng khi WebSocket đẩy dữ liệu liên tục
  const filteredUsers = useMemo(() => {
    const s = searchTerm.normalize("NFC").toLowerCase().trim();
    return (Array.isArray(users) ? users : []).filter((u) => {
      // Lọc theo vai trò
      if (selectedRole !== "all") {
        const roleName = u?.role?.name?.toLowerCase();
        if (roleName !== selectedRole) return false;
      }
      // Lọc theo trạng thái
      if (statusFilter !== "all") {
        const statusMatch =
          statusFilter === "active" ? u.is_active : !u.is_active;
        if (!statusMatch) return false;
      }
      // Tìm kiếm đa năng
      return (
        s === "" ||
        [u.username, u.full_name, u.email, u.phone].some((field) =>
          (field ?? "").toString().toLowerCase().includes(s)
        )
      );
    });
  }, [users, searchTerm, selectedRole, statusFilter]);

  const rowSelection = {
    selectedRowKeys: checkedIds,
    onChange: (keys) => setCheckedIds(keys),
    getCheckboxProps: (record) => ({
      disabled: record?.role?.name?.toLowerCase() === "admin",
    }),
  };

  // --- HANDLERS (Tối ưu để đồng bộ với Realtime) ---

  const handleEditClick = async (record) => {
    setIsFetchingDetail(true);
    try {
      const response = await axios.get(
        `${API_URL}/users/management/${record.id}/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setEditingUser(response.data);
    } catch (error) {
      setEditingUser(record);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleEditSave = (updatedUser) => {
    // Cập nhật State cục bộ - đồng bộ với tin nhắn UPDATED từ Redis
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    setEditingUser(null);
    message.success("Cập nhật thành công");
  };

  const handleToggleUser = async (user) => {
    try {
      const res = await axios.patch(
        `${API_URL}/users/toggle-active/${user.id}/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      // Cập nhật State ngay lập tức (Optimistic Update)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: res.data.is_active } : u
        )
      );
      message.success(res.data.is_active ? "Đã mở khóa" : "Đã khóa tài khoản");
    } catch (err) {
      message.error("Lỗi thao tác");
    }
  };

  const handleDeleteUser = (user) => {
    confirm({
      title: `Xóa người dùng "${user.username}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/users/management/${user.id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          // Xóa khỏi State cục bộ - đồng bộ với tin nhắn DELETED từ Redis
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setCheckedIds((prev) => prev.filter((id) => id !== user.id));
          message.success("Xóa thành công");
        } catch (err) {
          message.error("Không thể xóa người dùng");
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
    // Thêm vào State cục bộ - đồng bộ với tin nhắn CREATED từ Redis
    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
  };

  // --- CẤU HÌNH ACTIONS ---
  const getActions = (record) => [
    {
      show: true,
      actionType: "edit",
      icon: isFetchingDetail ? <LoadingOutlined /> : <EditOutlined />,
      tooltip: "Chỉnh sửa",
      onClick: () => handleEditClick(record),
    },
    {
      show: true,
      actionType: "lock",
      icon: record.is_active ? <LockOutlined /> : <UnlockOutlined />,
      tooltip: record.is_active ? "Khóa" : "Mở khóa",
      onClick: () => handleToggleUser(record),
    },
    {
      show: true,
      actionType: "delete",
      icon: <DeleteOutlined />,
      tooltip: record?.role?.name === "admin" ? "Không thể xóa Admin" : "Xóa",
      onClick: () => handleDeleteUser(record),
      buttonProps: { danger: true, disabled: record?.role?.name === "admin" },
    },
  ];

  const columns = [
    {
      title: "Người dùng",
      key: "user",
      width: 240,
      fixed: isMobile ? undefined : "left",
      sorter: (a, b) => (a.full_name || "").localeCompare(b.full_name || ""),
      render: (_, record) => (
        <Space size={10}>
          <Avatar src={record.avatar} size={40}>
            {record.full_name?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.full_name || "N/A"}</div>
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              @{record.username}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      width: 220,
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div>
            <MailOutlined style={{ color: "#1890ff", marginRight: 5 }} />
            {record.email}
          </div>
          <div>
            <PhoneOutlined style={{ color: "#52c41a", marginRight: 5 }} />
            {record.phone || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      key: "role",
      width: 120,
      align: "center",
      render: (_, record) => {
        const role = record.role?.name?.toLowerCase();
        const color =
          role === "admin" ? "red" : role === "seller" ? "orange" : "blue";
        return (
          <Tag color={color} style={{ borderRadius: 4 }}>
            {record.role?.name}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center",
      render: (_, record) => (
        <StatusTag status={record.is_active ? "active" : "locked"} />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      fixed: isMobile ? undefined : "right",
      align: "center",
      render: (_, record) => (
        <ButtonAction actions={getActions(record)} record={record} />
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
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} người dùng` }}
        scroll={{ x: 1100 }}
        bordered
        onRow={onRow}
      />

      <UserAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      <Drawer
        title={`Chỉnh sửa: ${editingUser?.username}`}
        placement="right"
        width={isMobile ? "100%" : 550}
        onClose={() => setEditingUser(null)}
        open={!!editingUser}
        destroyOnClose
      >
        {isFetchingDetail ? (
          <Spin />
        ) : (
          <UserEditForm
            editUser={editingUser}
            roles={roles}
            onCancel={() => setEditingUser(null)}
            onSave={handleEditSave}
          />
        )}
      </Drawer>
    </>
  );
}
