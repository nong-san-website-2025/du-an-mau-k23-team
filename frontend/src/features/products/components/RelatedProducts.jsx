import React from "react";
import { Card, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";

const RelatedProducts = ({ products }) => {
  const navigate = useNavigate();

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontWeight: "bold", marginBottom: 24 }}>Sản phẩm liên quan</h2>
      <Row gutter={[16, 16]}>
        {products.map((p) => {
          const imgSrc = p.image?.startsWith("http")
            ? p.image
            : p.image?.startsWith("/")
              ? `http://localhost:8000${p.image}`
              : "https://via.placeholder.com/300x200?text=No+Image";

          return (
            <Col key={p.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                cover={
                  <img
                    alt={p.name}
                    src={imgSrc}
                    className="related-product-image"
                    style={{ objectFit: "contain" }}
                  />
                }
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <Card.Meta
                  title={<div className="text-truncate">{p.name}</div>}
                  description={
                    <div style={{ color: "#52c41a", fontWeight: "bold" }}>
                      {(p.discounted_price ?? p.price)?.toLocaleString("vi-VN")} đ
                    </div>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default RelatedProducts;