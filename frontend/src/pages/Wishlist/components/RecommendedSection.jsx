import React from "react";
import { Card, Button, Row, Col, Spin } from "antd";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;
// hoặc define lại nếu cần

const RecommendedSection = ({
  recommended,
  moreByUserPage,
  suggestLimit,
  onShowMore,
  loading,
}) => {
  const navigate = useNavigate();

  const renderProductCard = (product) => {
    const imgSrc = product.image?.startsWith("http")
      ? product.image
      : product.image?.startsWith("/")
        ? `${API_URL.replace(/\/api$/, "")}${product.image}`
        : "https://via.placeholder.com/400x300?text=No+Image";

    return (
      <Col key={product.id} xs={12} sm={8} md={6} lg={6} xl={4}>
        <Card
          hoverable
          cover={
            <img
              alt={product.name}
              src={imgSrc}
              style={{ height: 160, objectFit: "cover" }}
              onClick={() => navigate(`/products/${product.id}`)}
            />
          }
          size="small"
        >
          <Card.Meta
            title={<div className="text-truncate">{product.name}</div>}
            description={
              <>
                <div style={{ color: "#d32f2f", fontWeight: "bold" }}>
                  {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  Xem
                </Button>
              </>
            }
          />
        </Card>
      </Col>
    );
  };

  if (loading) {
    return <Spin tip="Đang tải gợi ý..." />;
  }

  return (
    <>
      {Object.keys(recommended).map((sub) => (
        <div key={sub} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h4 style={{ margin: 0, color: "#52c41a" }}>{sub}</h4>
            <Button
              type="link"
              onClick={() =>
                navigate(`/search?subcategory=${encodeURIComponent(sub)}`)
              }
            >
              Xem thêm
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {(recommended[sub] || []).map((p) => (
              <Col key={p.id} xs={12} sm={8} md={6} lg={6} xl={4}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={p.name}
                      src={p.image || "https://via.placeholder.com/300x200"}
                      style={{ height: 150, objectFit: "cover" }}
                      onClick={() => navigate(`/products/${p.id}`)}
                    />
                  }
                  size="small"
                >
                  <Card.Meta
                    title={
                      <div className="text-truncate" style={{ minHeight: 40 }}>
                        {p.name}
                      </div>
                    }
                    description={
                      <div style={{ color: "#d32f2f", fontWeight: "bold" }}>
                        {Number(p.price).toLocaleString()} đ
                      </div>
                    }
                  />
                  <Button
                    type="primary"
                    size="small"
                    block
                    style={{ marginTop: 8 }}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    Xem Chi Tiết
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {moreByUserPage.length > 0 && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            {moreByUserPage.slice(0, suggestLimit).map(renderProductCard)}
          </Row>
          {moreByUserPage.length > suggestLimit && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button type="dashed" onClick={onShowMore}>
                Xem thêm sản phẩm gợi ý
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default RecommendedSection;
