import React from "react";
import { Row, Col } from "antd";
// import { useNavigate } from "react-router-dom"; // Không cần nữa
// import { Card } from "antd"; // Không cần nữa

// 1. IMPORT PRODUCTCARD
// Giả sử ProductCard.jsx nằm ở thư mục ../products/components/ProductCard
// Bạn cần điều chỉnh đư"ờng dẫn này cho đúng với cấu trúc dự án của bạn
import ProductCard from "./ProductCard";

const RelatedProducts = ({ products }) => {
  // 2. Không cần navigate ở đây, vì ProductCard đã tự xử lý việc đó
  // const navigate = useNavigate();

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontWeight: "bold", marginBottom: 24 }}>
        Sản phẩm liên quan
      </h2>
      <Row gutter={[16, 16]}>
        {products.map((p) => {
          // 3. Xoá logic xử lý ảnh, vì ProductCard đã làm
          // const imgSrc = ...

          return (
            <Col key={p.id} xs={12} sm={8} md={6} lg={4}>
              {/* 4. Sử dụng ProductCard thay vì Card tùy chỉnh */}
              <ProductCard product={p} showAddToCart={true}  />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default RelatedProducts;