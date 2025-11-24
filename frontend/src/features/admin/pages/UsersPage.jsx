// pages/UsersPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import UserSideBar from "../components/UserAdmin/UserSidebar";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  Button, Row, Col, Input, Space, Card, Statistic, Select
} from "antd";
import {
  SearchOutlined, FilterOutlined, UserOutlined, ShoppingOutlined, TeamOutlined
} from '@ant-design/icons';

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
    const customers = users.filter(user => user.role?.name?.toLowerCase() === 'customer').length;
    const sellers = users.filter(user => user.role?.name?.toLowerCase() === 'seller').length;

    return { total, active, inactive, customers, sellers };
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/users/list/", {
        // ✅ Thêm /list/
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

  return (
    <div style={{
      padding: 24,
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          margin: 0,
          color: '#262626'
        }}>
          {t("QUẢN LÝ NGƯỜI DÙNG")}
        </h1>
        <p style={{
          color: '#8c8c8c',
          margin: '4px 0 0 0',
          fontSize: 14
        }}>
          Quản lý tài khoản khách hàng và người bán
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
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
            style={{
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Statistic
              title="Đang hoạt động"
              value={userStats.active}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
              suffix={
                <span style={{ fontSize: 14, color: '#8c8c8c' }}>
                  /{userStats.total}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Statistic
              title="Khách hàng"
              value={userStats.customers}
              prefix={<UserOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
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

      {/* Main Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}
      >
        {/* Toolbar */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={24} md={10} lg={8}>
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                size="large"
                style={{ borderRadius: 6 }}
              />
            </Col>

            <Col xs={12} sm={8} md={4} lg={3}>
              <Select
                placeholder="Vai trò"
                value={selectedRole}
                onChange={setSelectedRole}
                size="large"
                style={{ width: '100%', borderRadius: 6 }}
                suffixIcon={<FilterOutlined />}
              >
                <Select.Option value="all">Tất cả vai trò</Select.Option>
                <Select.Option value="customer">Khách hàng</Select.Option>
                <Select.Option value="seller">Người bán</Select.Option>
              </Select>
            </Col>

            <Col xs={12} sm={8} md={4} lg={3}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                size="large"
                style={{ width: '100%', borderRadius: 6 }}
                suffixIcon={<FilterOutlined />}
              >
                <Select.Option value="all">Tất cả</Select.Option>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Đã khóa</Select.Option>
              </Select>
            </Col>

            <Col xs={24} sm={8} md={6} lg={10} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => setTriggerAddUser(true)}
                size="large"
                style={{ borderRadius: 6 }}
              >
                + {t("Thêm người dùng")}
              </Button>
            </Col>
          </Row>
        </div>

        {/* Bảng danh sách người dùng */}
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
      </Card>

      {/* Modal chi tiết người dùng */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}
