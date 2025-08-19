import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../../cart/services/CartContext";
import { useParams, useNavigate } from "react-router-dom";
import { AiFillStar } from 'react-icons/ai';
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
import { reviewApi } from "../services/reviewApi";
import { useAuth } from "../../login_register/services/AuthContext";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, token } = useAuth();

  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReview, setMyReview] = useState(null);
  useEffect(() => {
  const loadData = async () => {
    const productData = await productApi.getProduct(id);
    setProduct(productData);

    const reviewList = await reviewApi.getReviews(id);
    setReviews(reviewList);

    if (user) {
      // Gọi API lấy review của chính user hiện tại
      try {
        const myReview = await reviewApi.getMyReview(id);
        setMyReview(myReview);
      } catch {
        setMyReview(null);
      }
    }
  };
  loadData();
}, [id, user]);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productApi.getProduct(id);
        setProduct(data);

        const reviewData = await reviewApi.getReviews(id);
        setReviews(reviewData);
      } catch (err) {
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
  const fetchReviews = async () => {
    const data = await reviewApi.getReviews(id);
    setReviews(data);

    if (user) {
      const hasReviewed = data.some(r => r.user === user.id);
      setHasReviewed(hasReviewed);
    }
  };
  fetchReviews();
}, [id, user]);


  const handleAddToCart = async () => {
    if (!product || quantity > product.stock) {
      toast.warning("Số lượng vượt quá hàng trong kho.", {position: "bottom-right"});
      return;
    }

    setAdding(true);
    await addToCart(
      product.id,
      quantity,
      () => {
        toast.success("Đã thêm vào giỏ hàng!", { autoClose: 1800, position: "bottom-right" });
      },
      () => {
        toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.", {position: "bottom-right"});
      }
    );
    setAdding(false);
  };

const handleSubmitReview = async () => {
  if (!user) {
    toast.info("Bạn cần đăng nhập để đánh giá", {position: "bottom-right"});
    return;
  }
  if (newComment.trim() === "") {
    toast.warning("Vui lòng nhập bình luận", {position: "bottom-right"});
    return;
  }
  try {
    // Gửi review mới
    await reviewApi.addReview(id, {
      rating: newRating,
      comment: newComment,
    });

    // ✅ Gọi lại API để cập nhật dữ liệu mới nhất từ backend
    const updatedProduct = await productApi.getProduct(id);
    const updatedReviews = await reviewApi.getReviews(id);

    setProduct(updatedProduct);
    setReviews(updatedReviews);

    // Reset form
    setNewComment("");
    setNewRating(5);

    toast.success("Đã gửi đánh giá!", {position: "bottom-right"});
  } catch (err) {
    const errorData = err.response?.data;
    if (errorData?.non_field_errors) {
      toast.warning(errorData.non_field_errors[0], {position: "bottom-right"});
    } else {
      toast.error("Không thể gửi đánh giá", {position: "bottom-right"});
    }
  }
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
      {/* Nút quay lại */}
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
    <AiFillStar
      key={i}
      size={18}
      className={
        i < Math.round(product.rating || 0)
          ? "text-warning"
          : "text-muted"
      }
    />
  ))}
  <span className="ms-2 text-muted">
    {Number(product.rating).toFixed(1)} ★ ({product.review_count} đánh giá)
  </span>
</div>

          <div className="mb-3">
            <span className="fs-3 fw-bold text-success">
              {product.discount > 0
                ? `${Math.round(
                    product.price * (1 - product.discount / 100)
                  ).toLocaleString("vi-VN")} VNĐ`
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
              onClick={() => toast.info("Chức năng mua ngay đang phát triển", {position: "bottom-right"})}
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
                src={
                  product.store.image || "https://via.placeholder.com/80x80"
                }
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
                onClick={() =>
                  navigate(`/store/${product.store.id}`, {
                    state: { productId: product.id },
                  })
                }
              >
                Xem shop
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Đánh giá & Bình luận */}
      <Card className="mt-5 border-0 shadow-sm p-4">
  <h4 className="fw-bold mb-3">Đánh giá & Bình luận</h4>

  {user ? (
  myReview ? (
    <div className="border p-3 rounded bg-light">
      <p className="fw-bold text-success">✅ Bạn đã đánh giá sản phẩm này</p>
      <div>
        {[...Array(5)].map((_, i) => (
          <AiFillStar
            key={i}
            size={16}
            className={i < myReview.rating ? "text-warning" : "text-muted"}
          />
        ))}
      </div>
      <p className="mb-1">{myReview.comment}</p>
      <small className="text-muted">
        {new Date(myReview.created_at).toLocaleString()}
      </small>
    </div>
  ) : (
    <>
      {/* Form nhập review nếu chưa có */}
      <div className="mb-3">
        <label>Chọn số sao:</label>
        <select
          value={newRating}
          onChange={(e) => setNewRating(Number(e.target.value))}
          className="form-select w-auto d-inline ms-2"
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r} ★
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="form-control mb-2"
        rows={3}
        placeholder="Viết bình luận..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <Button variant="success" onClick={handleSubmitReview}>
        Gửi đánh giá
      </Button>
    </>
  )
) : (
  <p className="text-muted">Đăng nhập để đánh giá</p>
)}


  {/* Danh sách review */}
  <div className="mt-4">
    {reviews.length === 0 && <p>Chưa có đánh giá nào.</p>}
    {reviews.map((r) => (
  <div key={r.id} className="border-bottom py-2">
    <div>
      <strong>{r.user_name}</strong>{" "}
      {[...Array(5)].map((_, i) => (
        <AiFillStar
          key={i}
          size={14}
          className={i < r.rating ? "text-warning" : "text-muted"}
        />
      ))}
    </div>
    <p className="mb-1">{r.comment}</p>
    <small className="text-muted">
      {new Date(r.created_at).toLocaleString()}
    </small>
  </div>
))}

  </div>
</Card>

    </div>
  );
};

export default ProductDetailPage;
