import React from "react";
import { Button, Space, Typography, Rate, Tag, InputNumber } from "antd";
import {
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { formatVND } from "../../stores/components/StoreDetail/utils/utils";

import "../styles/ProductDetailPage.css";

const { Title, Text } = Typography;

const ProductInfo = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  adding,
}) => {
  const navigate = useNavigate();

  const handlePreOrder = () => {
    navigate("/preorder", {
      state: {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          available_from: product.available_from,
        },
      },
    });
  };

  const rawStatus = (product.availability_status || "").toLowerCase().trim();
  const stock = Number(product.stock) || 0;

  // ✅ Xác định “Sắp có”
  const isComingSoon =
    rawStatus.includes("coming_soon") ||
    rawStatus.includes("comingsoon") ||
    rawStatus.includes("sắp") ||
    rawStatus.includes("sap");

  // ✅ Nếu là “sắp có” thì KHÔNG bao giờ bị coi là hết hàng
  const isOutOfStock = !isComingSoon && stock <= 0;

  // Guest preorders (localStorage) - tổng số lượng guest đã lưu cho sản phẩm này
  let guestPreorderQty = 0;
  try {
    const stored = JSON.parse(localStorage.getItem("preorders") || "[]");
    const entry = stored.find((p) => String(p.id) === String(product.id));
    if (entry) guestPreorderQty = Number(entry.quantity || 0);
  } catch (e) {
    guestPreorderQty = 0;
  }

  const totalPreordered =
    Number(product.preordered_quantity || product.total_preordered || 0) +
    (guestPreorderQty || 0);

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
          {Number(product.rating).toFixed(1)} ★ ({product.review_count} Đánh
          Giá) |
        </Text>
        <Text className="d-flex gap-1">
          <Text type="secondary">Đã bán </Text>
          <div>{Number(product.sold_count)}</div>
        </Text>
      </Space>

      {/* 💰 Giá sản phẩm (hiển thị song song giá giảm & giá gốc) */}
      <div style={{ marginBottom: 16 }}>
        {product.discount_percent > 0 ? (
          <>
            <Title
              level={2}
              style={{
                color: "#52c41a",
                margin: 0,
                display: "inline-block",
                fontWeight: "700",
              }}
            >
              {formatVND(product.discounted_price)}
            </Title>
            <Text
              delete
              type="secondary"
              style={{ marginLeft: 8, fontSize: 16 }}
            >
              {formatVND(product.original_price)} đ
            </Text>
            <Tag color="red" style={{ marginLeft: 8 }}>
              -{product.discount_percent}%
            </Tag>
          </>
        ) : (
          <Title level={3} style={{ color: "#52c41a", margin: 0 }}>
            {Math.round(product.original_price).toLocaleString("vi-VN")} ₫
          </Title>
        )}
        <Text type="secondary" style={{ marginLeft: 8 }}>
          / {product.unit}
        </Text>
      </div>

      {/* 🔹 Số lượng hiện tại và số lượng đã đặt */}
      {!isComingSoon && (
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Text strong>Số lượng:</Text>
            <div style={{ display: "flex", padding: "0x 10px" }}>
              <Button
                className="btn-quantity"
                icon={<MinusOutlined />}
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              />
              <InputNumber
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(value) => {
                  if (value !== null && !isNaN(value)) {
                    const clamped = Math.max(1, Math.min(value, product.stock));
                    onQuantityChange(clamped);
                  }
                }}
                style={{ width: 100 }}
                controls={false}
                className="custom-input-number"
              />
              <Button
                className="btn-quantity"
                icon={<PlusOutlined />}
                onClick={() =>
                  onQuantityChange(
                    quantity < product.stock ? quantity + 1 : quantity
                  )
                }
                disabled={quantity >= product.stock}
              />
            </div>
            {/* 🔸 Còn hàng */}
            {product.stock > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text type="success">
                  Còn {product.stock.toLocaleString("vi-VN")} sản phẩm
                </Text>
              </div>
            )}
          </div>
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

            <Text>
              <strong>Đã đặt trước:</strong>{" "}
              {Number(totalPreordered || 0).toLocaleString("vi-VN")} sản phẩm
            </Text>
          </Space>
        </div>
      )}

      {/* 🔹 Các nút hành động */}
      <Space size="middle">
        {/* 🔹 Ưu tiên hiển thị sản phẩm sắp có */}
        {isComingSoon ? (
          <>
            <Button
              type="primary"
              size="large"
              danger
              onClick={() => onBuyNow(product)}
            >
              Đặt trước
            </Button>
            {/* <Text type="warning" style={{ display: "block", marginTop: 4 }}>
              Sản phẩm sắp có
            </Text> */}
          </>
        ) : isOutOfStock ? (
          <>
            <Button type="primary" size="large" danger onClick={onBuyNow}>
              Đặt trước
            </Button>
            <div style={{ display: "block", marginTop: 8 }}>
              <Text type="secondary">Hết hàng — bạn có thể đặt trước</Text>
              <div>
                <Text style={{ marginLeft: 8 }}>
                  <strong>Đã đặt trước:</strong>{" "}
                  {Number(totalPreordered || 0).toLocaleString("vi-VN")} sản
                  phẩm
                </Text>
              </div>
            </div>
          </>
        ) : (
          <>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={onAddToCart}
            >
              Thêm vào giỏ
            </Button>
            <Button className="btn-classic" type="primary" size="large"  onClick={onBuyNow}>
              Mua ngay
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};

export default ProductInfo;
