import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../../cart/services/CartContext";
import { useParams, useNavigate } from "react-router-dom";
import { AiFillStar, AiFillHeart } from "react-icons/ai";
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
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { productApi } from "../services/productApi";
import { reviewApi } from "../services/reviewApi";
import { favoriteApi } from "../services/favoriteApi";
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  // Kiểm tra trạng thái yêu thích từ localStorage khi load trang
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const fav = list.some((item) => String(item.id) === String(id));
      setIsFavorite(fav);
    } catch {
      setIsFavorite(false);
    }
  }, [id]);

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const all = await productApi.getAllProducts();
        const selected = all.slice(0, 6); // chọn 6 sản phẩm thật
        setRelatedProducts(selected);
      } catch (err) {
        console.error("❌ Lỗi load sản phẩm liên quan:", err);
      }
    };
    loadRelated();
  }, []);

  // Xử lý bấm vào icon trái tim
  const handleToggleFavorite = async () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (isFavorite) {
        // Remove
        const newList = list.filter(
          (item) => String(item.id) !== String(product.id)
        );
        localStorage.setItem("wishlist", JSON.stringify(newList));
        setIsFavorite(false);
        toast.success("Đã xóa khỏi mục yêu thích", {
          position: "bottom-right",
        });
      } else {
        // Add
        const item = {
          id: product.id,
          name: product.name,
          image:
            (product.image && product.image.startsWith("/")
              ? `http://localhost:8000${product.image}`
              : product.image) || "",
          price: Number(product.discounted_price ?? product.price) || 0,
          inStock: product.stock > 0,
        };
        if (!list.some((p) => String(p.id) === String(item.id))) {
          list.push(item);
          localStorage.setItem("wishlist", JSON.stringify(list));
        }
        setIsFavorite(true);
        toast.success("Đã thêm vào mục yêu thích", {
          position: "bottom-right",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật mục yêu thích", {
        position: "bottom-right",
      });
    }
  };

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReview, setMyReview] = useState(null);

  // Complaint state
  const [complaintText, setComplaintText] = useState("");
  const [complaintFiles, setComplaintFiles] = useState([]); // lưu file ảnh/video
  const [sendingComplaint, setSendingComplaint] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  // Hàm gửi khiếu nại
  // Helper fetchWithAuth: tự động thêm token + refresh nếu hết hạn
  const fetchWithAuth = async (url, options = {}) => {
    let token = localStorage.getItem("token");

    let res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // Nếu token hết hạn → thử refresh
    if (res.status === 401) {
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        const refreshRes = await fetch(
          "http://localhost:8000/api/token/refresh/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          }
        );

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          token = data.access;
          localStorage.setItem("token", token);

          // gọi lại request gốc với token mới
          res = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
    }

    return res;
  };

  // ✅ Hàm gửi khiếu nại (có file)
  const handleSendComplaint = async () => {
    if (!user) {
      toast.info("Bạn cần đăng nhập để gửi khiếu nại");
      return;
    }
    if (!complaintText.trim()) {
      toast.warning("Vui lòng nhập nội dung khiếu nại");
      return;
    }

    try {
      setSendingComplaint(true);

      const formData = new FormData();
      formData.append("user", user.id);
      formData.append("product", id);
      formData.append("reason", complaintText);
      // Thêm file ảnh/video
      for (let i = 0; i < complaintFiles.length; i++) {
        formData.append("media", complaintFiles[i]);
      }

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/complaints/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Lỗi API: ${res.status}`);
      }

      toast.success("✅ Đã gửi khiếu nại thành công!");
      setComplaintText("");
      setComplaintFiles([]);
      setShowComplaintForm(false);
    } catch (err) {
      toast.error("❌ Gửi khiếu nại thất bại!");
      console.error("Complaint error:", err);
    } finally {
      setSendingComplaint(false);
    }
  };

  // Load dữ liệu sản phẩm và review
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await productApi.getProduct(id);
        setProduct(productData);

        const reviewList = await reviewApi.getReviews(id);
        setReviews(reviewList);

        if (user) {
          const myReview = await reviewApi.getMyReview(id).catch(() => null);
          setMyReview(myReview);
          setHasReviewed(!!myReview);
        }
      } catch (err) {
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!product || quantity > product.stock) {
      toast.warning("Số lượng vượt quá hàng trong kho.", {
        position: "bottom-right",
      });
      return;
    }

    setAdding(true);
    await addToCart(
      product.id,
      quantity,
      () => {
        toast.success("Đã thêm vào giỏ hàng!", {
          autoClose: 1800,
          position: "bottom-right",
        });
      },
      () => {
        toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.", {
          position: "bottom-right",
        });
      },
      {
        id: product.id,
        name: product.name,
        image:
          product.image && product.image.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image,
        price: Number(product.discounted_price ?? product.price) || 0,
      }
    );

    setAdding(false);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.info("Bạn cần đăng nhập để đánh giá", {
        position: "bottom-right",
      });
      return;
    }
    if (newComment.trim() === "") {
      toast.warning("Vui lòng nhập bình luận", {
        position: "bottom-right",
      });
      return;
    }
    try {
      await reviewApi.addReview(id, {
        rating: newRating,
        comment: newComment,
      });

      const updatedProduct = await productApi.getProduct(id);
      const updatedReviews = await reviewApi.getReviews(id);

      setProduct(updatedProduct);
      setReviews(updatedReviews);
      setNewComment("");
      setNewRating(5);

      toast.success("Đã gửi đánh giá!", { position: "bottom-right" });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.non_field_errors) {
        toast.warning(errorData.non_field_errors[0], {
          position: "bottom-right",
        });
      } else {
        toast.error("Không thể gửi đánh giá", { position: "bottom-right" });
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
          <Card className="shadow-sm border-0 p-3 position-relative">
            <div className="text-center position-relative">
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
              <button
                onClick={handleToggleFavorite}
                className="position-absolute"
                style={{
                  bottom: 15,
                  right: 15,
                  background: "rgba(255,255,255,0.95)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px #eee",
                  cursor: "pointer",
                  zIndex: 2,
                }}
                title={
                  isFavorite ? "Bỏ khỏi mục yêu thích" : "Thêm vào yêu thích"
                }
              >
                <span
                  style={{
                    color: isFavorite ? "#e53935" : "#ccc",
                    fontSize: 22,
                    transition: "color 0.2s",
                  }}
                >
                  &#10084;
                </span>
              </button>
            </div>
          </Card>
        </Col>

        {/* Thông tin sản phẩm */}
        <Col md={6}>
          <h2 className="fw-bold d-flex align-items-center">{product.name}</h2>
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
              {Number(product.rating).toFixed(1)} ★ ({product.review_count} đánh
              giá)
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
              onClick={() =>
                toast.info("Chức năng mua ngay đang phát triển", {
                  position: "bottom-right",
                })
              }
            >
              Mua ngay
            </Button>
          </div>

          {/* Cam kết */}
        </Col>
      </Row>

      {/* Mô tả sản phẩm */}
      <Card className="mt-5 border-0 shadow-sm p-4" style={{ borderRadius: 16, background: '#fff' }}>
        <h4 className="fw-bold mb-3" style={{ fontSize: 22, color: '#222' }}>
          <span style={{ verticalAlign: 'middle', marginRight: 8 }}>📝</span>Mô tả sản phẩm
        </h4>
        <div className="mb-3" style={{ fontSize: 16, color: '#444', lineHeight: 1.7, minHeight: 40 }}>
          {product.description ? (
            <span>{product.description}</span>
          ) : (
            <span className="text-muted fst-italic">Chưa có mô tả cho sản phẩm này.</span>
          )}
        </div>
        <div className="row" style={{ fontSize: 15 }}>
          <div className="col-md-6 mb-1">
            <strong>Thương hiệu:</strong>
            <span className={(!product.brand || product.brand === 'Không có') ? 'text-muted fst-italic ms-1' : 'ms-1'}>
              {product.brand || 'Không có'}
            </span>
          </div>
          <div className="col-md-6 mb-1">
            <strong>Vị trí:</strong>
            <span className={(!product.location || product.location === 'Không có') ? 'text-muted fst-italic ms-1' : 'ms-1'}>
              {product.location || 'Không có'}
            </span>
          </div>
        </div>
      </Card>

      {/* Nút mở form khiếu nại */}
      <div className="mt-4 text-end">
        <Button
          variant="outline-danger"
          onClick={() => setShowComplaintForm((v) => !v)}
        >
          {showComplaintForm ? "Đóng khiếu nại" : "Khiếu nại sản phẩm"}
        </Button>
      </div>

      {/* Form khiếu nại */}
      {showComplaintForm && (
        <Card className="mt-2 border-0 shadow-sm p-4">
          <h4 className="fw-bold mb-3">Gửi khiếu nại về sản phẩm</h4>
          {user ? (
            <>
              <textarea
                className="form-control mb-2"
                rows={3}
                placeholder="Nhập nội dung khiếu nại..."
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
              />
              <label className="form-label fw-normal mb-1">
                Hình ảnh hoặc video đính kèm minh họa (tùy chọn):
              </label>
              <input
                type="file"
                className="form-control mb-2"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setComplaintFiles(Array.from(e.target.files))}
              />
              <Button
                variant="danger"
                onClick={handleSendComplaint}
                disabled={sendingComplaint}
              >
                {sendingComplaint ? "Đang gửi..." : "Gửi khiếu nại"}
              </Button>
            </>
          ) : (
            <p className="text-muted">Đăng nhập để gửi khiếu nại</p>
          )}
        </Card>
      )}

      {/* Cửa hàng */}
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
              <p className="fw-bold text-success">
                ✅ Bạn đã đánh giá sản phẩm này
              </p>
              <div>
                {[...Array(5)].map((_, i) => (
                  <AiFillStar
                    key={i}
                    size={16}
                    className={
                      i < myReview.rating ? "text-warning" : "text-muted"
                    }
                  />
                ))}
              </div>
              <p className="mb-1">{myReview.comment}</p>
              <small className="text-muted">
                {new Date(myReview.created_at).toLocaleString()}
              </small>

              {/* Replies under my review */}
              {Array.isArray(myReview.replies) && myReview.replies.length > 0 && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <strong>Phản hồi từ cửa hàng:</strong>
                  <ul className="mb-0 mt-2" style={{ paddingLeft: 18 }}>
                    {myReview.replies.map((rp) => (
                      <li key={rp.id} className="mb-1">
                        <span>{rp.reply_text}</span>
                        <small className="text-muted ms-2">
                          {new Date(rp.created_at).toLocaleString()}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
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

              {/* Replies under each review */}
              {Array.isArray(r.replies) && r.replies.length > 0 && (
                <div className="mt-2 p-2 bg-light rounded">
                  <strong>Phản hồi từ cửa hàng:</strong>
                  <ul className="mb-0 mt-2" style={{ paddingLeft: 18 }}>
                    {r.replies.map((rp) => (
                      <li key={rp.id} className="mb-1">
                        <span>{rp.reply_text}</span>
                        <small className="text-muted ms-2">
                          {new Date(rp.created_at).toLocaleString()}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Sản phẩm liên quan */}
        <div className="mt-5">
          <h2 className="fw-bold mb-4">Sản phẩm liên quan</h2>
          <Row>
            {relatedProducts.map((p) => (
              <Col key={p.id} md={2} sm={4} xs={6} className="mb-3">
                <Card
                  className="h-100 shadow-sm border-0"
                  onClick={() => navigate(`/products/${p.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Img
                    variant="top"
                    src={
                      p.image && p.image.startsWith("/")
                        ? `http://localhost:8000${p.image}`
                        : p.image?.startsWith("http")
                          ? p.image
                          : "https://via.placeholder.com/300x200?text=No+Image"
                    }
                    alt={p.name}
                    style={{ height: 150, objectFit: "contain" }}
                  />
                  <Card.Body>
                    <Card.Title className="fs-6 text-truncate" title={p.name}>
                      {p.name}
                    </Card.Title>
                    <Card.Text className="text-success fw-bold">
                      {(p.discounted_price ?? p.price)?.toLocaleString("vi-VN")}{" "}
                      đ
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
