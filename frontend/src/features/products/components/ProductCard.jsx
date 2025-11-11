import React from "react";
import { Card, Button, Typography, Rate } from "antd";
import {
  ShoppingCartOutlined,
  FireOutlined, // 👈 MỚI: Thêm icon cho "đã bán"
} from "@ant-design/icons";
import NoImage from "../../../components/shared/NoImage";
import { useNavigate } from "react-router-dom";
import "../styles/ProductCard.css";
import { formatVND } from "./../../stores/components/StoreDetail/utils/utils";

const { Text } = Typography;

// 🎨 Màu cố định cho từng feature
const featureColors = {
  "Hữu cơ": "#52c41a",
  "Không thuốc trừ sâu": "#f5222d",
  "Tự nhiên": "#1890ff",
  Sạch: "#faad14",
};

export default function ProductCard({
  product,
  onAddToCart,
  showAddToCart = true,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const imageUrl = product.main_image?.image || null;

  const discountPercent =
    product.discount_percent ||
    (product.original_price && product.discounted_price
      ? Math.round(
          ((product.original_price - product.discounted_price) /
            product.original_price) *
            100
        )
      : 0);

  // Giả định số lượng đã bán (bạn có thể dùng sold_quantity hoặc total_sold)
  const quantitySold = product.sold || product.total_sold || 0;

  return (
    <Card
      hoverable
      onClick={handleClick}
      cover={
        <div style={{ position: "relative" }}>
          {imageUrl ? (
            <img
              alt={product.name}
              src={imageUrl}
              style={{
                height: 160,
                objectFit: "cover",
                width: "100%",
                borderRadius: "8px 8px 0 0",
              }}
            />
          ) : (
            <NoImage height={160} text="Không có hình ảnh" />
          )}

          {/* 🔰 Góc phải trên: badge giảm giá */}
          {discountPercent > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: "#d9f7be", // xanh lá nhạt
                color: "#389e0d", // xanh lá đậm
                fontWeight: 600,
                fontSize: 12,
                borderRadius: "0px 0px 0px 8px",
                padding: "2px 6px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              -{discountPercent}%
            </div>
          )}

          {/* 🔸 Góc trái dưới: feature badges */}
          {product.features && product.features.length > 0 && (
            <div
              className="product-features-overlay"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
              }}
            >
              {product.features.slice(0, 3).map((feature, index) => {
                const bgColor = featureColors[feature.name] || "#d9d9d9";
                return (
                  <span
                    key={index}
                    style={{
                      backgroundColor: bgColor,
                      borderRadius: "0px 0px 0px 0px",
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {feature.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      }
      className="product-card"
    >
      <Card.Meta
        title={
          <Text strong ellipsis={{ tooltip: product.name }}>
            {product.name}
          </Text>
        }
        description={
          <>
            {/* ⭐ Rating & Đã bán (PHẦN ĐƯỢC CẬP NHẬT) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8, // Khoảng cách giữa rating và đã bán
                flexWrap: "wrap", // Cho phép xuống dòng nếu không đủ chỗ
                minHeight: 18, // Đảm bảo chiều cao ổn định
              }}
            >
              <Rate
                disabled
                allowHalf
                defaultValue={product.rating || 0}
                style={{ fontSize: 10 }}
              />

              {/* Mới: Hiển thị số lượng đã bán */}
              {quantitySold > 0 && (
                <>

                  <Text
                    type="secondary"
                    style={{
                      fontSize: 10,
                      display: "flex",
                      alignItems: "end",
                      gap: 4,
                    }}
                  >
                    Đã bán {quantitySold}
                  </Text>
                </>
              )}
            </div>

            {/* 💰 Giá và nút giỏ hàng */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Giá + discount */}
              <div>
                <Text type="danger" strong style={{ fontSize: 14 }}>
                  {formatVND(product.discounted_price)}
                </Text>
                {product.original_price && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Text
                      delete
                      type="secondary"
                      style={{ fontSize: 12, opacity: 0.8 }}
                    >
                      {formatVND(product.original_price)}
                    </Text>
                  </div>
                )}
              </div>

              {/* 🛒 Nút thêm vào giỏ */}
              {showAddToCart &&
                (product.availability_status === "coming_soon" ? (
                  <Button
                    type="default"
                    size="small"
                    style={{
                      backgroundColor: "#fadb14",
                      color: "#000",
                      fontWeight: 600,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(product.id, 1, product);
                    }}
                  >
                    Đặt trước
                  </Button>
                ) : (
                  <Button
                    className="custom-btn"
                    shape="default"
                    icon={<ShoppingCartOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(e, product);
                    }}
                  />
                ))}
            </div>
          </>
        }
      />
    </Card>
  );
}