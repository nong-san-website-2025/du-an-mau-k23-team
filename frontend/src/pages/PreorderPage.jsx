import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Typography,
  Empty,
  Row,
  Col,
  Tag,
  Space,
  message,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useCart } from "../features/cart/services/CartContext";

// Không cần InputNumber nữa, chọn số lượng trên trang sản phẩm

const { Title, Text } = Typography;

const PreOrderPage = () => {
  const [preOrders, setPreOrders] = useState([]);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { addToCart } = useCart();

  useEffect(() => {
    // Nếu có sản phẩm truyền sang từ ProductInfo thì thêm tạm vào danh sách
    if (state?.product) {
      setPreOrders([state.product]);
    } else {
      const stored = JSON.parse(localStorage.getItem("preorders") || "[]");
      setPreOrders(stored);
    }
  }, [state]);

  const removeItem = (id) => {
    const updated = preOrders.filter((item) => item.id !== id);
    setPreOrders(updated);
    localStorage.setItem("preorders", JSON.stringify(updated));
    message.success("Đã xóa khỏi danh sách đặt trước");
  };

  return (
    <div
      style={{
        padding: "40px 80px",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Title level={2}>Danh sách Đặt trước</Title>
        <Text type="secondary">
          Các sản phẩm bạn đã đăng ký đặt trước sẽ hiển thị tại đây.
        </Text>
      </div>

      {preOrders.length === 0 ? (
        <Empty description="Chưa có sản phẩm nào được đặt trước" />
      ) : (
        <Row gutter={[24, 24]}>
          {preOrders.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cover={
                  <img
                    alt={item.name}
                    src={item.image || "/placeholder.png"}
                    style={{
                      height: 180,
                      objectFit: "cover",
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  />
                }
              >
                <Title level={5} ellipsis={{ rows: 2 }}>
                  {item.name}
                </Title>

                <Space direction="vertical" size={4}>
                  <Text strong style={{ color: "#52c41a" }}>
                    {item.price?.toLocaleString("vi-VN")} VNĐ
                  </Text>

                  {item.available_from && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      <ClockCircleOutlined />{" "}
                      {new Date(item.available_from).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Text>
                  )}

                  <Tag color="orange">Sắp có</Tag>
                </Space>

                {/* 🔹 Số lượng (không chỉnh sửa ở đây) */}
                <div style={{ marginTop: 12 }}>
                  <Text strong>Số lượng:</Text>
                  <Text style={{ marginLeft: 8 }}>{item.quantity || 1}</Text>
                </div>

                {/* 🔹 Nút hành động */}
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        // 🔹 Gọi API backend
                        // Lưu ý: backend OrderCreateSerializer.create() đang tìm trường `product` chứ không phải `product_id`.
                        await axios.post(
                          "/api/preorders/",
                          {
                            items: [
                              {
                                product: item.id,
                                quantity: item.quantity,
                                price: item.price || 0,
                              },
                            ],
                          },
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                          }
                        );

                        // 🔹 Thêm vào giỏ hàng — gọi đúng chữ ký addToCart(productId, quantity, productInfo, ...)
                        addToCart(
                          item.id,
                          item.quantity,
                          {
                            id: item.id,
                            name: item.name,
                            price: item.price || 0,
                            image: item.image,
                          },
                          () => {},
                          () => {}
                        );

                        message.success(
                          "Đặt hàng thành công! Sản phẩm đã vào giỏ hàng."
                        );
                        navigate("/cart");
                      } catch (err) {
                        // Hiển thị chi tiết lỗi trả về từ server (nếu có)
                        console.error("Preorder error:", err);
                        console.error("Server response:", err.response?.data);
                        message.error(
                          `Lỗi khi đặt hàng: ${
                            err.response?.data?.detail ||
                            JSON.stringify(err.response?.data) ||
                            err.message
                          }`
                        );
                      }
                    }}
                  >
                    Đặt hàng
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(item.id)}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default PreOrderPage;
