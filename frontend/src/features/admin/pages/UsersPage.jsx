// src/features/admin/pages/User/UsersPage.jsx
import React, { useEffect, useState, useMemo } from "react";
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
  UnlockOutlined
} from '@ant-design/icons';
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Components
import AdminPageLayout from "../components/AdminPageLayout";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/components/UserDetail/UserDetailRow";
import StatsSection from "../components/common/StatsSection";

import '../styles/UsersPage.css';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function UsersPage() {
  const { t } = useTranslation();
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  
  // Dropdown lọc nhanh
  const [timeFilter, setTimeFilter] = useState("all"); 

  // Selection & Modal States
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  // --- FETCHING ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/list/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Lỗi tải dữ liệu người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- STATS ---
  const statItems = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = total - active;
    const sellers = users.filter(u => u.role?.name?.toLowerCase() === 'seller').length;

    return [
      { title: "Tổng User", value: total, icon: <TeamOutlined />, color: "#1890ff" },
      { title: "Hoạt động", value: active, icon: <CheckCircleOutlined />, color: "#52c41a" },
      { title: "Bị khóa", value: inactive, icon: <LockOutlined />, color: "#faad14" },
      { title: "Seller", value: sellers, icon: <ShoppingOutlined />, color: "#722ed1" }
    ];
  }, [users]);

  // --- FILTER LOGIC ---
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
  
  // [SỬA] Nút Reload: Reset toàn bộ filter về mặc định và tải lại
  const handleReload = () => {
    // 1. Reset Filters
    setSearchTerm("");
    setSelectedRole("all");
    setStatusFilter("all");
    setDateRange(null);
    setTimeFilter("all");
    setCheckedIds([]); // Bỏ chọn các dòng

    // 2. Fetch Data
    fetchUsers().then(() => {
        message.success("Đã làm mới và đặt lại bộ lọc");
    });
  };

  const handleExportExcel = () => {
    if (filteredUsers.length === 0) { message.warning("Không có dữ liệu để xuất"); return; }
    const formattedData = filteredUsers.map(user => ({
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
      <div style={{ marginBottom: 24 }}><StatsSection items={statItems} loading={loading} /></div>

      <Card bodyStyle={{ padding: "24px" }} style={{ marginBottom: 24, borderRadius: 12 }}>
        {/* --- FILTER BAR --- */}
        <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <Space wrap align="center" size={12}>
            <Input 
              placeholder="Tìm tên, email, sđt..." 
              prefix={<SearchOutlined />} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ width: 220 }} 
              allowClear 
            />
            
            <Select 
              value={selectedRole} 
              onChange={setSelectedRole} 
              style={{ width: 140 }} 
              options={[{value:"all", label:"Mọi vai trò"}, {value:"customer", label:"Khách hàng"}, {value:"seller", label:"Người bán"}, {value:"admin", label:"Admin"}]} 
            />
            
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter} 
              style={{ width: 140 }} 
              options={[{value:"all", label:"Mọi trạng thái"}, {value:"active", label:"Hoạt động"}, {value:"locked", label:"Đã khóa"}]} 
            />

            {/* Dropdown Lọc thời gian */}
            <Select 
              value={timeFilter} 
              onChange={handleTimeChange} 
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
              onChange={handleRangePickerChange} 
              format="DD/MM/YYYY" 
              placeholder={['Từ ngày', 'Đến ngày']} 
              style={{ width: 240 }} 
            />
          </Space>

          <Space>
            {activeUsersSelected.length > 0 && <Button type="primary" danger icon={<StopOutlined />} onClick={handleBulkLock}>Khóa ({activeUsersSelected.length})</Button>}
            {lockedUsersSelected.length > 0 && <Button type="primary" icon={<UnlockOutlined />} onClick={handleBulkUnlock} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Mở ({lockedUsersSelected.length})</Button>}
            
            <Button icon={<ReloadOutlined />} onClick={handleReload} title="Làm mới và xóa bộ lọc">Làm mới</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTriggerAddUser(true)} style={{ backgroundColor: "#389e0d", borderColor: "#389e0d" }}>Thêm mới</Button>
          </Space>
        </div>

        <div className="users-page-content">
          <UserTable
            users={filteredUsers} setUsers={setUsers} loading={loading}
            searchTerm="" selectedRole="all" statusFilter="all" 
            checkedIds={checkedIds} setCheckedIds={setCheckedIds}
            triggerAddUser={triggerAddUser} setTriggerAddUser={setTriggerAddUser}
            onRow={(user) => { setSelectedUser(user); setShowDetailModal(true); }}
          />
        </div>
      </Card>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser} visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onUserUpdated={(u) => setUsers(prev => prev.map(old => old.id === u.id ? {...old, ...u} : old))}
        />
      )}
    </AdminPageLayout>
  );
}