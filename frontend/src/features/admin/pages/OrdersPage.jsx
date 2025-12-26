// src/features/admin/pages/Order/OrdersPage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  message, Input, Select, Space, notification, Button, DatePicker, Card, Row, Col, Typography, Spin 
} from "antd";
import { 
  SearchOutlined, ReloadOutlined, DownloadOutlined, 
  ShoppingCartOutlined, CheckCircleOutlined, CloseCircleOutlined, CarOutlined, ClockCircleOutlined 
} from "@ant-design/icons";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import OrderTableAntd from "../components/OrderAdmin/OrderTableAntd";
import OrderDetailModal from "../components/OrderAdmin/OrderDetailModal";
import { useAuth } from "../../login_register/services/AuthContext";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useDebounce from "../../../hooks/useDebounce";

import "../styles/OrdersPage.css";

dayjs.extend(isBetween);
// Enable socket.io client only when this env var is set to "true"
const ENABLE_SOCKET_IO = process.env.REACT_APP_ENABLE_SOCKET_IO === "true";
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;

// --- 1. ĐỊNH NGHĨA TRẠNG THÁI TIẾNG VIỆT ---
// Đồng bộ với backend Order.STATUS_CHOICES (pending, confirmed, shipping, delivered, completed, cancelled, returned)
const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Giao thành công",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  returned: "Trả hàng / Hoàn tiền",
};

