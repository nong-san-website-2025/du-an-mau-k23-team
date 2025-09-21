// src/features/cart/components/ProductList.jsx
import React from "react";
import { Typography, Button, Empty } from "antd";

const { Text } = Typography;

const ProductList = ({ cartItems, onEditCart }) => {
  const selectedItems = cartItems.filter((item) => item.selected);

  if (selectedItems.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <Empty
          description={<Text type="danger">Không có sản phẩm nào được chọn</Text>}
        />
        <Button type="primary" style={{ marginTop: 10 }} onClick={onEditCart}>
          Quay lại giỏ hàng
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: 12,
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 18 }}>Sản phẩm thanh toán</span>
        <Button type="default" size="small" onClick={onEditCart}>
          Chỉnh sửa giỏ hàng
        </Button>
      </div>

      {/* Bảng sản phẩm */}
      <div>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            padding: "10px 0",
            borderBottom: "2px solid #f0f0f0",
            fontWeight: "bold",
          }}
        >
          <div style={{ width: "60px" }}></div>
          <div style={{ flex: 2 }}>Tên sản phẩm</div>
          <div style={{ flex: 1, textAlign: "right" }}>Đơn giá</div>
          <div style={{ flex: 1, textAlign: "center" }}>Số lượng</div>
          <div style={{ flex: 1, textAlign: "right" }}>Thành tiền</div>
        </div>

        {/* Product rows */}
        {selectedItems.map((item) => {
          const product = item.product || {};
          const price = product.price || 0;
          const total = price * item.quantity;

          return (
            <div
              key={product.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {/* Ảnh sản phẩm */}
              <div style={{ width: "60px", textAlign: "center" }}>
                <img
                  src={product.image || "/placeholder.png"}
                  alt={product.name || "Sản phẩm"}
                  style={{
                    width: 50,
                    height: 50,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* Tên sản phẩm */}
              <div style={{ flex: 2, paddingLeft: 10 }}>
                <Text strong>{product.name || `SP #${product.id}`}</Text>
              </div>

              {/* Đơn giá */}
              <div style={{ flex: 1, textAlign: "right", color: "#555" }}>
                {price.toLocaleString()}đ
              </div>

              {/* Số lượng */}
              <div style={{ flex: 1, textAlign: "center", color: "#555" }}>
                {item.quantity}
              </div>

              {/* Thành tiền */}
              <div style={{ flex: 1, textAlign: "right", color: "#2e7d32", fontWeight: "bold" }}>
                {total.toLocaleString()}đ
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
