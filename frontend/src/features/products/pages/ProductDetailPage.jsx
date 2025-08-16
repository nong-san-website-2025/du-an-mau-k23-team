import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../../cart/services/CartContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Spinner,
  Alert,
  ButtonGroup,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import {
  ShoppingCart,
  ChevronLeft,
  Star,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { productApi } from "../services/productApi";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

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

  const handleAddToCart = async () => {
    if (!product || quantity > product.stock) {
      toast.warning("Số lượng vượt quá hàng trong kho.");
      return;
    }

    setAdding(true);
    await addToCart(
      product.id,
      quantity,
      () => {
        toast.success("Đã thêm vào giỏ hàng!", { autoClose: 1800 });
      },
      () => {
        toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
      }
    );
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-5 text-center">
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
    <div className="container py-4 product-detail-page">
      <Button
        onClick={() => navigate(-1)}
        className="mb-4"
        style={{
          backgroundColor: "rgb(33, 196, 93)",
          borderColor: "rgb(33, 196, 93)",
          color: "white",
        }}
      >
        <ChevronLeft size={20} /> Quay lại
      </Button>

      <Row className="g-4">
        {/* Ảnh sản phẩm */}
        <Col md={6}>
          <Card className="shadow-sm border-0 p-3">
            <div className="text-center">
              <img
                src={
                  product.image && product.image.startsWith("/")
                    ? `http://localhost:8000${product.image}`
                    : product.image?.startsWith("http")
                    ? product.image
                    : "https://via.placeholder.com/500x400?text=No+Image"
                }
                alt={product.name}
                className="img-fluid rounded main-product-img"
                style={{ maxHeight: 450, objectFit: "contain" }}
              />
            </div>
          </Card>
        </Col>

        {/* Thông tin sản phẩm */}
        <Col md={6}>
          <h2 className="fw-bold">{product.name}</h2>
          <div className="mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                className={
                  i < Math.floor(product.rating || 0)
                    ? "text-warning"
                    : "text-muted"
                }
              />
            ))}
            <span className="ms-2 text-muted">
              {product.rating} ({product.review_count} đánh giá)
            </span>
          </div>

          <div className="mb-3">
            <span className="fs-3 fw-bold text-success">
              {product.discount > 0
                ? `${Math.round(product.price * (1 - product.discount / 100)).toLocaleString("vi-VN")} VNĐ`
                : `${Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ`}
            </span>
            {product.discount > 0 && (
              <span className="text-muted text-decoration-line-through ms-2">
                {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
              </span>
            )}
            <span className="ms-3 text-muted">/ {product.unit}</span>
          </div>

          {/* Số lượng */}
          <div className="mb-3">
            <strong>Số lượng:</strong>
            <ButtonGroup className="ms-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={16} />
              </Button>
              <Button variant="light" disabled>
                {quantity}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() =>
                  setQuantity((q) => (q < product.stock ? q + 1 : q))
                }
              >
                <Plus size={16} />
              </Button>
            </ButtonGroup>
            <span className="ms-3 text-success">
              Còn {product.stock} sản phẩm
            </span>
          </div>

          {/* Nút mua */}
          <div className="mb-4">
            <Button
              variant="success"
              size="lg"
              className="me-2 px-4 shadow-sm"
              disabled={adding}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={20} className="me-2" /> Thêm vào giỏ
            </Button>
            <Button
              variant="warning"
              size="lg"
              className="px-4 shadow-sm"
              onClick={() => toast.info("Chức năng mua ngay đang phát triển")}
            >
              Mua ngay
            </Button>
          </div>

          {/* Cam kết */}
          <Row className="g-3">
            <Col xs={4} className="text-center">
              <Truck className="text-primary mb-1" />
              <div>Giao hàng nhanh</div>
            </Col>
            <Col xs={4} className="text-center">
              <ShieldCheck className="text-success mb-1" />
              <div>Hàng chính hãng</div>
            </Col>
            <Col xs={4} className="text-center">
              <RefreshCw className="text-warning mb-1" />
              <div>Đổi trả dễ dàng</div>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Mô tả sản phẩm */}
      <Card className="mt-5 border-0 shadow-sm p-4">
        <h4 className="fw-bold mb-3">Mô tả sản phẩm</h4>
        <p>{product.description}</p>
        <div>
          <strong>Thương hiệu:</strong> {product.brand || "Không có"}
        </div>
        <div>
          <strong>Vị trí:</strong> {product.location || "Không có"}
        </div>
      </Card>

        {/* Cửa hàng đơn giản */}
        {product.store && (
          <Card className="mt-4 border-0 shadow-sm p-3">
            <Row className="align-items-center">
              <Col xs={2} className="text-center">
                <img
                  src={product.store.image || "https://via.placeholder.com/80x80"}
                  alt={product.store.store_name}
                  className="img-fluid rounded-circle shadow"
                  style={{ maxHeight: "60px", objectFit: "cover" }}
                />
              </Col>
              <Col xs={7}>
                <h5 className="fw-bold mb-0">{product.store.store_name}</h5>
              </Col>
              <Col xs={3} className="text-end">
                <Button
                  variant="outline-success"
                  onClick={() => navigate(`/store/${product.store.id}`, { state: { productId: product.id } })}
                >
                  Xem shop
                </Button>
              </Col>
            </Row>
          </Card>
        )}
    </div>
  );
};

export default ProductDetailPage;
