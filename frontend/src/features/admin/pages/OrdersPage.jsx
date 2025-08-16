import React, { useState, useEffect } from "react";
import adminApi from "../services/adminApi";
import "../styles/OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
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
  }, [statusFilter, searchTerm]);

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
      setSelectedOrder(orderDetail);
      setShowModal(true);
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Quản lý Đơn hàng</h4>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Lọc theo trạng thái:</label>
                  <select 
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Tìm kiếm:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tên khách hàng hoặc số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={loadOrders}
                  >
                    <i className="fas fa-refresh me-2"></i>
                    Làm mới
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Orders Table */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Khách hàng</th>
                      <th>Số điện thoại</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                          <p className="text-muted">Không có đơn hàng nào</p>
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.customer_name || "N/A"}</td>
                          <td>{order.customer_phone || "N/A"}</td>
                          <td>{formatCurrency(order.total_price)}</td>
                          <td>
                            <span className={getStatusBadgeClass(order.status)}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td>{formatDate(order.created_at)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetail(order.id)}
                                title="Xem chi tiết"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <div className="dropdown">
                                <button
                                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  title="Cập nhật trạng thái"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <ul className="dropdown-menu">
                                  {statusOptions.slice(1).map(option => (
                                    <li key={option.value}>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => handleStatusUpdate(order.id, option.value)}
                                        disabled={order.status === option.value}
                                      >
                                        {option.label}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết đơn hàng #{selectedOrder.id}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Thông tin khách hàng</h6>
                    <p><strong>Tên:</strong> {selectedOrder.customer_name || "N/A"}</p>
                    <p><strong>Số điện thoại:</strong> {selectedOrder.customer_phone || "N/A"}</p>
                    <p><strong>Địa chỉ:</strong> {selectedOrder.address || "N/A"}</p>
                    <p><strong>Ghi chú:</strong> {selectedOrder.note || "Không có"}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Thông tin đơn hàng</h6>
                    <p><strong>Trạng thái:</strong> 
                      <span className={`ms-2 ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </p>
                    <p><strong>Phương thức thanh toán:</strong> {selectedOrder.payment_method}</p>
                    <p><strong>Tổng tiền:</strong> {formatCurrency(selectedOrder.total_price)}</p>
                    <p><strong>Ngày tạo:</strong> {formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
                
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="mt-4">
                    <h6>Sản phẩm trong đơn hàng</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.product_name || "N/A"}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.price)}</td>
                              <td>{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal backdrop */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default OrdersPage;
