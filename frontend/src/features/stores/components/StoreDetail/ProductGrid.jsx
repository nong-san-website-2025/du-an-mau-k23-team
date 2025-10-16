// src/features/stores/components/StoreDetail/ProductGrid.jsx
import React from "react";
import { Row, Col } from "antd";
import ProductCard from "./ProductCard";

const ProductGrid = ({ products }) => {
  if (products.length === 0) {
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
          xs={24}   // 1 cột trên điện thoại
          sm={12}   // 2 cột trên tablet
          md={8}    // 3 cột trên desktop nhỏ
          lg={6}    // 4 cột trên desktop
          xl={4}    // ✅ 6 cột trên màn hình lớn (24 ÷ 4 = 6)
        >
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default ProductGrid;