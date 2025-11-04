import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Empty,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Spin,
} from "antd";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;

export default function PreorderPage() {
  const [preorders, setPreorders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:8000/api/orders/preorders/";

  const api = axios.create({
    baseURL: API_URL,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {},
  });

  useEffect(() => {
    const fetchAndSet = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("⚠️ Bạn cần đăng nhập để xem danh sách đặt trước!");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          "http://localhost:8000/api/orders/preorders/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPreorders(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
        message.error("Không thể tải danh sách đặt trước!");
      } finally {
        setLoading(false);
      }
    };

    fetchAndSet();
  }, []);

  const removeItem = async (id) => {
    try {
      await api.delete(`${id}/delete/`);
      message.success("Đã xóa sản phẩm khỏi danh sách đặt trước");
      setPreorders((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      message.error("Không thể xóa sản phẩm");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (preorders.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <Empty description="Chưa có sản phẩm nào được đặt trước" />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px 60px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #fefefe 100%)",
      }}
    >
      {/* 🎨 Tiêu đề nổi bật */}
      <Title
        level={2}
        style={{
          textAlign: "center",
          fontSize: 35,
          fontWeight: 800,
          marginBottom: 40,
        }}
      >
        Danh sách sản phẩm đã đặt trước
      </Title>

      <AnimatePresence mode="popLayout">
        <Row gutter={[16, 24]}>
          {preorders.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={4} xl={4} key={item.id}>
              <motion.div
                layout // 👈 Thêm dòng này để layout co giãn mượt
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }} // 👈 Hiệu ứng khi biến mất
                transition={{ duration: 0.35 }}
              >
                <Card
                  hoverable
                  bordered={false}
                  cover={
                    <div
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: "14px",
                      }}
                    >
                      <motion.img
                        alt={item.product_name || "Sản phẩm"}
                        src={
                          item.product_image ||
                          "https://via.placeholder.com/220"
                        }
                        style={{
                          height: 180,
                          width: "100%",
                          objectFit: "cover",
                          transition: "transform 0.4s ease",
                        }}
                        whileHover={{ scale: 1.05 }}
                      />
                    </div>
                  }
                  style={{
                    borderRadius: 14,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                    background: "#fff",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(0,0,0,0.1)";
                  }}
                >
                  <div style={{ marginTop: 10 }}>
                    <Title level={5} ellipsis={{ rows: 2 }}>
                      {item.product_name || "Không rõ tên"}
                    </Title>
                    <Text type="secondary">Giá: </Text>
                    <Text strong style={{ fontSize: 16, color: "#005bea" }}>
                      {Number(
                        item.product_price ?? item.price ?? 0
                      ).toLocaleString()}
                      ₫
                    </Text>
                    <Divider style={{ margin: "10px 0" }} />
                    <Text>
                      <strong>Số lượng:</strong> {item.quantity}
                    </Text>
                    <br />
                    <Text style={{ fontWeight: "700" }}>Tổng: </Text>
                    <Text strong style={{ fontSize: 16, color: "#005bea" }}>
                      {Number(item.total_price ?? 0).toLocaleString()}₫
                    </Text>
                    <div style={{ marginTop: 15, textAlign: "right" }}>
                      <Button
                        danger
                        type="primary"
                        style={{
                          background: "#ff4d4f",
                          border: "none",
                          borderRadius: 6,
                          boxShadow: "0 3px 6px rgba(255,77,79,0.4)",
                        }}
                        onClick={() => removeItem(item.id)}
                      >
                        Xóa đặt trước
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </AnimatePresence>
    </div>
  );
}
