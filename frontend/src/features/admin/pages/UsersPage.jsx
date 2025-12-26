// src/features/admin/pages/User/UsersPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Button,
  Input,
  Select,
  message,
  Space,
  Card,
  DatePicker,
  Modal,
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
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Utils & Components
import { getWSBaseUrl } from "../../../utils/ws";
import { STATUS_LABELS } from "../../../constants/statusConstants";
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import StatsSection from "../components/common/StatsSection";
import useDebounce from "../../../hooks/useDebounce";

import "../styles/UsersPage.css";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

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
  const [isActionLoading, setIsActionLoading] = useState(false);

  // --- 1. FETCHING DATA WITH REACT QUERY ---
  const { data: usersData, isLoading: loading } = useQuery({
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
    staleTime: 1000 * 60 * 5,
  });

  const users = usersData?.results || [];
  const totalUsers = usersData?.count || 0;

  // --- 2. WEBSOCKET REALTIME ---
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const base = getWSBaseUrl();
    const wsUrl = `${base}/ws/admin/users/?token=${token}`;
    let socket;

    const connectWS = () => {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const action = payload.action || payload.type;
          const incoming = payload.data;

          if (action === "CREATE" || action === "CREATED") {
            message.success(`Người dùng mới: ${incoming?.email || incoming?.username}`);
            queryClient.invalidateQueries(["adminUsers"]);
          }
          if (action === "UPDATE" || action === "STATUS_CHANGE") {
            queryClient.invalidateQueries(["adminUsers"]);
          }
        } catch (err) { console.error("WS Error:", err); }
      };
    };

    connectWS();
    return () => socket?.close();
  }, [queryClient]);

  // --- 3. STATS & FILTERS ---
  const statItems = useMemo(() => {
    // Lưu ý: Thống kê này dựa trên dữ liệu hiện tại của trang hoặc bạn có thể fetch 1 API thống kê riêng
    const activeCount = users.filter(u => u.is_active).length;
    const sellersCount = users.filter(u => u.role?.name?.toLowerCase() === "seller").length;

    return [
      {
        title: "Tổng User",
        value: totalUsers,
        icon: <TeamOutlined />,
        color: "#1890ff",
        active: statusFilter === "all" && selectedRole === "all",
        onClick: () => { setStatusFilter("all"); setSelectedRole("all"); setCurrentPage(1); },
      },
      {
        title: STATUS_LABELS.active || "Hoạt động",
        value: activeCount,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
        active: statusFilter === "active",
        onClick: () => { setStatusFilter("active"); setSelectedRole("all"); setCurrentPage(1); },
      },
      {
        title: "Bị khóa/Ẩn",
        value: totalUsers - activeCount,
        icon: <LockOutlined />,
        color: "#faad14",
        active: statusFilter === "locked",
        onClick: () => { setStatusFilter("locked"); setSelectedRole("all"); setCurrentPage(1); },
      },
      {
        title: "Seller",
        value: sellersCount,
        icon: <ShoppingOutlined />,
        color: "#722ed1",
        active: selectedRole === "seller",
        onClick: () => { setSelectedRole("seller"); setStatusFilter("all"); setCurrentPage(1); },
      },
    ];
  }, [totalUsers, users, statusFilter, selectedRole]);

  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    setCurrentPage(1);
    if (val === "all") setDateRange(null);
    else if (val === "today") setDateRange([today.startOf("day"), today.endOf("day")]);
    else if (val === "week") setDateRange([today.subtract(6, "day").startOf("day"), today.endOf("day")]);
    else if (val === "month") setDateRange([today.subtract(29, "day").startOf("day"), today.endOf("day")]);
  };

  const handleReload = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setStatusFilter("all");
    setDateRange(null);
    setTimeFilter("all");
    setCheckedIds([]);
    setCurrentPage(1);
    queryClient.invalidateQueries(["adminUsers"]).then(() => {
      message.success("Đã làm mới dữ liệu");
    });
  };

  const handleExportExcel = () => {
    if (users.length === 0) { message.warning("Không có dữ liệu để xuất"); return; }
    const formattedData = users.map(user => ({
      ID: user.id, "Tên đăng nhập": user.username, "Họ và tên": user.full_name, Email: user.email,
      "Vai trò": user.role?.name, "Trạng thái": user.is_active ? "Hoạt động" : "Đã khóa",
      "Ngày tạo": dayjs(user.created_at).format("DD/MM/YYYY")
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `Users_${dayjs().format("DDMMYYYY")}.xlsx`);
  };

  // --- 4. BULK ACTIONS ---
  const selectedRows = users.filter(u => checkedIds.includes(u.id));
  
  const handleBulkToggleStatus = (targetStatus) => {
    const title = targetStatus === "lock" ? "Khóa tài khoản" : "Mở khóa tài khoản";
    Modal.confirm({
      title: `${title} cho ${checkedIds.length} người dùng?`,
      onOk: async () => {
        setIsActionLoading(true);
        try {
          await Promise.all(checkedIds.map(id => 
            axios.patch(`${API_URL}/users/toggle-active/${id}/`, {}, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
          ));
          message.success("Thực hiện thành công");
          queryClient.invalidateQueries(["adminUsers"]);
          setCheckedIds([]);
        } catch (err) { message.error("Có lỗi xảy ra"); }
        finally { setIsActionLoading(false); }
      }
    });
  };

  return (
    <AdminPageLayout title="QUẢN LÝ NGƯỜI DÙNG">
      <div style={{ marginBottom: 24 }}>
        <StatsSection items={statItems} loading={loading} />
      </div>

      <Card className="toolbar-card" bodyStyle={{ padding: "24px" }} style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <Space wrap size={12}>
            <Input 
              placeholder="Tìm tên, email, sđt..." 
              prefix={<SearchOutlined />} 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              style={{ width: 220 }} allowClear 
            />
            <Select 
              value={selectedRole} 
              onChange={val => { setSelectedRole(val); setCurrentPage(1); }} 
              style={{ width: 140 }}
              options={[
                { value: "all", label: "Mọi vai trò" },
                { value: "customer", label: "Khách hàng" },
                { value: "seller", label: "Người bán" },
                { value: "admin", label: "Admin" },
              ]}
            />
            <Select 
              value={statusFilter} 
              onChange={val => { setStatusFilter(val); setCurrentPage(1); }} 
              style={{ width: 150 }}
              options={[
                { value: "all", label: "Mọi trạng thái" },
                { value: "active", label: STATUS_LABELS.active || "Hoạt động" },
                { value: "locked", label: STATUS_LABELS.locked || "Đã khóa" },
              ]}
            />
            <Select value={timeFilter} onChange={handleTimeChange} style={{ width: 130 }}>
              <Option value="all">Toàn bộ thời gian</Option>
              <Option value="today">Hôm nay</Option>
              <Option value="week">7 ngày qua</Option>
              <Option value="month">30 ngày qua</Option>
              <Option value="custom">Tùy chọn</Option>
            </Select>
            {timeFilter === "custom" && (
              <RangePicker 
                value={dateRange} 
                onChange={dates => { setDateRange(dates); setCurrentPage(1); }} 
                format="DD/MM/YYYY" 
              />
            )}
          </Space>

          <Space>
            {checkedIds.length > 0 && (
              <>
                <Button danger icon={<StopOutlined />} onClick={() => handleBulkToggleStatus("lock")}>Khóa</Button>
                <Button type="primary" icon={<UnlockOutlined />} onClick={() => handleBulkToggleStatus("unlock")} style={{ background: "#52c41a" }}>Mở khóa</Button>
              </>
            )}
            <Button icon={<ReloadOutlined />} onClick={handleReload}>Làm mới</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTriggerAddUser(true)} style={{ background: "#389e0d" }}>Thêm mới</Button>
          </Space>
        </div>
      </Card>

      <div className="users-page-content">
        <UserTable
          users={users}
          loading={loading || isActionLoading}
          checkedIds={checkedIds}
          setCheckedIds={setCheckedIds}
          triggerAddUser={triggerAddUser}
          setTriggerAddUser={setTriggerAddUser}
          onRow={(user) => { setSelectedUser(user); setShowDetailModal(true); }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalUsers,
            onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} người dùng`,
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