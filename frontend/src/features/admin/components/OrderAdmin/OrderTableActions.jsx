import React from "react";

export default function OrderTableActions({ 
  order, 
  onViewDetail, 
  onStatusUpdate 
}) {
  const statusOptions = [
    { value: "pending", label: "Chờ xử lý" },
    { value: "processing", label: "Đang xử lý" },
    { value: "shipped", label: "Đã giao vận" },
    { value: "delivered", label: "Đã giao hàng" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "refunded", label: "Đã hoàn tiền" }
  ];

  return (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-outline-primary"
        title="Xem chi tiết"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={() => onViewDetail(order.id)}
      >
        <i className="bi bi-eye"></i>
      </button>
      
      <div className="dropdown">
        <button
          className="btn btn-sm btn-outline-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          title="Cập nhật trạng thái"
          style={{ width: "32px", height: "32px", padding: "0" }}
        >
          <i className="bi bi-pencil"></i>
        </button>
        <ul className="dropdown-menu">
          {statusOptions.map(option => (
            <li key={option.value}>
              <button
                className="dropdown-item"
                onClick={() => onStatusUpdate(order.id, option.value)}
                disabled={order.status === option.value}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}