import React, { useEffect, useState } from "react";
import { api } from "../../login_register/services/AuthContext";

const statusMap = {
  pending: "Chờ thanh toán",
  completed: "Đã thanh toán",
  cancelled: "Đã huỷ",
};

const OrderTab = ({ status }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`orders/?status=${status}`)
      .then((res) => {
        const sortedOrders = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sortedOrders);
        setLoading(false);
      })
      .catch((err) => {
        setError("Không thể tải đơn hàng");
        setLoading(false);
      });
  }, [status]);

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!orders.length)
    return (
      <div style={{ padding: 24 }}>Không có đơn hàng {statusMap[status]}</div>
    );

  return (
    <div style={{ padding: 24 }}>
      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            marginBottom: 20,
            padding: 20,
            backgroundColor: "#fafafa",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              Mã đơn: #{order.id}
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>
              {new Date(order.created_at).toLocaleString("vi-VN")}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px 24px",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              {order.customer_name && (
                <div>
                  <strong>Người nhận:</strong> {order.customer_name}
                </div>
              )}
              {order.customer_phone && (
                <div>
                  <strong>SĐT:</strong> {order.customer_phone}
                </div>
              )}
              {order.address && (
                <div>
                  <strong>Địa chỉ:</strong> {order.address}
                </div>
              )}
              {order.payment_method && (
                <div>
                  <strong>Thanh toán:</strong> {order.payment_method}
                </div>
              )}
              {order.note && (
                <div>
                  <strong>Ghi chú:</strong> {order.note}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Sản phẩm:</strong>
            <div style={{ marginTop: 8 }}>
              {order.items &&
                order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{ flex: 1, display: "flex", alignItems: "center" }}
                    >
                      {item.product_image && (
                        <img
                          src={`http://localhost:8000/media/${item.product_image}`}
                          alt={item.product_name || item.product}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            marginRight: 12,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: "bold" }}>
                          {item.product_name || item.product}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {Number(item.price).toLocaleString()}đ x{" "}
                          {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: "bold", color: "#27ae60" }}>
                      {(
                        Number(item.price) * Number(item.quantity)
                      ).toLocaleString()}
                      đ
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              paddingTop: 12,
              borderTop: "2px solid #27ae60",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            Tổng tiền:{" "}
            <span style={{ color: "#27ae60" }}>
              {Number(order.total_price).toLocaleString()}đ
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderTab;
