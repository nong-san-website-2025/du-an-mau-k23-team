// src/features/stores/components/StoreDetail/ProductCard.jsx
import React from "react";
import { Card, Typography, Button, Rate } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../cart/services/CartContext"; // ✅ điều chỉnh đường dẫn nếu cần
import { formatVND } from "./utils/utils";

const { Text } = Typography;

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const getImageUrl = () => {
    if (!product.image) return "https://via.placeholder.com/400x300?text=No+Image";
    if (product.image.startsWith("http")) return product.image;
    if (product.image.startsWith("/")) return `http://localhost:8000${product.image}`;
    return `http://localhost:8000/media/${product.image}`;
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Ngăn không cho click vào card
    try {
      await addToCart(
        product.id,
        1,
        {
          id: product.id,
          name: product.name,
          price: product.discounted_price ?? product.price,
          image: getImageUrl(),
        },
        () => {},
        () => {}
      );
    } catch (err) {
      console.error("Thêm vào giỏ thất bại:", err);
    }
  };

  return (
    <Card
      hoverable
      cover={
        <img
          alt={product.name}
          src={getImageUrl()}
          style={{ height: 160, objectFit: "cover" }}
        />
      }
      onClick={() => navigate(`/products/${product.id}`)}
      bodyStyle={{ padding: "12px" }}
    >
      <Card.Meta
        title={
          <Text strong ellipsis={{ tooltip: product.name }}>
            {product.name}
          </Text>
        }
        description={
          <>
            {/* Đánh giá (nếu có) */}
            {product.rating !== undefined && (
              <div style={{ marginBottom: 8 }}>
                <Rate disabled allowHalf value={product.rating} style={{ fontSize: 12 }} />
                <Text type="secondary" style={{ marginLeft: 4, fontSize: 12 }}>
                  ({product.review_count || 0})
                </Text>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <div>
                <Text type="danger" style={{ fontSize: 16 }}>
                  {formatVND(product.discounted_price ?? product.price)} đ
                </Text>
                {product.price && product.discounted_price && product.price > product.discounted_price && (
                  <div
                    style={{
                      marginTop: 2,
                      color: "rgba(0, 0, 0, 0.45)",
                      opacity: 0.7,
                    }}
                  >
                    <span style={{ textDecoration: "line-through" }}>
                      {formatVND(product.price, 10)}
                    </span>
                  </div>
                )}
              </div>

              <Button
                size="small"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                style={{ borderRadius: 4 }}
              />
            </div>

            {/* Hiển thị tồn kho (tuỳ chọn) */}
            {product.stock !== undefined && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                Còn: {product.stock} {product.unit || "sp"}
              </Text>
            )}
          </>
        }
      />
    </Card>
  );
};

export default ProductCard;