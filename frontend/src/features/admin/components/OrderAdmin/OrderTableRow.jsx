import React from "react";
import "../../styles/OrderTableRow.css";

export default function OrderTableRow({ 
  order, 
  onExpand, 
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  formatDate,
  expanded,
  onCancel
}) {


  return (
    <tr
      className={`order-row ${expanded ? "expanded" : ""}`}
      onClick={onExpand}
      style={{ cursor: "pointer" }}
    >
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
        <div className="d-flex flex-column">
          <span className="fw-semibold" style={{fontSize: 13}}>{order.shop_name || 'N/A'}</span>
          <small className="text-muted">{order.shop_phone || ''}</small>
        </div>
      </td>
    </tr>
  );
}