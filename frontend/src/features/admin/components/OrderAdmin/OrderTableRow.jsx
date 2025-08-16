import React from "react";
import "../../styles/OrderTableRow.css";

export default function OrderTableRow({ 
  order, 
  checked, 
  onCheck, 
  onExpand, 
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  formatDate,
  onStatusUpdate,
  expanded
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
    <tr
      className={`order-row ${expanded ? "expanded" : ""}`}
      onClick={onExpand}
      style={{ cursor: "pointer" }}
    >
      <td className="border-0 py-3">
        <input
          type="checkbox"
          className="form-check-input"
          checked={checked}
          onClick={e => e.stopPropagation()}
          onChange={onCheck}
        />
      </td>
      <td className="border-0 py-3">
        <span className="fw-bold">#{order.id}</span>
      </td>
      <td className="border-0 py-3">
        <div>
          <h6 className="mb-0 fw-normal" style={{ fontSize: 14 }}>
            {order.customer_name || "N/A"}
          </h6>
        </div>
      </td>
      <td className="border-0 py-3">
        {order.customer_phone || "N/A"}
      </td>
      <td className="border-0 py-3 fw-bold">
        {formatCurrency(order.total_price)}
      </td>
      <td className="border-0 py-3">
        <span className={getStatusBadgeClass(order.status)}>
          {getStatusLabel(order.status)}
        </span>
      </td>
      <td className="border-0 py-3">
        {formatDate(order.created_at)}
      </td>
      <td className="border-0 py-3">
        <div className="d-flex gap-2" onClick={e => e.stopPropagation()}>
          <div className="dropdown">
            <button
              className="btn btn-sm btn-outline-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              title="Cập nhật trạng thái"
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
      </td>
    </tr>
  );
}