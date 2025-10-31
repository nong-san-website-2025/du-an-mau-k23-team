import React, { useEffect, useState } from "react";
import { Card, Button, Empty, message, Row, Col, Typography, Divider } from "antd";

const { Title, Text } = Typography;

export default function PreorderPage() {
  const [preorders, setPreorders] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("preorders")) || [];
    setPreorders(stored);
  }, []);

  const removeItem = (id) => {
    const updated = preorders.filter((item) => item.id !== id);
    setPreorders(updated);
    localStorage.setItem("preorders", JSON.stringify(updated));
    message.success("Đã xóa sản phẩm khỏi danh sách đặt trước");
  };

  if (preorders.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <Empty description="Chưa có sản phẩm nào được đặt trước" />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 60px", background: "#fafafa", minHeight: "100vh" }}>
      <Title level={3} style={{ marginBottom: "30px", textAlign: "center" }}>
        🛒 Danh sách sản phẩm đã đặt trước
      </Title>

      <Row gutter={[24, 24]}>
        {preorders.map((item) => (
          <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
            <Card
              hoverable
              bordered={false}
              cover={
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "12px",
                  }}
                >
                  <img
                    alt={item.name}
                    src={item.image}
                    style={{
                      height: 220,
                      width: "100%",
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>
              }
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                background: "#fff",
              }}
            >
              <div style={{ marginTop: 10 }}>
                <Title level={5} ellipsis={{ rows: 2 }}>
                  {item.name}
                </Title>
                <Text type="secondary">Giá: </Text>
                <Text strong>{item.price.toLocaleString()}₫</Text>

                <Divider style={{ margin: "10px 0" }} />

                <Text>
                  <strong>Số lượng:</strong> {item.quantity}
                </Text>
                <br />
                <Text>
                  <strong>Tổng:</strong>{" "}
                  {(item.price * item.quantity).toLocaleString()}₫
                </Text>

                <div style={{ marginTop: 15, textAlign: "right" }}>
                  <Button danger onClick={() => removeItem(item.id)}>
                    Xóa đặt trước
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
