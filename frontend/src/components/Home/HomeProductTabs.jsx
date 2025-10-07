import React, { useEffect, useState } from "react";
import { Tabs, Row, Col, Card, Typography, Spin } from "antd";
import { productApi } from "../../features/products/services/productApi";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const HomeProductTabs = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();
        const sorted = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNewProducts(sorted.slice(0, 10));
        const coming = data
          .filter((p) => p.availability_status === "coming_soon")
          .sort((a, b) => new Date(a.season_start) - new Date(b.season_start));
        setComingSoon(coming.slice(0, 10));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <section
      style={{
        background: "#fff",
        padding: "60px 0",
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 15px",
        }}
      >
        <Title
          level={3}
          style={{
            textAlign: "start",
            marginBottom: 25,
            fontWeight: 700,
            color: "#222",
          }}
        >
          Sản phẩm nổi bật
        </Title>

        <Tabs
          defaultActiveKey="1"
          centered
          items={[
            {
              key: "1",
              label: "Sản phẩm mới",
              children: (
                <Row gutter={[16, 16]} justify="start">
                  {newProducts.map((p) => (
                    <Col key={p.id} xs={12} sm={8} md={6} lg={6}>
                      <Card
                        hoverable
                        cover={
                          <img
                            src={
                              p.image?.startsWith("/")
                                ? `http://localhost:8000${p.image}`
                                : p.image
                            }
                            alt={p.name}
                            style={{
                              height: 180,
                              objectFit: "cover",
                              borderRadius: "8px 8px 0 0",
                            }}
                          />
                        }
                        onClick={() => navigate(`/products/${p.id}`)}
                        style={{
                          borderRadius: 8,
                          overflow: "hidden",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                          transition: "transform 0.2s ease",
                        }}
                        bodyStyle={{ padding: "14px" }}
                      >
                        <Text strong style={{ fontSize: 16 }}>
                          {p.name}
                        </Text>
                        <br />
                        <Text type="danger" style={{ fontSize: 15 }}>
                          {Math.round(p.price).toLocaleString("vi-VN")} ₫
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: "2",
              label: "Sản phẩm sắp có",
              children: (
                <Row gutter={[16, 16]} justify="start">
                  {comingSoon.map((p) => (
                    <Col key={p.id} xs={12} sm={8} md={6} lg={6}>
                      <Card
                        hoverable
                        cover={
                          <img
                            src={
                              p.image?.startsWith("/")
                                ? `http://localhost:8000${p.image}`
                                : p.image
                            }
                            alt={p.name}
                            style={{
                              height: 180,
                              objectFit: "cover",
                              borderRadius: "8px 8px 0 0",
                            }}
                          />
                        }
                        onClick={() => navigate(`/products/${p.id}`)}
                        style={{
                          borderRadius: 8,
                          overflow: "hidden",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                          transition: "transform 0.2s ease",
                        }}
                        bodyStyle={{ padding: "14px" }}
                      >
                        <Text strong style={{ fontSize: 16 }}>
                          {p.name}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Sắp có:{" "}
                          {p.season_start
                            ? new Date(p.season_start).toLocaleDateString(
                                "vi-VN"
                              )
                            : "?"}{" "}
                          →{" "}
                          {p.season_end
                            ? new Date(p.season_end).toLocaleDateString("vi-VN")
                            : "?"}
                        </Text>
                        <br />
                        <Text type="warning">
                          Ước lượng: {p.estimated_quantity || 0} sản phẩm
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
};

export default HomeProductTabs;
