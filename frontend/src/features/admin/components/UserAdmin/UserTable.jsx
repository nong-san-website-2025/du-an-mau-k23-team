// src/features/admin/components/UserTable.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Table, Dropdown, Button, Modal, message, Tag, Avatar, Space,
  Tooltip, Badge, Menu, Row, Col
} from "antd";
import {
  EllipsisOutlined,
  EyeOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined, MailOutlined, PhoneOutlined, ShoppingOutlined,
  MoreOutlined
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
  const { t } = useTranslation();
  const { confirm } = Modal;

  const norm = (v) =>
    (v ?? "").toString().normalize("NFC").toLowerCase().trim();
  const sameId = (a, b) => String(a ?? "") === String(b ?? "");

  const filteredUsers = useMemo(() => {
    const s = norm(searchTerm);

    return (Array.isArray(users) ? users : [])
      .filter((u) => {
        // Filter by role
        if (selectedRole !== "all") {
          const roleMatch = selectedRole === "customer"
            ? u?.role?.name?.toLowerCase() === "customer"
            : u?.role?.name?.toLowerCase() === "seller";
          if (!roleMatch) return false;
        }

        // Filter by status
        if (statusFilter !== "all") {
          const statusMatch = statusFilter === "active" ? u.is_active : !u.is_active;
          if (!statusMatch) return false;
        }

        // Filter by search term
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
  const handleToggleUser = async (user) => {
    try {
      const res = await axios.patch(
        `http://localhost:8000/api/users/toggle-active/${user.id}/`,
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

  const getActionMenu = (record) => (
    <Menu>
      <Menu.Item key="view" icon={<EyeOutlined />}>
        Xem chi tiết
      </Menu.Item>
      <Menu.Item key="edit" icon={<EditOutlined />}>
        Chỉnh sửa
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="toggle"
        icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
      >
        {record.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
        Xóa tài khoản
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            src={record.avatar}
            style={{
              backgroundColor: record.is_active ? '#1890ff' : '#d9d9d9',
              flexShrink: 0
            }}
          >
            {record.full_name?.charAt(0) || record.username?.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#262626',
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {record.full_name || record.username}
            </div>
            <div style={{
              fontSize: 12,
              color: '#8c8c8c',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              @{record.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <MailOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
            <span style={{ fontSize: 13, color: '#595959' }}>{record.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PhoneOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
            <span style={{ fontSize: 13, color: '#595959' }}>{record.phone || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tag
          color={record.role?.name === 'Seller' ? 'orange' : 'blue'}
          style={{
            fontWeight: 500,
            borderRadius: 6,
            padding: '2px 12px'
          }}
        >
          {record.role?.name}
        </Tag>
      ),
    },
    {
      title: 'Hoạt động',
      key: 'activity',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>
            <ShoppingOutlined style={{ marginRight: 6, color: '#1890ff' }} />
            <span style={{ fontWeight: 500 }}>{record.orders_count || 0}</span> đơn hàng
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.total_spent ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.total_spent) : '0 VND'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div>
          <Badge
            status={record.is_active ? 'success' : 'error'}
            text={
              <span style={{
                fontWeight: 500,
                color: record.is_active ? '#52c41a' : '#ff4d4f'
              }}>
                {record.is_active ? 'Đang hoạt động' : 'Đã khóa'}
              </span>
            }
          />
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
            {record.last_login || 'Chưa đăng nhập'}
          </div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onShowDetail && onShowDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu onClick={(e) => {
                switch(e.key) {
                  case 'view':
                    onShowDetail && onShowDetail(record);
                    break;
                  case 'edit':
                    // Handle edit
                    break;
                  case 'toggle':
                    handleToggleUser(record);
                    break;
                  case 'delete':
                    handleDeleteUser(record);
                    break;
                }
              }}>
                {getActionMenu(record)}
              </Menu>
            }
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
            />
          </Dropdown>
        </Space>
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
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`
        }}
        size="middle"
        scroll={{ x: 1200 }}
        onRow={onRow}
        style={{ background: '#fff' }}
      />

      {showAddModal && (
        <UserAddModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
        />
      )}
    </>
  );
}
