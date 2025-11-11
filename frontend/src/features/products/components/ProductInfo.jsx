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
import axios from "axios";
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
  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:8000/api/orders/preorders/";

  const [backendPreorderQty, setBackendPreorderQty] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🟢 Lấy tổng số lượng đặt trước từ backend
  const fetchBackendPreorderQty = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sameProduct = res.data.filter(
        (item) => String(item.product) === String(product.id)
      );
      const total = sameProduct.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setBackendPreorderQty(total);
    } catch (err) {
      console.error("Không thể lấy dữ liệu đặt trước:", err);
    }
  };

  useEffect(() => {
    if (token && product?.id) fetchBackendPreorderQty();
  }, [product.id]);

  const rawStatus = (product.availability_status || "").toLowerCase().trim();
  const stock = Number(product.stock) || 0;

  const isComingSoon =
    rawStatus.includes("coming_soon") ||
    rawStatus.includes("comingsoon") ||
    rawStatus.includes("sắp") ||
    rawStatus.includes("sap");

  const isOutOfStock = !isComingSoon && stock <= 0;

  const availableFrom =
    product.season_start || product.available_from || product.start_date;
  const availableTo =
    product.season_end || product.available_to || product.end_date;
  const estimatedQuantity =
    product.estimated_quantity ||
    product.expected_quantity ||
    product.estimated ||
    0;

  const totalPreordered = backendPreorderQty;

  // 🟥 Hàm đặt trước
  const handlePreorder = async () => {
    const qty = Number(quantity) || 1;

    if (qty + totalPreordered > estimatedQuantity) {
      message.warning("⚠️ Không thể đặt vượt quá số lượng ước tính!");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        API_URL,
        { product: product.id, quantity: qty },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      message.success("Đặt trước thành công! 🎉");
      fetchBackendPreorderQty();
      navigate("/preorders");
    } catch (err) {
      console.error("Lỗi đặt trước:", err.response?.data || err.message);
      if (err.response?.status === 401)
        message.error("Vui lòng đăng nhập để đặt trước!");
      else if (err.response?.status === 400)
        message.error("Bạn đã đặt sản phẩm này rồi!");
      else message.error("Không thể đặt trước sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

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

      {/* 💰 Giá sản phẩm */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ color: "#52c41a", margin: 0 }}>
          {product.discount > 0
            ? `${Math.round(
                product.price * (1 - product.discount / 100)
              ).toLocaleString("vi-VN")} VNĐ`
            : `${Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ`}
        </Title>

        {product.discount > 0 && (
          <>
            <Text delete type="secondary" style={{ marginLeft: 8 }}>
              {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
            </Text>
            <Tag color="red" style={{ marginLeft: 8 }}>
              -{product.discount_percent || product.discount}%
            </Tag>
          </>
        )}

        <Text type="secondary" style={{ marginLeft: 8 }}>
          / {product.unit}
        </Text>
      </div>

      {/* 🔹 Số lượng */}
      {!isComingSoon && (
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text strong>Số lượng:</Text>
          <Button
            icon={<MinusOutlined />}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          />
          <InputNumber
            min={1}
            max={product.stock}
            value={quantity}
            onChange={(v) => onQuantityChange(v || 1)}
            style={{ width: 80 }}
            controls={false}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              onQuantityChange(
                quantity < product.stock ? quantity + 1 : quantity
              )
            }
            disabled={quantity >= product.stock}
          />
          {product.stock > 0 && (
            <Text type="success" style={{ marginLeft: 8 }}>
              Còn {product.stock.toLocaleString("vi-VN")} sản phẩm
            </Text>
          )}
        </div>
      )}

      {/* 🔸 Thông tin “Sắp có” */}
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

      {/* 🔹 Nút hành động */}
      <Space size="middle" style={{ marginTop: 16 }}>
        {isComingSoon || isOutOfStock ? (
          <>
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
              loading={loading}
              onClick={handlePreorder}
            >
              Đặt trước
            </Button>
          </>
        ) : (
          <>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={onAddToCart}
              loading={adding}
            >
              Thêm vào giỏ
            </Button>
            <Button
              className="btn-classic"
              type="primary"
              size="large"
              onClick={onBuyNow}
            >
              Mua ngay
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};

export default ProductInfo;
