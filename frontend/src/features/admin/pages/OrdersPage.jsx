import React, { useState, useEffect, useRef } from "react";
import { message, Input, Select, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import OrderTableAntd from "../components/OrderAdmin/OrderTableAntd";
import OrderDetailModal from "../components/OrderAdmin/OrderDetailModal";
import { useAuth } from "../../login_register/services/AuthContext";

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
  const eventSourceRef = useRef(null);

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

  useEffect(() => {
    const userRoleName = user?.role?.name; // ← Lấy tên role
    const shouldFetch =
      !authLoading && user?.isAuthenticated && userRoleName === "admin";

    if (shouldFetch) {
      const timer = setTimeout(async () => {
        try {
          setLoading(true);
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
      }, 300);

      return () => clearTimeout(timer);
    } else {
      // Khi auth xong mà không đủ quyền, dừng loading
      if (!authLoading) {
        setLoading(false);
        setOrders([]);
        if (user?.isAuthenticated && userRoleName !== "admin") {
          setError("Bạn không có quyền truy cập trang này.");
        }
      }
    }
  }, [
    authLoading,
    user?.isAuthenticated,
    user?.role,
    statusFilter,
    searchTerm,
  ]);

  // SSE for real-time order notifications
  useEffect(() => {
    const userRoleName = user?.role?.name;
    const isAdmin = !authLoading && user?.isAuthenticated && userRoleName === "admin";

    if (isAdmin && !eventSourceRef.current) {
      const token = localStorage.getItem("token");
      const eventSource = new EventSource(
        `${process.env.REACT_APP_API_URL}/orders/admin/notifications/sse/?token=${token}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_order') {
            message.info(`Đơn hàng mới: ${data.customer_name} - ${data.total_price.toLocaleString()} VND`);
            // Refresh orders list
            const fetchOrders = async () => {
              try {
                const params = {};
                if (statusFilter) params.status = statusFilter;
                if (searchTerm.trim()) params.search = searchTerm.trim();
                const newOrders = await adminApi.getOrders(params);
                setOrders(Array.isArray(newOrders) ? newOrders : []);
              } catch (err) {
                console.error('Error refreshing orders:', err);
              }
            };
            fetchOrders();
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        eventSourceRef.current = null;
      };

      eventSourceRef.current = eventSource;
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [authLoading, user?.isAuthenticated, user?.role, statusFilter, searchTerm]);

  // ---------- Actions ----------
  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminApi.getOrderDetail(orderId);
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        const fullOrder = { ...updatedOrder, ...orderDetail };
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? fullOrder : order
          )
        );
        setSelectedOrder(fullOrder);
        setDetailVisible(true);
      }
    } catch (err) {
      alert("Không thể tải chi tiết đơn hàng");
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

  // ---------- Helpers ----------
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

  // ---------- Toolbar ----------
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
        <div className="text-muted">Hiển thị {orders.length} đơn hàng</div>
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
