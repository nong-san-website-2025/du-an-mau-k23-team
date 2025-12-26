// src/features/admin/pages/User/UsersPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  Button, Input, Select, message, Row, Col, Space, Card, DatePicker, Modal 
} from "antd";
import {
  SearchOutlined,
  TeamOutlined,
  PlusOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  StopOutlined,
  UnlockOutlined,
  DeleteOutlined, // Giữ lại icon này nếu cần dùng trong tương lai
  FilterOutlined
} from '@ant-design/icons';
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Utils & Constants
import { getWSBaseUrl } from "../../../utils/ws"; // Từ HEAD
import { STATUS_LABELS } from '../../../constants/statusConstants'; // Từ HEAD

// Components
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import StatsSection from "../components/common/StatsSection";

import '../styles/UsersPage.css';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

import { useQuery, useQueryClient } from "@tanstack/react-query";
import useDebounce from "../../../hooks/useDebounce";

export default function UsersPage() {
  const { t } = useTranslation();
  const API_URL = process.env.REACT_APP_API_URL;
  const queryClient = useQueryClient();

  // --- STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all"); 

  // Selection & Modal States
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  // --- 1. FETCHING DATA WITH REACT QUERY ---
  const { data: usersData, isLoading: loading, isError } = useQuery({
    queryKey: ["adminUsers", selectedRole, statusFilter, debouncedSearch, dateRange, currentPage, pageSize],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        role: selectedRole,
        status: statusFilter,
        search: debouncedSearch,
        page: currentPage,
        page_size: pageSize,
      });
      if (dateRange?.[0] && dateRange?.[1]) {
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      }

      const res = await axios.get(`${API_URL}/users/list/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const users = usersData?.results || (Array.isArray(usersData) ? usersData : []);
  const totalUsers = usersData?.count || users.length;

  const handlePageChange = (page, pSize) => {
    setCurrentPage(page);
    setPageSize(pSize);
  };

  const fetchUsers = () => {
    queryClient.invalidateQueries(["adminUsers"]);
  };

  // --- 2. WEBSOCKET: Realtime admin updates (Logic from HEAD merged with TruongAn requirements) ---
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
      // Fallback logic if getWSBaseUrl fails
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

          // Làm mới dữ liệu từ server khi có thay đổi
          queryClient.invalidateQueries(["adminUsers"]);

          if (action === "CREATE" || action === "CREATED") {
            message.success(`Người dùng mới: ${incoming.email || incoming.username || incoming.name}`);
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
    const activeUsers = users.filter(u => u.is_active).length;
    const lockedUsers = users.filter(u => !u.is_active).length;
    const sellers = users.filter(u => u.role?.name?.toLowerCase() === 'seller' || u.role_id === 2).length;
    
    return [
      { title: "Tổng User", value: totalUsers, icon: <TeamOutlined />, color: "#1890ff" },
      { title: STATUS_LABELS.active || "Đang hoạt động", value: activeUsers, icon: <CheckCircleOutlined />, color: "#52c41a" },
      { title: "Bị khóa/Ẩn", value: lockedUsers, icon: <LockOutlined />, color: "#faad14" },
      { title: "Seller", value: sellers, icon: <ShoppingOutlined />, color: "#722ed1" }
    ];
  }, [totalUsers, users]);

  // --- FILTER LOGIC (From TruongAn) ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    
    switch (val) {
      case "all":
        setDateRange(null);
        break;
      case "today": 
        setDateRange([today.startOf('day'), today.endOf('day')]); 
        break;
      case "week": 
        setDateRange([today.subtract(6, "day").startOf('day'), today.endOf('day')]); 
        break;
      case "month": 
        setDateRange([today.subtract(29, "day").startOf('day'), today.endOf('day')]); 
        break;
      default: break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
  };

  const filteredUsers = useMemo(() => {
    const s = searchTerm.normalize("NFC").toLowerCase().trim();
    return users.filter((u) => {
      // 1. Role Filter
      if (selectedRole !== "all" && u?.role?.name?.toLowerCase() !== selectedRole) return false;
      
      // 2. Status Filter
      if (statusFilter !== "all") {
        const statusMatch = statusFilter === "active" ? u.is_active : !u.is_active;
        if (!statusMatch) return false;
      }
      
      // 3. Search Filter
      const matchesSearch = s === "" || [u.username, u.full_name, u.email, u.phone].some((field) => (field ?? "").toString().toLowerCase().includes(s));
      if (!matchesSearch) return false;
      
      // 4. Date Filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdDate = dayjs(u.created_at);
        if (!createdDate.isValid()) return false;
        if (!createdDate.isBetween(dateRange[0], dateRange[1], null, '[]')) return false;
      }
      
      return true;
    });
  }, [users, searchTerm, selectedRole, statusFilter, dateRange]);

  // --- ACTIONS ---
  
  const handleReload = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setStatusFilter("all");
    setDateRange(null);
    setTimeFilter("all");
    setCheckedIds([]); 
    setCurrentPage(1);
    queryClient.invalidateQueries(["adminUsers"]).then(() => {
        message.success("Đã làm mới và đặt lại bộ lọc");
    });
  };

  const handleExportExcel = () => {
    if (users.length === 0) { message.warning("Không có dữ liệu để xuất"); return; }
    const formattedData = users.map(user => ({
      ID: user.id, "Tên đăng nhập": user.username, "Họ và tên": user.full_name, Email: user.email, "SĐT": user.phone,
      "Vai trò": user.role?.name, "Trạng thái": user.is_active ? "Hoạt động" : "Đã khóa",
      "Ngày tạo": dayjs(user.created_at).format("DD/MM/YYYY HH:mm")
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `Users_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  // Bulk Actions
  const activeUsersSelected = useMemo(() => users.filter(u => checkedIds.includes(u.id) && u.is_active), [users, checkedIds]);
  const lockedUsersSelected = useMemo(() => users.filter(u => checkedIds.includes(u.id) && !u.is_active), [users, checkedIds]);

  const handleBulkLock = () => {
    if (activeUsersSelected.length === 0) return;
    Modal.confirm({
      title: `Khóa ${activeUsersSelected.length} tài khoản?`,
      content: "Các tài khoản này sẽ bị vô hiệu hóa.",
      okText: "Khóa ngay", okType: "danger", cancelText: "Hủy",
      icon: <StopOutlined style={{color: 'red'}} />,
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all(activeUsersSelected.map(u => axios.patch(`${API_URL}/users/toggle-active/${u.id}/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })));
          message.success("Đã khóa tài khoản thành công.");
          fetchUsers();
          setCheckedIds([]);
        } catch (err) { message.error("Lỗi khi khóa."); setLoading(false); }
      }
    });
  };

  const handleBulkUnlock = () => {
    if (lockedUsersSelected.length === 0) return;
    Modal.confirm({
      title: `Mở khóa ${lockedUsersSelected.length} tài khoản?`,
      content: "Các tài khoản này sẽ hoạt động trở lại.",
      okText: "Mở khóa", okType: "primary", cancelText: "Hủy",
      icon: <UnlockOutlined style={{color: '#52c41a'}} />,
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all(lockedUsersSelected.map(u => axios.patch(`${API_URL}/users/toggle-active/${u.id}/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })));
          message.success("Đã mở khóa tài khoản thành công.");
          fetchUsers();
          setCheckedIds([]);
        } catch (err) { message.error("Lỗi khi mở khóa."); setLoading(false); }
      }
    });
  };

  return (
    <AdminPageLayout title="QUẢN LÝ NGƯỜI DÙNG">
      
      {/* 1. KHU VỰC THỐNG KÊ */}
      <div style={{ marginBottom: 24 }}>
        <StatsSection items={statItems} loading={loading} />
      </div>

      {/* 2. THANH CÔNG CỤ (TOOLBAR) */}
      <Card bodyStyle={{ padding: "24px" }} style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Nhóm Filter bên trái */}
          <Space wrap align="center" size={12}>
            <Input 
              placeholder="Tìm tên, email, sđt..." 
              prefix={<SearchOutlined />} 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              style={{ width: 220 }} 
              allowClear 
            />
            
            <Select 
              value={selectedRole} 
              onChange={val => { setSelectedRole(val); setCurrentPage(1); }} 
              style={{ width: 140 }} 
              options={[
                {value:"all", label:"Mọi vai trò"}, 
                {value:"customer", label:"Khách hàng"}, 
                {value:"seller", label:"Người bán"}, 
                {value:"admin", label:"Admin"}
              ]} 
            />
            
            <Select 
              value={statusFilter} 
              onChange={val => { setStatusFilter(val); setCurrentPage(1); }} 
              style={{ width: 150 }} 
              options={[
                {value:"all", label:"Mọi trạng thái"}, 
                {value:"active", label: STATUS_LABELS.active || "Hoạt động"}, 
                {value:"locked", label: STATUS_LABELS.locked || "Đã khóa"}
              ]} 
            />

            {/* Filter Thời gian */}
            <Select 
              value={timeFilter} 
              onChange={val => { handleTimeChange(val); setCurrentPage(1); }} 
              style={{ width: 130 }}
            >
              <Option value="all">Toàn bộ</Option>
              <Option value="today">Hôm nay</Option>
              <Option value="week">7 ngày qua</Option>
              <Option value="month">30 ngày qua</Option>
              <Option value="custom">Tùy chọn</Option>
            </Select>

            <RangePicker 
              value={dateRange} 
              onChange={dates => { handleRangePickerChange(dates); setCurrentPage(1); }} 
              format="DD/MM/YYYY" 
              placeholder={['Từ ngày', 'Đến ngày']} 
              style={{ width: 240 }} 
            />
          </Space>

          {/* Nhóm Hành động bên phải */}
          <Space>
            {activeUsersSelected.length > 0 && (
              <Button type="primary" danger icon={<StopOutlined />} onClick={handleBulkLock}>
                Khóa ({activeUsersSelected.length})
              </Button>
            )}
            {lockedUsersSelected.length > 0 && (
              <Button type="primary" icon={<UnlockOutlined />} onClick={handleBulkUnlock} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                Mở ({lockedUsersSelected.length})
              </Button>
            )}
            
            <Button icon={<ReloadOutlined />} onClick={handleReload} title="Làm mới và xóa bộ lọc">Làm mới</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTriggerAddUser(true)} style={{ backgroundColor: "#389e0d", borderColor: "#389e0d" }}>
              Thêm mới
            </Button>
          </Space>
        </div>
      </Card>

      {/* 3. BẢNG DỮ LIỆU */}
      <div className="users-page-content">
        <UserTable
          users={users} 
          setUsers={(u) => queryClient.setQueryData(["adminUsers", selectedRole, statusFilter, debouncedSearch, dateRange, currentPage, pageSize], u)} 
          loading={loading}
          searchTerm="" 
          selectedRole="all" 
          statusFilter="all" 
          checkedIds={checkedIds} 
          setCheckedIds={setCheckedIds}
          triggerAddUser={triggerAddUser} 
          setTriggerAddUser={setTriggerAddUser}
          onRow={(user) => { setSelectedUser(user); setShowDetailModal(true); }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalUsers,
            onChange: handlePageChange,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (t) => `Tổng ${t} users`
          }}
        />
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser} 
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onUserUpdated={() => queryClient.invalidateQueries(["adminUsers"])}
        />
      )}
    </AdminPageLayout>
  );
}