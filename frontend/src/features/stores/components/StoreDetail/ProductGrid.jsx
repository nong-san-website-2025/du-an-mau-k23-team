// src/features/stores/components/StoreDetail/ProductGrid.jsx
import React from "react";
import { Row, Col } from "antd";
import ProductCard from "../../../products/components/ProductCard";

const ProductGrid = ({ products, onAddToCart, showAddToCart = true }) => {
  if (!products || products.length === 0) {
    return (
      <Col span={24} style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
        Không tìm thấy sản phẩm phù hợp.
      </Col>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {products.map((product) => (
        <Col
          key={product.id}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          xl={4}
        >
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            showAddToCart={showAddToCart}
          />
        </Col>
      ))}
    </Row>
  );
};

export default ProductGrid;
