import React from "react";
import { Button, Row, Col, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../../features/products/components/ProductCard"; // Import ProductCard

const RecommendedSection = ({
  recommended,
  moreByUserPage,
  suggestLimit,
  onShowMore,
  loading,
  onAddToCart, // Nhận prop
}) => {
  const navigate = useNavigate();

  if (loading) {
    return <Spin tip="Đang tải gợi ý..." style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <>
      {/* Render theo Subcategory (Logic cũ của bạn) */}
      {Object.keys(recommended).map((sub) => (
        <div key={sub} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#2e7d32", fontSize: 18 }}>{sub}</h3>
            <Button type="link" onClick={() => navigate(`/search?subcategory=${encodeURIComponent(sub)}`)}>
              Xem thêm
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {(recommended[sub] || []).map((p) => (
              <Col key={p.id} xs={12} sm={8} md={6} lg={4}>
                <ProductCard 
                    product={p} 
                    onAddToCart={onAddToCart}
                />
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Render More By User (Gợi ý chung) */}
      {moreByUserPage.length > 0 && (
        <>
          <Row gutter={[16, 16]}>
            {moreByUserPage.slice(0, suggestLimit).map((p) => (
              <Col key={p.id} xs={12} sm={8} md={6} lg={4}>
                <ProductCard 
                    product={p} 
                    onAddToCart={onAddToCart} 
                />
              </Col>
            ))}
          </Row>
          
          {moreByUserPage.length > suggestLimit && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Button type="dashed" size="large" onClick={onShowMore} style={{ borderRadius: 20 }}>
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