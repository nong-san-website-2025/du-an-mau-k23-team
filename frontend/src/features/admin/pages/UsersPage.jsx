// pages/UsersPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Button, Input, Space, Select, message } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  PlusOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import axios from "axios";
import { useTranslation } from "react-i18next";

// Components
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import StatsSection from "../components/common/StatsSection"; // Component tái sử dụng mới

// Constants & Styles
import { STATUS_LABELS, STATUS } from '../../../constants/statusConstants';
import '../styles/UsersPage.css';

const { Option } = Select;

export default function UsersPage() {
  // --- 1. State Management ---
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection & Modal States
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  const { t } = useTranslation();

  // --- 2. Data Fetching ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/users/list/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      message.error("Không thể tải danh sách người dùng");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users/roles/list/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // --- 3. Computed Statistics (Logic tính toán) ---
  const statItems = useMemo(() => {
    const total = users.length;
    const active = users.filter(user => user.is_active).length;
    const inactive = total - active;
    const sellers = users.filter(user => user.role?.name?.toLowerCase() === 'seller').length;

    // Cấu hình hiển thị cho StatsSection
    return [
      {
        title: "Tổng người dùng",
        value: total,
        icon: <TeamOutlined />,
        color: "#1890ff", // Blue
      },
      {
        title: STATUS_LABELS.active,
        value: active,
        icon: <CheckCircleOutlined />,
        color: "#52c41a", // Green
      },
      {
        title: "Tạm ngưng hoạt động",
        value: inactive,
        icon: <LockOutlined />,
        color: "#faad14", // Orange/Yellow
      },
      {
        title: "Đối tác người bán",
        value: sellers,
        icon: <ShoppingOutlined />,
        color: "#722ed1", // Purple
      }
    ];
  }, [users]);

  // --- 4. Event Handlers ---
  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  const handleShowDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // --- 5. Render Components ---

  // Toolbar Component (Thanh tìm kiếm và bộ lọc)
  const toolbar = (
    <Space wrap>
      <Input
        placeholder="Tìm kiếm tên, email, sđt..."
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
        style={{ width: 260, borderRadius: 6 }}
      />

      <Select
        placeholder="Vai trò"
        value={selectedRole}
        onChange={setSelectedRole}
        style={{ width: 140, borderRadius: 6 }}
        suffixIcon={<FilterOutlined />}
      >
        <Option value="all">Tất cả vai trò</Option>
        <Option value="customer">Khách hàng</Option>
        <Option value="seller">Người bán</Option>
        <Option value="admin">Quản trị viên</Option>
      </Select>

      <Select
        placeholder="Trạng thái"
        value={statusFilter}
        onChange={setStatusFilter}
        style={{ width: 140, borderRadius: 6 }}
        suffixIcon={<FilterOutlined />}
      >
        <Option value="all">Tất cả trạng thái</Option>
        <Option value="active">{STATUS_LABELS.active}</Option>
        <Option value="locked">{STATUS_LABELS.locked}</Option>
      </Select>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setTriggerAddUser(true)}
        style={{ borderRadius: 6, fontWeight: 500 }}
      >
        {t("Thêm người dùng")}
      </Button>
    </Space>
  );

  return (
    <AdminPageLayout
      title="QUẢN LÝ NGƯỜI DÙNG"
      extra={toolbar}
    >
      {/* Phần thống kê chuyên nghiệp (Tái sử dụng) */}
      <StatsSection items={statItems} loading={loading} />

      {/* Bảng danh sách người dùng */}
      <div className="users-page-content" style={{ marginTop: 24 }}>
        <UserTable
          users={users}
          setUsers={setUsers}
          loading={loading}
          selectedRole={selectedRole}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          roles={roles}
          checkedIds={checkedIds}
          setCheckedIds={setCheckedIds}
          triggerAddUser={triggerAddUser}
          setTriggerAddUser={setTriggerAddUser}
          onShowDetail={handleShowDetail}
          onRow={(record) => ({
            onClick: () => handleShowDetail(record),
          })}
        />
      </div>

      {/* Modal chi tiết */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </AdminPageLayout>
  );
}