import React from "react";
import { Button, Space, Typography, Rate, Tag } from "antd";
import {
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

import { Modal, InputNumber } from "antd";

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

  const handlePreorder = (product) => {
    const stored = JSON.parse(localStorage.getItem("preorders")) || [];
    const existing = stored.find((item) => item.id === product.id);

    const estimatedStock = product.estimated_stock || 10; // ví dụ từ backend
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= estimatedStock) {
      message.warning("⚠️ Đã đạt số lượng đặt trước tối đa cho sản phẩm này!");
      return;
    }

    // Nếu chưa vượt
    let updated;
    if (existing) {
      updated = stored.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...stored, { ...product, quantity: 1 }];
    }

    localStorage.setItem("preorders", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    message.success("✅ Đã thêm vào danh sách đặt trước!");
  };

  // ✅ Ưu tiên đọc field availability_status từ backend
  const status = (product.availability_status || product.status || "")
    .toLowerCase()
    .trim();
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
  console.log("RENDER STATUS:", {
    isComingSoon,
    isOutOfStock,
    status: product.status,
  });

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
  const userPreordered =
    Number(product.user_preordered || 0) || guestPreorderQty;

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

      {/* 🔹 Số lượng hiện tại và số lượng đã đặt */}
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

          {/* 🔸 Còn hàng / Đã bán / Đã đặt */}
          {product.stock > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="success">
                Còn {product.stock.toLocaleString("vi-VN")} sản phẩm
              </Text>

              {/* {product.sold_quantity > 0 && (
                <Text type="secondary" style={{ marginLeft: 12 }}>
                  Đã bán {product.sold_quantity.toLocaleString("vi-VN")}
                </Text>
              )} */}

              <Text type="secondary" style={{ marginLeft: 12 }}>
                Đã bán {(product.ordered_quantity || 0).toLocaleString("vi-VN")}{" "}
                sản phẩm
              </Text>
            </div>
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

            <Text>
              <strong>Đã đặt trước:</strong>{" "}
              {Number(totalPreordered || 0).toLocaleString("vi-VN")} sản phẩm
            </Text>
          </Space>
        </div>
      )}

      {/* 🔹 Các nút hành động */}
      {/* 🔹 Các nút hành động */}
      {/* 🔹 Các nút hành động */}
      <Space size="middle" style={{ marginTop: 16 }}>
        {isComingSoon ? (
          // 🔸 Sản phẩm sắp có → chỉ cho đặt trước, KHÔNG mua ngay / thêm giỏ
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <InputNumber
              min={1}
              value={quantity}
              onChange={(v) => onQuantityChange(v)}
              style={{ width: 80 }}
            />
            <Button
              type="primary"
              size="large"
              danger
              onClick={() => {
                try {
                  const qty = Number(quantity) || 1;
                  const preorderItem = {
                    id: product.id,
                    name: product.name,
                    image:
                      product.image && product.image.startsWith("/")
                        ? `http://localhost:8000${product.image}`
                        : product.image,
                    price:
                      Number(product.discounted_price ?? product.price) || 0,
                    quantity: qty,
                    date: new Date().toISOString(),
                  };

                  // Lưu vào localStorage (chưa mở bán nên không thêm vào giỏ / mua ngay)
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

                  message.success("Đặt trước thành công! 🎉");
                  navigate("/preorders", { state: { product: preorderItem } });
                } catch (err) {
                  message.error("Không thể đặt trước sản phẩm này!");
                }
              }}
            >
              Đặt trước
            </Button>
          </div>
        ) : isOutOfStock ? (
          // 🔸 Hết hàng → chỉ hiển thị thông báo
          <>
            <Button disabled size="large">
              Sản phẩm đã hết hàng
            </Button>
          </>
        ) : (
          // 🔸 Có hàng → hiển thị thêm giỏ / mua ngay
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
