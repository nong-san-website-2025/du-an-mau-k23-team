import React, { useState, useEffect } from "react";
import {
  Button,
  Space,
  Typography,
  Rate,
  Tag,
  InputNumber,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

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

  const [guestPreorderQty, setGuestPreorderQty] = useState(0);

  // ✅ Cập nhật guestPreorderQty từ localStorage
  const updateGuestPreorderQty = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("preorders") || "[]");
      const entry = stored.find((p) => String(p.id) === String(product.id));
      setGuestPreorderQty(entry ? Number(entry.quantity) : 0);
    } catch (e) {
      setGuestPreorderQty(0);
    }
  };

  useEffect(() => {
    updateGuestPreorderQty();
    window.addEventListener("storage", updateGuestPreorderQty);
    return () => window.removeEventListener("storage", updateGuestPreorderQty);
  }, [product.id]);

  const status = (product.availability_status || product.status || "")
    .toLowerCase()
    .trim();
  const rawStatus = (product.availability_status || "").toLowerCase().trim();
  const stock = Number(product.stock) || 0;

  const isComingSoon =
    rawStatus.includes("coming_soon") ||
    rawStatus.includes("comingsoon") ||
    rawStatus.includes("sắp") ||
    rawStatus.includes("sap");

  const isOutOfStock = !isComingSoon && stock <= 0;

  // 🔹 Tổng số đã đặt trước = guestPreorderQty + backend nếu muốn
  const totalPreordered = guestPreorderQty; // Chỉ tính guest, backend bỏ đi nếu không cần

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
            ? `${Math.round(product.price * (1 - product.discount / 100)).toLocaleString("vi-VN")} VNĐ`
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

      {/* 🔹 Nút đặt trước */}
      {isComingSoon && (
        <Space size="middle" style={{ marginTop: 16 }}>
          <InputNumber
            min={1}
            max={estimatedQuantity - totalPreordered}
            value={quantity}
            onChange={(v) => {
              if (v > estimatedQuantity - totalPreordered) {
                message.warning("⚠️ Không thể đặt quá số lượng ước tính!");
                v = estimatedQuantity - totalPreordered;
              }
              onQuantityChange(v);
            }}
            style={{ width: 80 }}
          />

          <Button
            type="primary"
            size="large"
            danger
            onClick={() => {
              const qty = Number(quantity) || 1;
              if (qty + totalPreordered > estimatedQuantity) {
                message.warning("⚠️ Không thể đặt vượt quá số lượng ước tính!");
                return;
              }

              const preorderItem = {
                id: product.id,
                name: product.name,
                image:
                  product.image && product.image.startsWith("/")
                    ? `http://localhost:8000${product.image}`
                    : product.image,
                price: Number(product.discounted_price ?? product.price) || 0,
                quantity: qty,
                date: new Date().toISOString(),
              };

              const stored = JSON.parse(
                localStorage.getItem("preorders") || "[]"
              );
              const exists = stored.find(
                (p) => String(p.id) === String(product.id)
              );
              if (exists) {
                exists.quantity += qty;
                exists.date = new Date().toISOString();
              } else {
                stored.push(preorderItem);
              }
              localStorage.setItem("preorders", JSON.stringify(stored));
              window.dispatchEvent(new Event("storage")); // cập nhật live

              message.success("Đặt trước thành công! 🎉");
              navigate("/preorders", { state: { product: preorderItem } });
            }}
          >
            Đặt trước
          </Button>
        </Space>
      )}
    </div>
  );
};

export default ProductInfo;
