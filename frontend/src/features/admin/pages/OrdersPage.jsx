import React, { useState, useEffect } from "react";
import { Search, Import, FileUp, HelpCircle, RefreshCw } from "lucide-react";
import adminApi from "../services/adminApi";
import AdminPageLayout from "../components/AdminPageLayout";
import AdminHeader from "../components/AdminHeader";
import OrderFilterSidebar from "../components/OrderAdmin/OrderFilterSidebar";
import OrderTable from "../components/OrderAdmin/OrderTable";

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
      setOrders(data);
      setError("");
    } catch (err) {
      setError("Không thể tải danh sách đơn hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load orders on component mount and when filters change
  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      // Reload orders to get updated data
      await loadOrders();
      alert("Cập nhật trạng thái thành công!");
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái: " + err.message);
    }
  };

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

  // Render action buttons
  const renderActionButtons = () => {
    if (checkedIds.length > 0) {
      return (
        <button
          className="btn btn-danger border"
          style={{ fontWeight: "500" }}
          title="Xoá đơn hàng đã chọn"
          onClick={() => {
            if (
              window.confirm(
                `Bạn có chắc muốn xoá ${checkedIds.length} đơn hàng đã chọn?`
              )
            ) {
              // TODO: Gọi API xoá nhiều đơn hàng với checkedIds
              alert("Đã gọi xoá các đơn hàng: " + checkedIds.join(", "));
            }
          }}
        >
          <i
            className="bi bi-trash"
            style={{ fontSize: 16, marginRight: 6 }}
          ></i>
          Xoá ({checkedIds.length})
        </button>
      );
    }

    return (
      <>
        <button className="btn btn-light border" style={{ fontWeight: "500", color: "#48474b" }}>
          <Import size={16} /> &ensp; Nhập file
        </button>
        <button className="btn btn-light border" style={{ fontWeight: "500", color: "#48474b" }}>
          <FileUp size={16} /> &ensp; Xuất file
        </button>
        <button className="btn btn-light border" style={{ fontWeight: "500", color: "#48474b" }}>
          <HelpCircle size={16} />
        </button>
        <button
          className="btn btn-outline-secondary border"
          style={{ fontWeight: "500", color: "#48474b" }}
          onClick={loadOrders}
        >
          <RefreshCw size={16} /> &ensp; Làm mới
        </button>
      </>
    );
  };

  return (
    <AdminPageLayout
      header={<AdminHeader />}
      sidebar={
        <OrderFilterSidebar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusOptions={statusOptions}
        />
      }
    >
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        {/* Header Section */}
        <div className="p-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-0 gap-2 flex-wrap">
            {/* Thanh tìm kiếm */}
            <div style={{ flex: 1 }}>
              <div className="input-group" style={{ width: 420 }}>
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm kiếm đơn hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Action buttons */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 && (
                <span
                  className="badge bg-primary"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Đã chọn: {checkedIds.length}
                </span>
              )}
              {renderActionButtons()}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        )}

        {/* Orders Table */}
        <div className="p-1">
          <OrderTable
            orders={orders}
            loading={loading}
            statusFilter={statusFilter}
            searchTerm={searchTerm}
            getStatusBadgeClass={getStatusBadgeClass}
            getStatusLabel={getStatusLabel}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            checkedIds={checkedIds}
            setCheckedIds={setCheckedIds}
            onStatusUpdate={handleStatusUpdate}
            onViewDetail={handleViewDetail}
          />

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              Hiển thị {orders.length} đơn hàng
            </div>
            {/* TODO: Pagination component riêng */}
          </div>
        </div>
      </div>

    </AdminPageLayout>
  );
};

export default OrdersPage;
