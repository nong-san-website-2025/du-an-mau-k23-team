import React, { useState, useEffect } from "react";
import { message, Input, Select, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import OrderTableAntd from "../components/OrderAdmin/OrderTableAntd";
import { useAuth } from "../../login_register/services/AuthContext";

import "../styles/OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { user, loading: authLoading } = useAuth();

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "processing", label: "Đang xử lý" },
    { value: "shipped", label: "Đã giao vận" },
    { value: "delivered", label: "Đã giao hàng" },
    { value: "completed", label: "Hoàn thành" },
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

  // ---------- Actions ----------
  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminApi.getOrderDetail(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...orderDetail } : order
        )
      );
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
      />
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted">Hiển thị {orders.length} đơn hàng</div>
      </div>
    </AdminPageLayout>
  );
};

export default OrdersPage;
