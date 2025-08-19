import React, { useState } from "react";
import OrderTableRow from "./OrderTableRow";
import OrderDetailRow from "./OrderDetailRow";

export default function OrderTable({
  orders,
  loading,
  statusFilter,
  searchTerm,
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  formatDate,
  onViewDetail,
}) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const handleExpand = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      // Load order details if not already loaded
      const order = orders.find(o => o.id === orderId);
      if (!order.items) {
        await onViewDetail(orderId);
      }
    }
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm || 
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.includes(searchTerm));
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
    <table className="table table-hover align-middle">
      <thead>
        <tr>
          <th>ID</th>
          <th>Khách hàng</th>
          <th>Số điện thoại</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        {filteredOrders.length === 0 ? (
          <tr>
            <td colSpan="6" className="text-center py-4">
              <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#6c757d", marginBottom: "1rem" }}></i>
              <p className="text-muted">Không có đơn hàng nào</p>
            </td>
          </tr>
        ) : (
          filteredOrders.map((order) => (
            <React.Fragment key={order.id}>
              <OrderTableRow
                order={order}
                expanded={expandedOrderId === order.id}
                onExpand={() => handleExpand(order.id)}
                getStatusBadgeClass={getStatusBadgeClass}
                getStatusLabel={getStatusLabel}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
              {expandedOrderId === order.id && (
                <OrderDetailRow 
                  order={order}
                  getStatusBadgeClass={getStatusBadgeClass}
                  getStatusLabel={getStatusLabel}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}
            </React.Fragment>
          ))
        )}
      </tbody>
    </table>
  );
}