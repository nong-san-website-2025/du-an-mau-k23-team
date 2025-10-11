import React from "react";
import { Button, Space, Typography, Rate, Tag } from "antd";
import {
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ProductInfo = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  adding,
}) => {
  // ✅ Ưu tiên đọc field availability_status từ backend
  const status = (product.availability_status || product.status || "")
    .toLowerCase()
    .trim();

  const isComingSoon =
    status === "coming_soon" ||
    status === "sắp có" ||
    status === "sapco" ||
    status === "sap co" ||
    status === "comingsoon";

  const isOutOfStock = !isComingSoon && product.stock <= 0;

  // 🔹 Lấy thông tin thời gian & sản lượng dự kiến từ backend
  const availableFrom =
    product.season_start || product.available_from || product.start_date;
  const availableTo =
    product.season_end || product.available_to || product.end_date;
  const estimatedQuantity =
    product.estimated_quantity ||
    product.expected_quantity ||
    product.estimated ||
    0;

  return (
    <div>
      <Title level={2}>{product.name}</Title>

      <Space size="small" style={{ marginBottom: 16 }}>
        <Rate disabled value={Math.round(product.rating || 0)} />
        <Text type="secondary">
          {Number(product.rating).toFixed(1)} ★ ({product.review_count} đánh
          giá)
        </Text>
      </Space>

      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ color: "#52c41a", margin: 0 }}>
          {product.discount > 0
            ? `${Math.round(
                product.price * (1 - product.discount / 100)
              ).toLocaleString("vi-VN")} VNĐ`
            : `${Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ`}
        </Title>
        {product.discount > 0 && (
          <Text delete type="secondary" style={{ marginLeft: 8 }}>
            {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
          </Text>
        )}
        <Text type="secondary" style={{ marginLeft: 8 }}>
          / {product.unit}
        </Text>
      </div>

      {/* Chỉ hiển thị phần số lượng nếu không phải sắp có */}
      {!isComingSoon && (
        <div style={{ marginBottom: 24 }}>
          <Text strong>Số lượng:</Text>
          <Space size="middle" style={{ marginLeft: 12 }}>
            <Button
              icon={<MinusOutlined />}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            />
            <Text style={{ width: 40, textAlign: "center" }}>{quantity}</Text>
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                onQuantityChange(
                  quantity < product.stock ? quantity + 1 : quantity
                )
              }
            />
          </Space>
          {product.stock > 0 && (
            <>
              <Text type="success" style={{ marginLeft: 12 }}>
                Còn {product.stock} sản phẩm
              </Text>

              {product.sold_quantity > 0 && (
                <Text type="secondary" style={{ marginLeft: 12 }}>
                  Đã bán {product.sold_quantity.toLocaleString("vi-VN")} sản
                  phẩm
                </Text>
              )}
            </>
          )}
        </div>
      )}

      {/* 🔹 Thông tin “Sắp có” */}
      {isComingSoon && (
        <div
          style={{
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            borderRadius: 6,
            padding: 12,
            marginBottom: 20,
          }}
        >
          <Space direction="vertical" size={4}>
            <Tag icon={<ClockCircleOutlined />} color="orange">
              Sản phẩm sắp có
            </Tag>
            <Text>
              <strong>Thời gian dự kiến có hàng:</strong>{" "}
              {availableFrom
                ? `${new Date(availableFrom).toLocaleDateString("vi-VN")} ${
                    availableTo
                      ? `→ ${new Date(availableTo).toLocaleDateString("vi-VN")}`
                      : ""
                  }`
                : "Đang cập nhật"}
            </Text>
            <Text>
              <strong>Sản lượng ước tính:</strong>{" "}
              {estimatedQuantity > 0
                ? `${estimatedQuantity.toLocaleString("vi-VN")} sản phẩm`
                : "Chưa xác định"}
            </Text>
            {(product.ordered_quantity > 0 || product.sold_quantity > 0) && (
              <Text>
                <strong>Đã có:</strong>{" "}
                {(
                  product.ordered_quantity || product.sold_quantity
                ).toLocaleString("vi-VN")}{" "}
                lượt đặt hàng
              </Text>
            )}
          </Space>
        </div>
      )}

      {/* Hiển thị hành động chính */}
      <Space size="middle">
        {isComingSoon ? (
          <>
            {product.stock <= 0 ? (
              <>
                <Button
                  type="primary"
                  size="large"
                  danger
                  onClick={() => onBuyNow(product)}
                >
                  Đặt trước
                </Button>
                <Text type="warning" style={{ marginLeft: 12 }}>
                  Sắp có từ {product.season_start || "?"} đến{" "}
                  {product.season_end || "?"} ({product.estimated_quantity || 0}{" "}
                  sản phẩm)
                </Text>
              </>
            ) : (
              <Button disabled size="large">
                Đang có hàng (chưa mở đặt trước)
              </Button>
            )}
          </>
        ) : isOutOfStock ? (
          <Button disabled size="large">
            Hết hàng
          </Button>
        ) : (
          <>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              loading={adding}
              onClick={onAddToCart}
            >
              Thêm vào giỏ
            </Button>
            <Button type="primary" size="large" danger onClick={onBuyNow}>
              Mua ngay
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};

export default ProductInfo;
