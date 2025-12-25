// pages/UsersPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button, Input, Select, message, Row, Col, Space, Card } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  PlusOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getWSBaseUrl } from "../../../utils/ws";

// Components
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow"; 
import StatsSection from "../components/common/StatsSection";

// Constants & Styles
import { STATUS_LABELS } from '../../../constants/statusConstants';
import '../styles/UsersPage.css';

const { Option } = Select;

export default function UsersPage() {
  const { t } = useTranslation();
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection & Modal
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  // --- 1. FETCHING DATA ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/list/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- 2. WEBSOCKET: Realtime admin updates (From MinhKhanh branch) ---
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
          const payload = JSON.parse(raw);
          const action = payload.action || payload.type;
          const incoming = payload.data;
          
          if (!incoming || !incoming.id) return;

          setUsers((prev) => {
            switch (action) {
              case "CREATE":
              case "CREATED": {
                const userWithFlags = { ...incoming, is_new: true };
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
            message.success(`Người dùng mới: ${incoming.email || incoming.username || incoming.name}`);
            // Tự động tắt highlight sau 8s
            setTimeout(() => {
              setUsers((prev) =>
                prev.map((u) => u.id === incoming.id ? { ...u, is_new: false } : u)
              );
            }, 8000);
          }
        } catch (err) {
          console.error("[ADMIN WS - USERS] message error:", err);
        }
      };

      socket.onclose = () => {
        if (isStopped) return;
        socketRef.current = null;
        if (reconnectRef.current.attempts < MAX_RECONNECT_ATTEMPTS) {
          const attempt = ++reconnectRef.current.attempts;
          const delay = Math.min(30000, 1000 * 2 ** attempt);
          reconnectRef.current.timer = setTimeout(connectWS, delay);
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
  }, []);

  // --- 3. STATS CALCULATION ---
  const statItems = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = total - active;
    const sellers = users.filter(u => u.role?.name?.toLowerCase() === 'seller').length;

    return [
      { title: "Tổng User", value: total, icon: <TeamOutlined />, color: "#1890ff" },
      { title: STATUS_LABELS.active || "Hoạt động", value: active, icon: <CheckCircleOutlined />, color: "#52c41a" },
      { title: "Bị khóa/Ẩn", value: inactive, icon: <LockOutlined />, color: "#faad14" },
      { title: "Seller", value: sellers, icon: <ShoppingOutlined />, color: "#722ed1" }
    ];
  }, [users]);

  // --- HANDLERS ---
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setStatusFilter("all");
  };

  const handleShowDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };
  
  const handleUserUpdated = (updatedUser) => {
     setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
  };

  const hasActiveFilters = searchTerm !== "" || selectedRole !== "all" || statusFilter !== "all";

  // --- RENDER ---
  return (
    <AdminPageLayout title="QUẢN LÝ NGƯỜI DÙNG">
      
      {/* 1. KHU VỰC THỐNG KÊ */}
      <div style={{ marginBottom: 24 }}>
        <StatsSection items={statItems} loading={loading} />
      </div>

      {/* 2. THANH CÔNG CỤ (TOOLBAR) - UI từ HEAD (Đẹp hơn) */}
      <Card bodyStyle={{ padding: "20px" }} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          
          {/* Bên Trái: Bộ lọc & Tìm kiếm */}
          <Col xs={24} lg={16}>
            <Space wrap size={12}>
              <Input
                placeholder="Tìm tên, email, sđt..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                style={{ width: 280 }} 
                size="middle"
              />

              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ minWidth: 160 }}
                suffixIcon={<FilterOutlined style={{ color: '#bfbfbf' }} />}
                options={[
                    { value: "all", label: "Tất cả vai trò" },
                    { value: "customer", label: "Khách hàng" },
                    { value: "seller", label: "Người bán" },
                    { value: "admin", label: "Admin" },
                ]}
              />

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ minWidth: 160 }}
                suffixIcon={<FilterOutlined style={{ color: '#bfbfbf' }} />}
                options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: STATUS_LABELS.active || "Đang hoạt động" },
                    { value: "locked", label: STATUS_LABELS.locked || "Đã khóa" },
                ]}
              />

              {hasActiveFilters && (
                <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={handleClearFilters}
                >
                    Xóa lọc
                </Button>
              )}
            </Space>
          </Col>

          {/* Bên Phải: Các nút hành động */}
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => { fetchUsers(); message.success("Đã làm mới"); }}
                loading={loading}
              >
              </Button>
              <Button icon={<DownloadOutlined />}>Xuất Excel</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setTriggerAddUser(true)}
                style={{ 
                    backgroundColor: "#389e0d", 
                    borderColor: "#389e0d", 
                    fontWeight: 500,
                    boxShadow: '0 2px 4px rgba(56, 158, 13, 0.3)'
                }}
              >
                Thêm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. BẢNG DỮ LIỆU */}
      <div className="users-page-content">
        <UserTable
          users={users}
          setUsers={setUsers}
          loading={loading}
          selectedRole={selectedRole}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          checkedIds={checkedIds}
          setCheckedIds={setCheckedIds}
          triggerAddUser={triggerAddUser}
          setTriggerAddUser={setTriggerAddUser}
          onRow={handleShowDetail}
        />
      </div>

      {/* Modal Detail */}
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