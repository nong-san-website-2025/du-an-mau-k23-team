// src/features/admin/pages/Order/OrdersPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  message, Input, Select, Space, notification, Button, DatePicker, Card, Row, Col, Typography 
} from "antd";
import { 
  SearchOutlined, ReloadOutlined, DownloadOutlined, 
  ShoppingCartOutlined, CheckCircleOutlined, CloseCircleOutlined 
} from "@ant-design/icons";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import OrderTableAntd from "../components/OrderAdmin/OrderTableAntd";
import OrderDetailModal from "../components/OrderAdmin/OrderDetailModal";
import { useAuth } from "../../login_register/services/AuthContext";
import io from "socket.io-client";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import "../styles/OrdersPage.css";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select; // [MỚI]

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // [MỚI] Filter Ngày & Dropdown
  const [dateRange, setDateRange] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const socketRef = useRef(null);

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "shipping", label: "Đang giao hàng" },
    { value: "shipped", label: "Đã giao vận" },
    { value: "delivered", label: "Đã giao hàng" },
    { value: "success", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "refunded", label: "Đã hoàn tiền" },
  ];

  // --- 1. FETCH DATA ---
  const fetchOrders = useCallback(async () => {
    try {
      if (orders.length === 0) setLoading(true);
      const data = await adminApi.getOrders({}); 
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [orders.length]);

  useEffect(() => {
    const userRoleName = user?.role?.name;
    const shouldFetch = !authLoading && user?.isAuthenticated && userRoleName === "admin";

    if (shouldFetch) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchOrders]);

  // --- 2. SOCKET CONNECTION ---
  useEffect(() => {
    const userRoleName = user?.role?.name;
    const isAdmin = !authLoading && user?.isAuthenticated && userRoleName === "admin";

    if (isAdmin && !socketRef.current) {
      const token = localStorage.getItem("token");
      socketRef.current = io(process.env.REACT_APP_API_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
      });

      socketRef.current.on("new_order", (newOrderData) => {
        notification.success({
          message: "Có đơn hàng mới!",
          description: `Khách: ${newOrderData.customer_name} - ${parseInt(newOrderData.total_price).toLocaleString()}đ`,
          placement: "topRight",
          duration: 5,
        });
        setOrders((prevOrders) => {
          if (prevOrders.some((o) => o.id === newOrderData.id)) return prevOrders;
          return [newOrderData, ...prevOrders];
        });
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authLoading, user]);

  // --- 3. FILTER LOGIC (DROPDOWN + DATE RANGE) ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const now = dayjs();
    
    switch (val) {
      case "all":
        setDateRange(null);
        break;
      case "today": 
        setDateRange([now.startOf('day'), now.endOf('day')]); 
        break;
      case "7d": 
        setDateRange([now.subtract(6, "day").startOf('day'), now.endOf('day')]); 
        break;
      case "30d": 
        setDateRange([now.subtract(29, "day").startOf('day'), now.endOf('day')]); 
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter && order.status !== statusFilter) return false;

      // 2. Search Filter
      const searchKey = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (order.customer_name && order.customer_name.toLowerCase().includes(searchKey)) ||
        (order.customer_phone && order.customer_phone.includes(searchKey)) ||
        (String(order.id).includes(searchKey));
      
      if (!matchesSearch) return false;

      // 3. Date Range Filter
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const orderDate = dayjs(order.created_at);
        if (!orderDate.isValid()) return false;
        matchesDate = orderDate.isBetween(dateRange[0], dateRange[1], null, '[]');
      }

      return matchesDate;
    });
  }, [orders, statusFilter, searchTerm, dateRange]);

  // --- 4. ACTIONS ---
  const handleReload = () => {
    setLoading(true);
    // Reset Filters
    setSearchTerm("");
    setStatusFilter("");
    setDateRange(null);
    setTimeFilter("all");

    // Fetch Data
    fetchOrders().then(() => {
      message.success("Đã làm mới dữ liệu và đặt lại bộ lọc");
    });
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) { message.warning("Không có dữ liệu để xuất"); return; }
    
    const exportData = filteredOrders.map((order) => ({
      "Mã đơn": order.id,
      "Khách hàng": order.customer_name,
      "SĐT": order.customer_phone,
      "Tổng tiền": order.total_price,
      "Trạng thái": getStatusLabel(order.status),
      "Ngày tạo": dayjs(order.created_at).format("DD/MM/YYYY HH:mm"),
      "Cửa hàng": order.shop_name,
      "Số lượng SP": order.items?.length || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DonHang");
    XLSX.writeFile(workbook, `DonHang_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất file Excel thành công!");
  };

  // --- 5. STATS ---
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipping: orders.filter(o => ['shipping', 'shipped'].includes(o.status)).length,
    success: orders.filter(o => o.status === 'success').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  // --- 6. HANDLERS ---
  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminApi.getOrderDetail(orderId);
      setOrders((prev) => prev.map((order) => order.id === orderId ? { ...order, ...orderDetail } : order));
      setSelectedOrder({ ...orders.find((o) => o.id === orderId), ...orderDetail });
      setDetailVisible(true);
    } catch (err) { message.error("Không thể tải chi tiết đơn hàng"); }
  };

  const handleCancelOrder = async (order) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/orders/${order.id}/admin-cancel/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)));
      message.success(`Đã hủy đơn #${order.id}`);
    } catch (e) { message.error("Hủy đơn thất bại"); }
  };

  const getStatusLabel = (status) => statusOptions.find((opt) => opt.value === status)?.label || status;
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleString("vi-VN");

  // --- RENDER ---
  const StatCard = ({ title, value, icon, color, onClick, active }) => (
    <Card hoverable onClick={onClick} style={{ cursor: "pointer", borderRadius: 8, border: active ? `2px solid ${color}` : "1px solid #f0f0f0", background: active ? `${color}08` : "#fff" }} bodyStyle={{ padding: 16 }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <div style={{ padding: 8, borderRadius: "50%", background: `${color}15`, color: color }}>{icon}</div>
          <Text type="secondary">{title}</Text>
        </Space>
        <Text strong style={{ fontSize: 20, color: color }}>{value}</Text>
      </Space>
    </Card>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ ĐƠN HÀNG">
      {/* --- STATS BAR --- */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}><StatCard title="Tổng đơn" value={stats.total} icon={<ShoppingCartOutlined />} color="#1890ff" active={statusFilter === ""} onClick={() => setStatusFilter("")} /></Col>
          <Col span={6}><StatCard title="Chờ xử lý" value={stats.pending} icon={<ReloadOutlined />} color="#faad14" active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} /></Col>
          <Col span={6}><StatCard title="Hoàn thành" value={stats.success} icon={<CheckCircleOutlined />} color="#52c41a" active={statusFilter === "success"} onClick={() => setStatusFilter("success")} /></Col>
          <Col span={6}><StatCard title="Đã hủy" value={stats.cancelled} icon={<CloseCircleOutlined />} color="#ff4d4f" active={statusFilter === "cancelled"} onClick={() => setStatusFilter("cancelled")} /></Col>
        </Row>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 24 }} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        {/* --- FILTER BAR (ĐÃ TINH GỌN) --- */}
        <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <Space wrap align="center" size={12}>
            <Input 
              placeholder="Tìm tên khách, SĐT, Mã đơn..." 
              prefix={<SearchOutlined />} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              allowClear 
              style={{ width: 240 }} 
            />
            
            <Select 
              placeholder="Trạng thái" 
              value={statusFilter} 
              onChange={setStatusFilter} 
              options={statusOptions} 
              style={{ width: 160 }} 
            />

            {/* [MỚI] Dropdown chọn thời gian */}
            <Select 
              value={timeFilter} 
              onChange={handleTimeChange} 
              style={{ width: 130 }}
            >
              <Option value="all">Toàn bộ</Option>
              <Option value="today">Hôm nay</Option>
              <Option value="7d">7 ngày qua</Option>
              <Option value="30d">30 ngày qua</Option>
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
            <Button icon={<ReloadOutlined />} onClick={handleReload} title="Làm mới và xóa bộ lọc">Làm mới</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
          </Space>
        </div>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <OrderTableAntd
          orders={filteredOrders}
          loading={loading}
          getStatusLabel={getStatusLabel}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onViewDetail={handleViewDetail}
          onCancel={handleCancelOrder}
          onRow={(record) => ({ onClick: () => handleViewDetail(record.id) })}
        />
        
        <div className="d-flex justify-content-between align-items-center mt-3 text-muted">
          <small>Hiển thị {filteredOrders.length} / {orders.length} đơn hàng</small>
        </div>
      </Card>

      {selectedOrder && (
        <OrderDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          order={selectedOrder}
          getStatusLabel={getStatusLabel}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onCancelOrder={handleCancelOrder}
        />
      )}
    </AdminPageLayout>
  );
};

export default OrdersPage;