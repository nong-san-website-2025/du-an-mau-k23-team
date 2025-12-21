import React, { useState, useEffect, useRef, useCallback } from "react";
import { message, Input, Select, Space, notification } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import OrderTableAntd from "../components/OrderAdmin/OrderTableAntd";
import OrderDetailModal from "../components/OrderAdmin/OrderDetailModal";
import { useAuth } from "../../login_register/services/AuthContext";
// 1. SỬA: Import Socket.io thay vì dùng EventSource mặc định
import io from "socket.io-client";

import "../styles/OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { user, loading: authLoading } = useAuth();

  // 2. SỬA: Dùng socketRef để quản lý kết nối
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

  // 3. SỬA: Tách hàm fetchOrders ra và dùng useCallback để tái sử dụng
  const fetchOrders = useCallback(async () => {
    try {
      // Chỉ hiện loading lần đầu, những lần update sau ngầm
      if (orders.length === 0) setLoading(true);

      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await adminApi.getOrders(params);
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]); // Hàm này sẽ tạo lại khi filter thay đổi

  // ---------- EFFECT 1: Lấy dữ liệu ban đầu và khi filter ----------
  useEffect(() => {
    const userRoleName = user?.role?.name;
    const shouldFetch =
      !authLoading && user?.isAuthenticated && userRoleName === "admin";

    if (shouldFetch) {
      // Debounce: Đợi người dùng gõ xong mới gọi API
      const timer = setTimeout(() => {
        fetchOrders();
      }, 300);
      return () => clearTimeout(timer);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchOrders]); // fetchOrders thay đổi thì effect này chạy lại

  // ---------- EFFECT 2: Kết nối Socket Real-time (SỬA QUAN TRỌNG) ----------
  useEffect(() => {
    const userRoleName = user?.role?.name;
    const isAdmin =
      !authLoading && user?.isAuthenticated && userRoleName === "admin";

    // Chỉ kết nối khi là Admin và CHƯA có kết nối
    if (isAdmin && !socketRef.current) {
      const token = localStorage.getItem("token");

      // Khởi tạo kết nối Socket
      // Lưu ý: process.env.REACT_APP_API_URL là địa chỉ server (vd: localhost:5000)
      socketRef.current = io(process.env.REACT_APP_API_URL, {
        auth: { token }, // Gửi token để xác thực
        transports: ["websocket"], // Tối ưu hóa kết nối
        reconnection: true,
      });

      // Lắng nghe sự kiện 'new_order'
      socketRef.current.on("new_order", (newOrderData) => {
        console.log("🔥 Đơn hàng mới nhận qua Socket:", newOrderData);

        // A. Thông báo góc màn hình
        notification.success({
          message: "Có đơn hàng mới!",
          description: `Khách: ${newOrderData.customer_name} - ${parseInt(newOrderData.total_price).toLocaleString()}đ`,
          placement: "topRight",
          duration: 5,
        });

        // B. Cập nhật bảng NGAY LẬP TỨC (Không cần gọi lại API fetchOrders)
        setOrders((prevOrders) => {
          // Kiểm tra trùng lặp ID
          if (prevOrders.some((o) => o.id === newOrderData.id))
            return prevOrders;
          // Chèn đơn mới lên đầu danh sách
          return [newOrderData, ...prevOrders];
        });
      });

      // Xử lý lỗi kết nối
      socketRef.current.on("connect_error", (err) => {
        console.error("Socket error:", err.message);
      });
    }

    // Cleanup: Ngắt kết nối khi component bị hủy (rời trang)
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authLoading, user]);
  // QUAN TRỌNG: Dependency array chỉ có 'user'.
  // Thay đổi 'statusFilter' hay 'searchTerm' KHÔNG làm ngắt kết nối Socket.

  // ---------- Actions (Giữ nguyên) ----------
  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminApi.getOrderDetail(orderId);
      // Cập nhật thông tin chi tiết vào danh sách hiện tại
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...orderDetail } : order
        )
      );
      setSelectedOrder({
        ...orders.find((o) => o.id === orderId),
        ...orderDetail,
      });
      setDetailVisible(true);
    } catch (err) {
      message.error("Không thể tải chi tiết đơn hàng");
    }
  };

  const handleCancelOrder = async (order) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/orders/${order.id}/admin-cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error(await res.text());

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o))
      );
      message.success(`Đã hủy đơn #${order.id}`);
    } catch (e) {
      message.error("Hủy đơn thất bại");
      console.error(e);
    }
  };

  // ---------- Helpers (Giữ nguyên) ----------
  const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("vi-VN");

  // ---------- Toolbar (Giữ nguyên) ----------
  const toolbar = (
    <Space wrap>
      <Input
        placeholder="Tìm kiếm đơn hàng..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 320 }}
        allowClear
      />
      <Select
        placeholder="Lọc theo trạng thái"
        value={statusFilter || undefined}
        onChange={(v) => setStatusFilter(v || "")}
        style={{ width: 220 }}
        allowClear
        options={statusOptions.filter((opt) => opt.value !== "")}
      />
    </Space>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ ĐƠN HÀNG" extra={toolbar}>
      {error && <div className="alert alert-danger m-3">{error}</div>}
      <OrderTableAntd
        orders={orders}
        loading={loading}
        getStatusLabel={getStatusLabel}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onViewDetail={handleViewDetail}
        onCancel={handleCancelOrder}
        onRow={(record) => ({
          onClick: () => handleViewDetail(record.id),
        })}
      />
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted">
          Hiển thị {orders.length} đơn hàng mới nhất
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          order={selectedOrder}
          getStatusLabel={getStatusLabel}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </AdminPageLayout>
  );
};

export default OrdersPage;
