import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Badge,
  Button,
} from "react-bootstrap"; // thêm Button
import axios from "axios";

const StoreDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/sellers/${id}/`);
        console.log("Chi tiết cửa hàng:", res.data);
        setStore(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết cửa hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!store) {
    return <p className="text-center my-5">❌ Không tìm thấy cửa hàng.</p>;
  }

  return (
    <Container className="my-5">
      {/* Nút quay lại */}
      <div className="mb-4">
        <Button
          style={{
            backgroundColor: "rgb(33, 196, 93)",
            borderColor: "rgb(33, 196, 93)",
          }}
          onClick={() => {
            const productId = location.state?.productId;
            if (productId) {
              navigate(`/products/${productId}`);
            } else {
              navigate("/store");
            }
          }}
        >
          ← Quay lại
        </Button>
      </div>

      {/* Thông tin cửa hàng */}
      <Row className="mb-5 align-items-center">
        <Col md={3} className="text-center">
          <img
            src={store.image || "https://via.placeholder.com/300x300"}
            alt={store.store_name}
            className="img-fluid rounded shadow"
            style={{ maxHeight: "200px", objectFit: "cover" }}
          />
        </Col>
        <Col md={9}>
          <h2 className="fw-bold">{store.store_name}</h2>
          <p className="mb-1">
            <strong>📍 Địa chỉ:</strong> {store.address || "Chưa cập nhật"}
          </p>
          <p className="mb-1">
            <strong>📞 Số điện thoại:</strong> {store.phone || "Chưa cập nhật"}
          </p>
          {store.bio && <p className="mt-2">{store.bio}</p>}
        </Col>
      </Row>

      {/* Danh sách sản phẩm */}
      <h4 className="fw-bold mb-4">🛒 Sản phẩm của cửa hàng</h4>
      <Row>
        {store.products && store.products.length > 0 ? (
          store.products.map((product) => (
            <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
              <Link
                to={`/products/${product.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card
                  className="h-100 shadow-sm border-0"
                  style={{
                    borderRadius: "15px",
                    overflow: "hidden",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 10px rgba(0,0,0,0.05)";
                  }}
                >
                  <Card.Img
                    variant="top"
                    src={product.image || "https://via.placeholder.com/300x200"}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <Card.Body>
                    <Card.Title
                      className="fw-bold"
                      style={{ fontSize: "1rem", minHeight: "48px" }}
                    >
                      {product.name}
                    </Card.Title>
                    <div className="mb-2">
                      <span className="text-danger fw-bold">
                        {Math.round(product.discounted_price)?.toLocaleString("vi-VN")} VNĐ
                      </span>{" "}
                      {product.discount > 0 && (
                        <small className="text-muted text-decoration-line-through">
                          {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
                        </small>
                      )}
                    </div>
                    <Badge bg="secondary" className="mb-2">
                      Còn {product.stock} {product.unit}
                    </Badge>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))
        ) : (
          <p className="text-muted">Chưa có sản phẩm nào.</p>
        )}
      </Row>
    </Container>
  );
};

export default StoreDetail;