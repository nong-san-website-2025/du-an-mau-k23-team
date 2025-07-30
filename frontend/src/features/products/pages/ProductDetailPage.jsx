import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge, Button, Spinner, Alert } from "react-bootstrap";
import { ShoppingCart, ChevronLeft, Star } from "lucide-react";
import { productApi } from "../services/productApi";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productApi.getProduct(id);
        setProduct(data);
      } catch (err) {
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-4 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-4 text-center">
        <Alert variant="danger">
          <Alert.Heading>Lỗi</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Button variant="link" onClick={() => navigate(-1)} className="mb-3">
        <ChevronLeft size={20} /> Quay lại danh sách sản phẩm
      </Button>
      <div className="row">
        <div className="col-md-5">
          <img
            src={
              product.image && product.image.startsWith("/")
                ? `http://localhost:8000${product.image}`
                : product.image?.startsWith("http")
                ? product.image
                : "https://via.placeholder.com/400x300?text=No+Image"
            }
            alt={product.name}
            className="img-fluid rounded shadow-sm"
            style={{ background: "#f5f5f5", minHeight: 300 }}
          />
        </div>
        <div className="col-md-7">
          <h3 className="fw-bold mb-2">
            {product.name}
            {product.is_organic && (
              <Badge bg="success" className="ms-2">
                Hữu cơ
              </Badge>
            )}
            {product.discount > 0 && (
              <Badge bg="danger" className="ms-2">
                Giảm {product.discount}%
              </Badge>
            )}
          </h3>
          <div className="mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                className={i < Math.floor(product.rating || 0) ? "text-warning" : "text-muted"}
              />
            ))}
            <span className="ms-2 text-muted">
              {product.rating} ({product.review_count} đánh giá)
            </span>
          </div>
          <div className="mb-2">
            <span className="fw-bold text-success fs-4">
              {product.discount > 0
                ? `${(
                    product.price * (1 - product.discount / 100)
                  ).toLocaleString("vi-VN")}`
                : product.price?.toLocaleString("vi-VN")}
              đ
            </span>
            {product.discount > 0 && (
              <span className="text-muted text-decoration-line-through ms-2">
                {product.price?.toLocaleString("vi-VN")}đ
              </span>
            )}
            <span className="ms-2 text-muted">/ {product.unit}</span>
            <span className="ms-3 text-success">Còn {product.stock} sản phẩm</span>
          </div>
          <div className="mb-3">
            <Button variant="success" size="lg">
              <ShoppingCart size={20} className="me-2" /> Thêm vào giỏ hàng
            </Button>
          </div>
          <div className="mb-3">
            <span className="me-2">Giao hàng nhanh</span>
            <span className="me-2">Chất lượng đảm bảo</span>
            <span>Đổi trả dễ dàng</span>
          </div>
          <div className="mb-3">
            <strong>Mô tả:</strong>
            <p>{product.description}</p>
          </div>
          <div className="mb-3">
            <strong>Thương hiệu:</strong> {product.brand || "Không có"}
          </div>
          <div className="mb-3">
            <strong>Vị trí:</strong> {product.location || "Không có"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
