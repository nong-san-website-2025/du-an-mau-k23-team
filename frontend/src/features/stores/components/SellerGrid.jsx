import React from "react";
import { Row, Col, Typography, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import NoImage from "../../../components/shared/NoImage"; // ✅ Component fallback
import "../../../features/products/styles/UserProductPage.css"; // hoặc file CSS riêng
import "../styles/SellerGrid.css"

const { Text } = Typography;

export default function SellerGrid({ sellers = [] }) {
  const navigate = useNavigate();

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;
  // Tạo Base URL (bỏ /api) để dùng cho hình ảnh
  // Ví dụ: http://localhost:8000/api -> http://localhost:8000
  const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

  if (!sellers.length) {
    return <Empty description="Không tìm thấy cửa hàng nào phù hợp" />;
  }

  return (
    <Row gutter={[16, 16]}>
      {sellers.map((seller) => (
        <Col xs={24} sm={12} md={8} lg={6} key={seller.id}>
          <div
            className="seller-card"
            onClick={() => navigate(`/store/${seller.id}`)}
          >
            {seller.image ? (
              <img
                src={
                  seller.image.startsWith("http")
                    ? seller.image
                    : `${BASE_URL}${seller.image}` // SỬ DỤNG BASE_URL
                }
                alt={seller.store_name}
                className="seller-image"
              />
            ) : (
              <NoImage height={180} text="Không có ảnh cửa hàng" />
            )}

            {/* ✅ Overlay tên cửa hàng */}
            <div className="seller-overlay">{seller.store_name}</div>
          </div>    
        </Col>
      ))}
    </Row>
  );
}