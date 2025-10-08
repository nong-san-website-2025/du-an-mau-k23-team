import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";

const { Text } = Typography;

export default function ProductCard({ product, onAddToCart, onBuyNow }) {
  const navigate = useNavigate();

  const stock = Number(product.stock) || 0;
  const status = (product.status || "").toLowerCase().trim();

  // ✅ Logic xác định trạng thái sản phẩm
  const isComingSoon = product.availability_status === "coming_soon";
  const availableQuantity = product.available_quantity ?? 0;
  const isOutOfStock = stock === 0 && !isComingSoon;

  const handleDetailClick = () => navigate(`/product/${product.id}`);

  return (
    <div className="product-card" style={{ textAlign: "center", padding: 12 }}>
      <img
        src={
          product.image?.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image || "/default-product.png"
        }
        alt={product.name}
        className="product-image"
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
        style={{
          margin: "12px 0 4px 0",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={handleDetailClick}
      >
        {product.name}
      </h3>

      <Text style={{ display: "block", marginBottom: 8 }}>
        {Number(product.discounted_price ?? product.price).toLocaleString(
          "vi-VN"
        )}{" "}
        ₫
      </Text>

      {/* ✅ Hiển thị nút phù hợp */}
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
          Hết hàng
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
