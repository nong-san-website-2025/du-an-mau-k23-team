import React from "react";

export default function OrderDetailRow({ 
  order, 
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  formatDate
}) {
  return (
    <tr>
      <td colSpan={8} style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb", padding: 0 }}>
        <div style={{ padding: 24 }}>
          <div className="row">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">Thông tin khách hàng</h6>
              <div className="mb-2"><strong>Tên:</strong> {order.customer_name || "N/A"}</div>
              <div className="mb-2"><strong>Số điện thoại:</strong> {order.customer_phone || "N/A"}</div>
              <div className="mb-2"><strong>Địa chỉ:</strong> {order.address || "N/A"}</div>
              <div className="mb-2"><strong>Ghi chú:</strong> {order.note || "Không có"}</div>
            </div>
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">Thông tin đơn hàng</h6>
              <div className="mb-2">
                <strong>Trạng thái:</strong> 
                <span className={`ms-2 ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="mb-2"><strong>Phương thức thanh toán:</strong> {order.payment_method || "N/A"}</div>
              <div className="mb-2"><strong>Tổng tiền:</strong> {formatCurrency(order.total_price)}</div>
              <div className="mb-2"><strong>Ngày tạo:</strong> {formatDate(order.created_at)}</div>
            </div>
          </div>
          
          {order.items && order.items.length > 0 && (
            <div className="mt-4">
              <h6 className="fw-bold mb-3">Sản phẩm trong đơn hàng</h6>
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
                    {order.items.map((item, index) => (
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
      </td>
    </tr>
  );
}