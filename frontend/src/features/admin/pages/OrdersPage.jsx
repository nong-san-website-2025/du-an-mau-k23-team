import React, { useState, useEffect } from "react";
import { message, Input, Select, Button, Space } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import OrderTableAntd from "../components/OrderAdmin/OrderTableAntd";
import { useAuth } from "../../login_register/services/AuthContext";

import "../styles/OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkedIds, setCheckedIds] = useState([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Status options
  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "processing", label: "Đang xử lý" },
    { value: "shipped", label: "Đã giao vận" },
    { value: "delivered", label: "Đã giao hàng" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "refunded", label: "Đã hoàn tiền" }
  ];

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await adminApi.getOrders(params);
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Không thể tải danh sách đơn hàng");
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Load orders on component mount and when filters change
  // Delay until auth context finishes loading and user is admin to avoid 403 on first render
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.isAuthenticated && user?.role === 'admin') {
      loadOrders();
    }
  }, [statusFilter, searchTerm, authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps



  // Handle view order detail
  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminApi.getOrderDetail(orderId);
      // Update the order in the orders array with detailed information
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...orderDetail } : order
        )
      );
    } catch (err) {
      alert("Không thể tải chi tiết đơn hàng");
    }
  };

  // Admin cancel order
  const handleCancelOrder = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/orders/${order.id}/admin-cancel/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      // Update status in list
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
      message.success(`Đã hủy đơn #${order.id}`);
    } catch (e) {
      message.error('Hủy đơn thất bại');
      console.error(e);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: "badge bg-warning text-dark",
      processing: "badge bg-info text-white",
      shipped: "badge bg-primary text-white",
      delivered: "badge bg-success text-white",
      completed: "badge bg-success text-white",
      cancelled: "badge bg-danger text-white",
      refunded: "badge bg-secondary text-white"
    };
    return statusClasses[status] || "badge bg-secondary text-white";
  };

  // Get status label
  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Toolbar giống ApprovalProductsPage
  const renderToolbar = () => (
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
        options={[
          { value: "pending", label: "Chờ xử lý" },
          { value: "processing", label: "Đang xử lý" },
          { value: "shipped", label: "Đã giao vận" },
          { value: "delivered", label: "Đã giao hàng" },
          { value: "completed", label: "Hoàn thành" },
          { value: "cancelled", label: "Đã hủy" },
          { value: "refunded", label: "Đã hoàn tiền" },
        ]}
      />
      <Button icon={<ReloadOutlined />} onClick={loadOrders}>
        Làm mới
      </Button>
    </Space>
  );

  return (
    <AdminPageLayout>
      <div style={{ padding: 20, background: '#fff', minHeight: '100vh' }}>
        <h2 style={{ padding: 10 }}>Quản lý đơn hàng</h2>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {renderToolbar()}
        </div>

        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

        {/* Orders Table */}
        <div>
          {/* Ant Design Table for Orders */}
          <OrderTableAntd
            orders={orders}
            loading={loading}
            getStatusLabel={getStatusLabel}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onViewDetail={handleViewDetail}
            onCancel={handleCancelOrder}
          />

          {/* Footer info / Pagination placeholder */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">Hiển thị {orders.length} đơn hàng</div>
          </div>
        </div>
      </div>

    </AdminPageLayout>
  );
};

export default OrdersPage;
