import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";

const { Text } = Typography;

export default function ProductCard({ product, onAddToCart, onBuyNow }) {
  const navigate = useNavigate();

  const rawStatus = (product.availability_status || product.status || "")
    .toLowerCase()
    .trim();
  const stock = Number(product.stock) || 0;

  console.log("🐞 STATUS CHECK:", {
    name: product.name,
    stock: product.stock,
    availability_status: product.availability_status,
    status: product.status,
  });
  // ✅ Nhận dạng trạng thái "coming soon"
  const isComingSoon =
    rawStatus.includes("coming_soon") ||
    rawStatus.includes("comingsoon") ||
    rawStatus.includes("sắp") ||
    rawStatus.includes("sap");

  // ✅ Hết hàng chỉ khi không phải "coming soon"
  const isOutOfStock = !isComingSoon && stock <= 0;

  const handleDetailClick = () => navigate(`/product/${product.id}`);

  return (
    <div
      className="product-card"
      style={{
        textAlign: "center",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        background: "#fff",
      }}
    >
      <img
        src={
          product.image?.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image || "/default-product.png"
        }
        alt={product.name}
        onClick={handleDetailClick}
        style={{
          width: "100%",
          height: 200,
          objectFit: "cover",
          borderRadius: 8,
          cursor: "pointer",
        }}
      />

      <h3
        onClick={handleDetailClick}
        style={{
          margin: "12px 0 4px 0",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          lineHeight: 1.3,
        }}
      >
        {product.name}
      </h3>

      <Text strong style={{ display: "block", marginBottom: 6 }}>
        {Number(product.discounted_price ?? product.price).toLocaleString(
          "vi-VN"
        )}{" "}
        ₫
      </Text>

      {/* ✅ Xử lý giao diện nút theo trạng thái */}
      {isComingSoon ? (
        <>
          <Button type="primary" danger onClick={handleDetailClick}>
            Đặt hàng
          </Button>
          <Text type="warning" style={{ display: "block", marginTop: 4 }}>
            Sắp có hàng
          </Text>
        </>
      ) : isOutOfStock ? (
        <Button disabled size="middle">
          Sản phẩm đã hết hàng
        </Button>
      ) : (
        <>
          <Button
            icon={<ShoppingCartOutlined />}
            onClick={() => onAddToCart(product)}
            style={{ marginRight: 8 }}
          >
            Thêm giỏ hàng
          </Button>
          <Button type="primary" danger onClick={() => onBuyNow(product)}>
            Mua ngay
          </Button>
        </>
      )}
    </div>
  );
}
