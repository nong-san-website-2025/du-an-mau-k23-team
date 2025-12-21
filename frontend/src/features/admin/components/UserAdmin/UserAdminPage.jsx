import React, { useEffect, useState } from "react";
import { Layout, Card, Row, Col, Input, Select, Button, Space, Statistic } from "antd";
import { SearchOutlined, UserAddOutlined } from "@ant-design/icons";
import UserTable from "./components/UserTable/UserTable";
import UserDetailRow from "./components/UserDetail/UserDetailRow";

export default function UserAdminPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkedIds, setCheckedIds] = useState([]);
  
  // Drawer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  // Lấy API URL từ biến môi trường
  const API_URL = process.env.REACT_APP_API_URL;

  // Lấy CSRF token từ cookie
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  // Lấy JWT token từ localStorage
  const accessToken = localStorage.getItem('token');
  const csrfToken = getCookie('csrftoken');

  // Fetch danh sách vai trò từ backend
  useEffect(() => {
    if (!accessToken) return; // Guard clause nếu chưa có token

    // SỬ DỤNG ENV Ở ĐÂY
    fetch(`${API_URL}/users/roles/list/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRFToken': csrfToken,
      },
    })
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(error => console.error('Error fetching roles:', error));
  }, [accessToken, csrfToken, API_URL]);

  // Fetch danh sách user từ backend
  useEffect(() => {
    if (!accessToken) return;

    // SỬ DỤNG ENV Ở ĐÂY
    fetch(`${API_URL}/users/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRFToken': csrfToken,
      },
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [accessToken, csrfToken, API_URL]);

  // Handle row click to open drawer
  const handleRowClick = (user) => {
    return {
      onClick: () => {
        setSelectedUser(user);
        setDrawerVisible(true);
      },
      style: { cursor: "pointer" },
    };
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedUser(null);
  };

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const sellers = users.filter(u => u.role?.name?.toLowerCase() === "seller").length;
  const customers = users.filter(u => u.role?.name?.toLowerCase() === "customer").length;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Layout.Content style={{ padding: "24px" }}>
        {/* Header Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} md={6}>
            <Card bodyStyle={{ padding: "16px" }}>
              <Statistic
                title="Tổng người dùng"
                value={totalUsers}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bodyStyle={{ padding: "16px" }}>
              <Statistic
                title="Đang hoạt động"
                value={activeUsers}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bodyStyle={{ padding: "16px" }}>
              <Statistic
                title="Người bán"
                value={sellers}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bodyStyle={{ padding: "16px" }}>
              <Statistic
                title="Khách hàng"
                value={customers}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters & Actions */}
        <Card style={{ marginBottom: "24px" }}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <h3 style={{ marginBottom: "12px", color: "#262626" }}>Bộ lọc</h3>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Tìm kiếm theo tên, email, SĐT..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="Lọc theo vai trò"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    style={{ width: "100%" }}
                  >
                    <Select.Option value="all">Tất cả vai trò</Select.Option>
                    <Select.Option value="customer">Khách hàng</Select.Option>
                    <Select.Option value="seller">Người bán</Select.Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="Lọc theo trạng thái"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: "100%" }}
                  >
                    <Select.Option value="all">Tất cả trạng thái</Select.Option>
                    <Select.Option value="active">Đang hoạt động</Select.Option>
                    <Select.Option value="inactive">Bị khóa</Select.Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => setTriggerAddUser(true)}
                    block
                  >
                    Thêm người dùng
                  </Button>
                </Col>
              </Row>
            </div>
          </Space>
        </Card>

        {/* User Table */}
        <Card bodyStyle={{ padding: "16px" }}>
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
            onRow={handleRowClick}
          />
        </Card>
      </Layout.Content>

      {/* User Detail Drawer */}
      <UserDetailRow
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        user={selectedUser}
      />
    </Layout>
  );
}