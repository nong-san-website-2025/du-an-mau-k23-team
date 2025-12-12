import React from "react";

export default function OrderDetailRow({ 
  order, 
  getStatusBadgeClass,
  getStatusLabel,
  formatCurrency,
  formatDate,
  onCancel
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
              <div className="mb-2"><strong>Shop:</strong> {order.shop_name || 'N/A'} {order.shop_phone ? ` - ${order.shop_phone}` : ''}</div>
              {(order.status !== 'cancelled' && order.status !== 'success') && (
                <div className="mt-2">
                  <span className="me-2 text-muted">Thao tác:</span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Sẽ được xác nhận bằng Popconfirm ở wrapper
                      onCancel?.(order);
                    }}
                  >
                    Hủy đơn hàng
                  </button>
                </div>
              )}
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
                      <th>Danh mục</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Phí sàn</th>
                      <th>Doanh thu NCC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => {
                      const itemTotal = (item.price || 0) * (item.quantity || 0);
                      const platformCommission = (item.platform_commission || 0) || (itemTotal * (item.commission_rate || 0));
                      const sellerAmount = (item.seller_amount || 0) || (itemTotal - platformCommission);
                      
                      return (
                        <tr key={index}>
                          <td>{item.product_name || "N/A"}</td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {item.category_name || "N/A"}
                            </span>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td className="fw-bold">{formatCurrency(itemTotal)}</td>
                          <td className="text-danger fw-semibold">
                            {formatCurrency(platformCommission)}
                            <br/>
                            <small className="text-muted">({((item.commission_rate || 0) * 100).toFixed(1)}%)</small>
                          </td>
                          <td className="text-success fw-semibold">
                            {formatCurrency(sellerAmount)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Tổng cộng */}
                    <tr style={{ borderTop: "2px solid #dee2e6", fontWeight: "bold" }}>
                      <td colSpan="4" className="text-end">Tổng cộng:</td>
                      <td>{formatCurrency(order.total_price)}</td>
                      <td className="text-danger">
                        {formatCurrency(
                          (order.items || []).reduce((sum, item) => {
                            const itemTotal = (item.price || 0) * (item.quantity || 0);
                            return sum + ((item.platform_commission || 0) || (itemTotal * (item.commission_rate || 0)));
                          }, 0)
                        )}
                      </td>
                      <td className="text-success">
                        {formatCurrency(
                          (order.items || []).reduce((sum, item) => {
                            const itemTotal = (item.price || 0) * (item.quantity || 0);
                            const platformCommission = (item.platform_commission || 0) || (itemTotal * (item.commission_rate || 0));
                            return sum + ((item.seller_amount || 0) || (itemTotal - platformCommission));
                          }, 0)
                        )}
                      </td>
                    </tr>
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