import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Statistic,
  message,
} from "antd";
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

  // Drawer & Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  // Refs & Constants
  const API_URL = process.env.REACT_APP_API_URL;
  const accessToken = localStorage.getItem("token");
  const socketRef = useRef(null);

  // --- 1. HÀM FETCH DỮ LIỆU BAN ĐẦU ---
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [roleRes, userRes] = await Promise.all([
        fetch(`${API_URL}/users/roles/list/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${API_URL}/users/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const rolesData = await roleRes.json();
      const usersData = await userRes.json();

      setRoles(rolesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      message.error("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }, [API_URL, accessToken]);

  // --- 2. LOGIC REAL-TIME VỚI WEBSOCKET & REDIS ---
  useEffect(() => {
    if (!accessToken) return;

    // Fetch dữ liệu lần đầu
    fetchData();

    // Khởi tạo kết nối WebSocket (Đảm bảo Backend đã cấu hình Redis Channel Layer)
    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    // Ví dụ URL: ws://192.168.1.35:8000/ws/users/
    const wsUrl = `${API_URL.replace(/^http/, "ws")}/users/realtime/?token=${accessToken}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      const { action, data } = response; // action: 'CREATED', 'UPDATED', 'DELETED'

      console.log(`🔔 Real-time Update [${action}]:`, data);

      setUsers((prevUsers) => {
        switch (action) {
          case "CREATED":
            // Kiểm tra tránh trùng lặp nếu chính mình vừa thêm
            if (prevUsers.find((u) => u.id === data.id)) return prevUsers;
            return [data, ...prevUsers];

          case "UPDATED":
            return prevUsers.map((u) =>
              u.id === data.id ? { ...u, ...data } : u
            );

          case "DELETED":
            return prevUsers.filter((u) => u.id !== data.id);

          default:
            return prevUsers;
        }
      });

      // Thông báo nhỏ cho Admin
      if (action === "CREATED")
        message.success(`Người dùng ${data.username} vừa tham gia`);
    };

    socketRef.current.onclose = () => {
      console.warn("WebSocket disconnected. Reconnecting in 5s...");
      setTimeout(fetchData, 5000); // Thử kết nối lại hoặc refresh data
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [API_URL, accessToken, fetchData]);

  // --- 3. EVENT HANDLERS ---
  const handleRowClick = (user) => ({
    onClick: () => {
      setSelectedUser(user);
      setDrawerVisible(true);
    },
    style: { cursor: "pointer" },
  });

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedUser(null);
  };

  // Tính toán thống kê (Sử dụng useMemo nếu list user cực lớn)
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    sellers: users.filter((u) => u.role?.name?.toLowerCase() === "seller")
      .length,
    customers: users.filter((u) => u.role?.name?.toLowerCase() === "customer")
      .length,
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Layout.Content style={{ padding: "24px" }}>
        {/* Statistics Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          {[
            { title: "Tổng người dùng", val: stats.total, color: "#1890ff" },
            { title: "Đang hoạt động", val: stats.active, color: "#52c41a" },
            { title: "Người bán", val: stats.sellers, color: "#fa8c16" },
            { title: "Khách hàng", val: stats.customers, color: "#722ed1" },
          ].map((item, idx) => (
            <Col xs={24} sm={12} md={6} key={idx}>
              <Card bordered={false} hoverable>
                <Statistic
                  title={item.title}
                  value={item.val}
                  valueStyle={{ color: item.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filter Toolbar */}
        <Card bordered={false} style={{ marginBottom: "24px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Input
                placeholder="Tìm kiếm theo tên, email, SĐT..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: "100%" }}
              >
                <Select.Option value="all">Tất cả vai trò</Select.Option>
                <Select.Option value="customer">Khách hàng</Select.Option>
                <Select.Option value="seller">Người bán</Select.Option>
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
              >
                <Select.Option value="all">Tất cả trạng thái</Select.Option>
                <Select.Option value="active">Đang hoạt động</Select.Option>
                <Select.Option value="inactive">Bị khóa</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setTriggerAddUser(true)}
              >
                Thêm người dùng mới
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Main Table */}
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
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

      <UserDetailRow
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        user={selectedUser}
      />
    </Layout>
  );
}
