// pages/UsersPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button, Input, Select, message, Card, Row, Col, Space } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  PlusOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getWSBaseUrl } from "../../../utils/ws";

// Components
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import StatsSection from "../components/common/StatsSection";

// Constants & Styles
import { STATUS_LABELS, STATUS } from "../../../constants/statusConstants";
import "../styles/UsersPage.css";

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

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // --- 2. Data Fetching ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // SỬ DỤNG ENV Ở ĐÂY
      const res = await axios.get(`${API_URL}/users/list/`, {
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
      // SỬ DỤNG ENV Ở ĐÂY
      const res = await axios.get(`${API_URL}/users/roles/list/`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 6. WEBSOCKET: realtime admin updates for user events ---
  const socketRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timer: null });
  const MAX_RECONNECT_ATTEMPTS = 6;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let wsUrl;
    try {
      const base = getWSBaseUrl();
      wsUrl = `${base}/ws/admin/users/?token=${token}`;
    } catch (e) {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const hostFallback = process.env.REACT_APP_WS_URL || window.location.host;
      wsUrl = `${protocol}://${hostFallback.replace(/^https?:\/\//, "")}/ws/admin/users/?token=${token}`;
    }

    let socket;
    let isStopped = false;

    const connectWS = () => {
      if (isStopped) return;
      console.debug(
        "[ADMIN WS - USERS] connectWS called, attempt:",
        reconnectRef.current.attempts + 1
      );
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isStopped) {
          socket.close();
          return;
        }
        console.log("✅ [ADMIN] Users WS connected");
        reconnectRef.current.attempts = 0;
        if (reconnectRef.current.timer) {
          clearTimeout(reconnectRef.current.timer);
          reconnectRef.current.timer = null;
        }
      };

      socket.onmessage = (event) => {
        if (isStopped) return;
        try {
          const raw = event.data;
          console.debug("[ADMIN WS - USERS] raw message:", raw);
          const payload = JSON.parse(raw);
          const action = payload.action || payload.type;
          const incoming = payload.data;
          if (!incoming || !incoming.id) return;

          setUsers((prev) => {
            switch (action) {
              case "CREATE":
              case "CREATED": {
                const userWithFlags = {
                  ...incoming,
                  is_new: true,
                  isForcedVisible: true,
                };
                if (prev.some((u) => u.id === userWithFlags.id)) {
                  return prev.map((u) =>
                    u.id === userWithFlags.id ? { ...u, ...userWithFlags } : u
                  );
                }
                return [userWithFlags, ...prev];
              }
              case "UPDATE":
              case "UPDATED":
                return prev.map((u) =>
                  u.id === incoming.id ? { ...u, ...incoming } : u
                );
              case "DELETE":
              case "DELETED":
                return prev.filter((u) => u.id !== incoming.id);
              default:
                return prev;
            }
          });

          if (action === "CREATE" || action === "CREATED") {
            message.success(
              `Người dùng mới: ${incoming.email || incoming.username || incoming.name}`
            );
            setTimeout(() => {
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === incoming.id
                    ? { ...u, is_new: false, isForcedVisible: false }
                    : u
                )
              );
            }, 8000);
          }
        } catch (err) {
          console.error(
            "[ADMIN WS - USERS] message parse/error:",
            err,
            event.data
          );
        }
      };

      socket.onerror = (err) => {
        if (isStopped) return;
        console.error(
          "[ADMIN WS - USERS] error",
          err,
          "readyState:",
          socket.readyState
        );
      };

      socket.onclose = (ev) => {
        if (isStopped) return;
        console.warn(
          "[ADMIN WS - USERS] closed",
          ev,
          "readyState:",
          socket.readyState
        );
        socketRef.current = null;

        // schedule reconnect with exponential backoff
        if (reconnectRef.current.attempts < MAX_RECONNECT_ATTEMPTS) {
          const attempt = ++reconnectRef.current.attempts;
          const delay = Math.min(30000, 1000 * 2 ** attempt);
          console.debug(
            `[ADMIN WS - USERS] scheduling reconnect #${attempt} in ${delay}ms`
          );
          reconnectRef.current.timer = setTimeout(() => {
            connectWS();
          }, delay);
        } else {
          console.error("[ADMIN WS - USERS] max reconnect attempts reached");
        }
      };
    };

    connectWS();

    return () => {
      isStopped = true;
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      if (socket) socket.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 3. Computed Statistics (Logic tính toán) ---
  const statItems = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.is_active).length;
    const inactive = total - active;
    const sellers = users.filter(
      (user) => user.role?.name?.toLowerCase() === "seller"
    ).length;

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
      },
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
        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
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
        icon={<PlusOutlined />}
        onClick={() => setTriggerAddUser(true)}
        style={{
          borderRadius: 6,
          fontWeight: 500,
          backgroundColor: "#28a745",
          color: "#fff",
        }}
      >
        {t("Thêm người dùng")}
      </Button>
    </Space>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ NGƯỜI DÙNG" extra={toolbar}>
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
