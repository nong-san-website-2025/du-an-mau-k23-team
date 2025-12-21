import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Spinner, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search } from "react-bootstrap-icons";
import "../styles/StoreList.css";

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;
  // Tạo Base URL (bỏ /api) để dùng cho hình ảnh
  const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

  useEffect(() => {
    // SỬ DỤNG ENV Ở ĐÂY
    axios
      .get(`${API_URL}/sellers/`)
      .then((res) => setStores(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API_URL]);

  const filteredStores = stores.filter((store) =>
    store.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper xử lý ảnh
  const getStoreImage = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="store-loading-pro">
        <Spinner animation="border" />
        <p>Đang tải cửa hàng...</p>
      </div>
    );
  }

  return (
    <Container className="store-list-container">
      <div className="store-list-header">
        <h2 className="store-list-title">Tất cả người bán</h2>
        <InputGroup className="store-search-box">
          <InputGroup.Text className="store-search-icon">
            <Search />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Tìm kiếm cửa hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>

      <Row>
        {filteredStores.length > 0 ? (
          filteredStores.map((store) => (
            <Col lg={3} md={4} sm={6} xs={12} key={store.id} className="mb-4">
              <div className="store-card">
                <div className="store-card-img">
                  <img
                    // SỬ DỤNG HÀM HELPER
                    src={getStoreImage(store.image)}
                    alt={store.store_name}
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                </div>
                <div className="store-card-body">
                  <h5 className="store-card-name">{store.store_name}</h5>
                  <div className="store-card-rating">
                    {"★".repeat(Math.round(store.rating || 0))}
                    {"☆".repeat(5 - Math.round(store.rating || 0))}
                  </div>
                  <Button
                    variant="light"
                    className="store-btn"
                    onClick={() => navigate(`/store/${store.id}`)}
                  >
                    Xem gian hàng &gt;
                  </Button>
                </div>
              </div>
            </Col>
          ))
        ) : (
          <Col>
            <p className="no-store-text">Không tìm thấy cửa hàng nào.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default StoreList;