const OrdersPage = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // Filter Ngày
  const [dateRange, setDateRange] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");

  // Detail Modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const socketRef = useRef(null);

  // --- 2. OPTION CHO DROPDOWN (Giảm bớt các trạng thái hiển thị) ---
  // Show only the most useful statuses in the admin filter dropdown
  const VISIBLE_STATUS_KEYS = ["", "pending", "confirmed", "shipping", "completed", "cancelled", "returned"];
  const statusOptions = useMemo(() => {
    return VISIBLE_STATUS_KEYS.map((k) => ({ value: k, label: k === "" ? "Tất cả trạng thái" : (STATUS_LABELS[k] || k) }));
  }, []);

  // --- 3. FETCH DATA ---
  const { data: ordersData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["adminOrders", statusFilter, debouncedSearch, currentPage, pageSize, dateRange],
    queryFn: () => adminApi.getOrders({
      status: statusFilter,
      search: debouncedSearch,
      start_date: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : null,
      end_date: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : null,
      page: currentPage,
      page_size: pageSize
    }),
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });

  const orders = ordersData?.orders || [];
  const totalOrders = ordersData?.total || 0;

  useEffect(() => {
    console.debug('[OrdersPage] ordersData updated:', { total: totalOrders, ordersCount: orders.length, statusFilter });
  }, [ordersData, totalOrders, statusFilter]);

  // Fetch Dashboard Stats (Server-side)
  const { data: dashboardStats } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 1000 * 60 * 5,
  });

  // --- 4. SOCKET & UTILS ---
  useEffect(() => {
    if (isError && error) {
      message.error(`Lỗi tải dữ liệu: ${error.message || 'Không xác định'}`);
    }
  }, [isError, error]);

  useEffect(() => {
    const userRoleName = user?.role?.name;
    const isAdmin = !authLoading && user?.isAuthenticated && userRoleName === "admin";

    if (isAdmin && ENABLE_SOCKET_IO && !socketRef.current) {
      // Lazy-load socket.io-client only when explicitly enabled by env.
      (async () => {
        try {
          const { default: io } = await import("socket.io-client");
          const token = localStorage.getItem("token");
          socketRef.current = io(process.env.REACT_APP_API_URL, {
            auth: { token },
            transports: ["websocket"],
            reconnection: true,
          });

          socketRef.current.on && socketRef.current.on("new_order", (newOrderData) => {
            notification.success({
              message: "Có đơn hàng mới!",
              description: `Khách: ${newOrderData.customer_name} - ${parseInt(newOrderData.total_price).toLocaleString()}đ`,
            });
            queryClient.invalidateQueries(["adminOrders"]);
            queryClient.invalidateQueries(["adminDashboardStats"]);
          });
        } catch (e) {
          console.warn("Socket init failed (socket.io may not be available on backend):", e);
        }
      })();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authLoading, user, queryClient]);

  // --- 5. HANDLERS ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const now = dayjs();
    switch (val) {
      case "all": setDateRange(null); break;
      case "today": setDateRange([now.startOf('day'), now.endOf('day')]); break;
      case "7d": setDateRange([now.subtract(6, "day").startOf('day'), now.endOf('day')]); break;
      case "30d": setDateRange([now.subtract(29, "day").startOf('day'), now.endOf('day')]); break;
      default: break;
    }
    setCurrentPage(1);
  };

  // Nút Làm mới: Reset toàn bộ bộ lọc và tải lại
  const handleReload = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateRange(null);
    setTimeFilter("all");
    setCurrentPage(1);
    
    queryClient.invalidateQueries(["adminOrders"]);
    queryClient.invalidateQueries(["adminDashboardStats"]);
    message.success("Đã làm mới dữ liệu và đặt lại bộ lọc");
  };

  const handleExportExcel = () => {
    if (orders.length === 0) { message.warning("Không có dữ liệu để xuất"); return; }
    
    const exportData = orders.map((order) => ({
      "Mã đơn": order.id,
      "Khách hàng": order.customer_name,
      "SĐT": order.customer_phone,
      "Tổng tiền": order.total_price,
      "Trạng thái": STATUS_LABELS[order.status] || order.status, // Xuất tiếng Việt
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

  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminApi.getOrderDetail(orderId);
      setSelectedOrder(orderDetail);
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
      queryClient.invalidateQueries(["adminOrders"]);
      message.success(`Đã hủy đơn #${order.id}`);
    } catch (e) { message.error("Hủy đơn thất bại"); }
  };

  // Helper Functions truyền xuống con
  const getStatusLabel = (status) => STATUS_LABELS[status] || status;
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  const formatDate = (dateString) => dateString ? dayjs(dateString).format("DD/MM/YYYY HH:mm") : "";

  // --- 6. STATS CALCULATION ---
  // Dashboard API trả về keys khác (eg. total_orders, processing_orders) và một array orders_by_status
  const stats = useMemo(() => {
    const byStatus = (dashboardStats?.orders_by_status || []).reduce((acc, it) => {
      // backend returns objects like {status_name: 'pending', count: 12}
      const key = it.status_name || it.status || it.statusName;
      acc[key] = (acc[key] || 0) + (it.count || 0);
      return acc;
    }, {});

    const get = (k) => byStatus[k] ?? 0;

    return {
      total: dashboardStats?.total_orders ?? totalOrders,
      // Chờ xử lý: tập hợp các trạng thái ban đầu
      pending: dashboardStats?.processing_orders ?? (get('pending') + get('confirmed')),
      // Trả hàng / Hoàn tiền (explicit returned key)
      returned: dashboardStats?.returned_orders ?? get('returned'),
      // Đang giao
      shipping: get('shipping'),
      // Hoàn thành (completed)
      success: get('completed') + get('delivered'),
      cancelled: get('cancelled') ?? dashboardStats?.cancelled_orders ?? 0,
    };
  }, [dashboardStats, totalOrders]);

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
      {isError && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f', background: '#fff1f0' }}>
          <Space direction="vertical">
            <Text strong style={{ color: '#ff4d4f' }}>⚠️ Lỗi tải dữ liệu</Text>
            <Button type="primary" onClick={() => refetch()} size="small">Thử lại</Button>
          </Space>
        </Card>
      )}

      {!isLoading && (
        <>
          {/* Dashboard Stats */}
          <div style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}><StatCard title="Tổng đơn" value={stats.total} icon={<ShoppingCartOutlined />} color="#1890ff" active={statusFilter === ""} onClick={() => { setStatusFilter(""); setCurrentPage(1); }} /></Col>
              <Col span={6}><StatCard title="Trả hàng / hoàn tiền" value={stats.returned} icon={<ClockCircleOutlined />} color="#faad14" active={statusFilter === "returned"} onClick={() => { setStatusFilter("returned"); setCurrentPage(1); }} /></Col>
              <Col span={6}><StatCard title="Đang giao" value={stats.shipping} icon={<CarOutlined />} color="#13c2c2" active={statusFilter === "shipping"} onClick={() => { setStatusFilter("shipping"); setCurrentPage(1); }} /></Col>
              <Col span={6}><StatCard title="Hoàn thành" value={stats.success} icon={<CheckCircleOutlined />} color="#52c41a" active={statusFilter === "completed"} onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }} /></Col>
            </Row>
          </div>

          <Card bordered={false} bodyStyle={{ padding: 24 }} style={{ borderRadius: 12 }}>
            {/* Filter Bar */}
            <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <Space wrap align="center" size={12}>
                <Input 
                  placeholder="Tìm tên, SĐT, Mã đơn..." 
                  prefix={<SearchOutlined />} 
                  value={searchTerm} 
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  allowClear 
                  style={{ width: 240 }} 
                />
                
                <Select 
                  placeholder="Trạng thái" 
                  value={statusFilter} 
                  onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }} 
                  style={{ width: 180 }} 
                >
                  {statusOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>

                <Select 
                  value={timeFilter} 
                  onChange={handleTimeChange} 
                  style={{ width: 130 }}
                >
                  <Option value="all">Toàn bộ</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="7d">7 ngày qua</Option>
                  <Option value="30d">30 ngày qua</Option>
                </Select>

                <RangePicker 
                  value={dateRange} 
                  onChange={(dates) => { setDateRange(dates); setTimeFilter("custom"); setCurrentPage(1); }} 
                  format="DD/MM/YYYY" 
                  placeholder={['Từ ngày', 'Đến ngày']} 
                  style={{ width: 240 }} 
                />
              </Space>

              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReload}>Làm mới</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
              </Space>
            </div>

            <OrderTableAntd
              orders={orders}
              loading={isLoading}
              getStatusLabel={getStatusLabel} // Truyền hàm convert tiếng Việt
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onViewDetail={handleViewDetail}
              onCancel={handleCancelOrder}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalOrders,
                onChange: (p, s) => { setCurrentPage(p); setPageSize(s); },
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Tổng ${total} đơn hàng`
              }}
            />
          </Card>
        </>
      )}

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