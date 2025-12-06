// pages/UsersPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Button, Row, Col, Input, Space, Card, Statistic, Select } from "antd";
import { SearchOutlined, FilterOutlined, UserOutlined, ShoppingOutlined, TeamOutlined, PlusOutlined, LockFilled, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { STATUS_LABELS, STATUS } from '../../../constants/statusConstants';
import '../styles/UsersPage.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [triggerAddUser, setTriggerAddUser] = useState(false);
  const { t } = useTranslation();
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate statistics from users data
  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter(user => user.is_active).length;
    const inactive = total - active;
    const locked = users.filter(user => user.status?.toLowerCase() === STATUS.LOCKED.toLowerCase()).length;
    const sellers = users.filter(user => user.role?.name?.toLowerCase() === 'seller').length;

    return { total, active, inactive, locked, sellers };
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/users/list/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/users/roles/list/",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  const handleShowDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Create statistics cards
  const StatisticsSection = () => (
    <div className="users-page-statistics">
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="statistic-card"
          >
            <Statistic
              title="Tổng người dùng"
              value={userStats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="statistic-card"
          >
            <Statistic
              title={STATUS_LABELS.active}
              value={userStats.active}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
              prefix={<CheckCircleOutlined/>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="statistic-card"
          >
            <Statistic
              title="Tạm ngưng hoạt động"
              value={userStats.inactive}
              prefix={<LockOutlined />}
              valueStyle={{ fontSize: 24, color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="statistic-card"
          >
            <Statistic
              title="Người bán"
              value={userStats.sellers}
              prefix={<ShoppingOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Create toolbar with filters and add button
  const toolbar = (
    <Space wrap>
      <Input
        placeholder="Tìm kiếm theo tên, email, số điện thoại..."
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
        style={{ width: 280, borderRadius: 6 }}
      />

      <Select
        placeholder="Vai trò"
        value={selectedRole}
        onChange={setSelectedRole}
        style={{ width: 150, borderRadius: 6 }}
        suffixIcon={<FilterOutlined />}
      >
        <Select.Option value="all">Tất cả vai trò</Select.Option>
        <Select.Option value="customer">Khách hàng</Select.Option>
        <Select.Option value="seller">Người bán</Select.Option>
        <Select.Option value="admin">Quản trị viên</Select.Option>
      </Select>

      <Select
        placeholder="Trạng thái"
        value={statusFilter}
        onChange={setStatusFilter}
        style={{ width: 150, borderRadius: 6 }}
        suffixIcon={<FilterOutlined />}
      >
        <Select.Option value="all">Tất cả</Select.Option>
        <Select.Option value="active">{STATUS_LABELS.active}</Select.Option>
        <Select.Option value="locked">{STATUS_LABELS.locked}</Select.Option>
      </Select>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setTriggerAddUser(true)}
        style={{ borderRadius: 6 }}
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
      {/* Statistics Cards */}
      <StatisticsSection />

      {/* Table */}
      <div className="users-page-content">
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

      {/* Modal chi tiết người dùng */}
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
