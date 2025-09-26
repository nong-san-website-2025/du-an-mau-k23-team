import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Badge, Button } from "react-bootstrap";
import axios from "axios";

// Định dạng tiền tệ VND an toàn
const formatVND = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return Math.round(n).toLocaleString("vi-VN");
};

// Định dạng ngày tham gia
const formatJoined = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return "-";
  }
};

const StoreDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Seller detail (public)
        const sellerRes = await axios.get(`http://localhost:8000/api/sellers/${id}/`);
        setStore(sellerRes.data);

        // Followers giả lập (nếu backend chưa cung cấp). Nếu có field followers -> dùng luôn
        const initialFollowers = Number(sellerRes.data.followers || 0);
        setFollowers(Number.isNaN(initialFollowers) ? 0 : initialFollowers);
        const saved = localStorage.getItem(`followingShop_${id}`);
        setIsFollowing(saved === "true");

        // 2) Products by seller (public, filtered approved in ProductViewSet)
        const productsRes = await axios.get(
          `http://localhost:8000/api/products/?seller=${id}&ordering=-created_at`
        );
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.results || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cửa hàng hoặc sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);



  const handleBack = () => {
    const productId = location.state?.productId;
    if (productId) navigate(`/products/${productId}`);
    else navigate("/store");
  };

  const handleChat = () => {
    if (!token) {
      // Yêu cầu đăng nhập trước khi chat
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    // Nếu có trang chat, điều hướng sang đó. Tạm thời hiển thị thông báo.
    // navigate("/messages?with=seller_" + id);
    alert("Tính năng nhắn tin đang được phát triển. Vui lòng thử lại sau!");
  };

  const handleFollowToggle = async () => {
    if (!token) {
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    // TODO: Khi có API theo dõi, gọi API tại đây
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowers((c) => Math.max(0, c + (next ? 1 : -1)));
    localStorage.setItem(`followingShop_${id}`, String(next));
  };

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

  const stats = [
    { label: "Sản phẩm", value: products.length },
    { label: "Đánh giá", value: store.average_rating ?? "-" }, // cần backend bổ sung nếu muốn số thật
    { label: "Theo dõi", value: followers },
    { label: "Tham gia", value: formatJoined(store.created_at) },
  ];

  return (
    <Container className="my-4">
      {/* Header như Shopee: cover + avatar + thông tin + nút hành động */}
      <div
        className="position-relative mb-4"
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* Cover */}
        <div
          style={{
            height: 160,
            background:
              "linear-gradient(135deg, rgba(33,196,93,0.9), rgba(33,150,243,0.85))",
          }}
        />

        {/* Content overlay */}
        <div className="p-3 p-md-4" style={{ background: "#fff" }}>
          <Row className="align-items-center">
            <Col xs={12} md={8} className="d-flex align-items-center gap-3 gap-md-4">
              {/* Avatar */}
              <div
                className="flex-shrink-0"
                style={{
                  marginTop: -64,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: "4px solid #fff",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  background: "#f5f5f5",
                }}
              >
                <img
                  src={store.image || "/assets/logo/imagelogo.png"}
                  alt={store.store_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.src = "/assets/logo/imagelogo.png";
                  }}
                />
              </div>

              {/* Info */}
              <div className="mt-2 mt-md-0">
                <h3 className="fw-bold mb-1">{store.store_name}</h3>
<<<<<<< Updated upstream
=======
                <div className="d-flex gap-2">
                  <Button
                    variant={isFollowing ? "primary" : "outline-primary"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                  </Button>
                  <Button variant="outline-secondary" onClick={() => {
                    try {
                      // Save as last seller for global chat persistence
                      localStorage.setItem('chat:lastSellerId', String(id));
                      if (store?.store_name) localStorage.setItem('chat:lastSellerName', store.store_name);
                      if (store?.image) localStorage.setItem('chat:lastSellerImage', store.image);
                      window.dispatchEvent(new CustomEvent('chat:open', { detail: { sellerId: id } }));
                    } catch (e) {}
                  }}>Nhắn tin</Button>
                </div>
              </div>
            </Col>

            <Col xs={12} md={7} className="mt-3 mt-md-0">
              <div className="d-flex flex-column gap-2">
                <div>
                  <span className="fw-bold me-1">{followingCount}</span> Đang
                  theo dõi
                </div>
                <div>
                  <span className="fw-bold me-1">{followers}</span> Người theo
                  dõi
                </div>
                <div>
                  Đánh giá:{" "}
                  <span className="fw-bold">{ratingStats.avg.toFixed(1)}</span>{" "}
                  (<span className="fw-bold">{ratingStats.total}</span>)
                </div>
>>>>>>> Stashed changes
                {store.bio && (
                  <div className="text-muted mb-2" style={{ maxWidth: 560 }}>
                    {store.bio}
                  </div>
                )}
                {/* Stats */}
                <div className="d-flex flex-wrap align-items-center" style={{ gap: 16 }}>
                  {stats.map((s, idx) => (
                    <div key={idx} className="d-flex align-items-center" style={{ gap: 6 }}>
                      <span className="text-muted" style={{ fontSize: 13 }}>{s.label}:</span>
                      <strong style={{ fontSize: 14 }}>{String(s.value)}</strong>
                      {idx < stats.length - 1 && (
                        <span className="text-muted" style={{ margin: "0 6px" }}>|</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            {/* Actions */}
            <Col xs={12} md={4} className="mt-3 mt-md-0">
              <div className="d-flex justify-content-start justify-content-md-end gap-2">
                <Button variant="outline-primary" onClick={handleChat}>
                  Nhắn tin
                </Button>
                <Button
                  style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Thông tin liên hệ ngắn gọn */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
            <Card.Body>
              <div className="text-muted">Địa chỉ</div>
              <div className="fw-bold mt-1">{store.address || "Chưa cập nhật"}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
            <Card.Body>
              <div className="text-muted">Số điện thoại</div>
              <div className="fw-bold mt-1">{store.phone || "Chưa cập nhật"}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
            <Card.Body>
              <div className="text-muted">Trạng thái</div>
              <div className="fw-bold mt-1">
                <Badge bg={store.status === "active" ? "success" : "secondary"}>
                  {store.status || "unknown"}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Danh sách sản phẩm */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Sản phẩm của cửa hàng</h4>
        {/* Chỗ này có thể thêm filter/sort như Shopee sau */}
      </div>

      <Row>
        {products.length > 0 ? (
          products.map((product) => (
            <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
              <Link to={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card
                  className="h-100 shadow-sm border-0"
                  style={{ borderRadius: 15, overflow: "hidden", transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  <Card.Img
                    variant="top"
                    src={product.image || "/assets/logo/imagelogo.png"}
                    style={{ height: 200, objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.src = "/assets/logo/imagelogo.png"; }}
                  />
                  <Card.Body>
                    <Card.Title className="fw-bold" style={{ fontSize: "1rem", minHeight: 48 }}>
                      {product.name}
                    </Card.Title>

                    <div className="mb-2 d-flex align-items-center gap-2">
                      <span className="text-danger fw-bold">{formatVND(product.discounted_price ?? product.price)} VNĐ</span>
                    </div>

                    <Badge bg="secondary">Còn {product.stock} {product.unit}</Badge>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-muted">Chưa có sản phẩm nào.</p>
          </Col>
        )}
      </Row>

      {/* Nút quay lại */}
      <div className="mt-2">
        <Button variant="link" onClick={handleBack} className="p-0">
          ← Quay lại
        </Button>
      </div>
    </Container>
  );
};

export default StoreDetail;