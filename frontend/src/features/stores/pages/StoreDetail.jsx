import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Badge, Button, Form, InputGroup } from "react-bootstrap";
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

// Lấy chữ cái đầu từ tên cửa hàng làm avatar nếu không có ảnh
const getInitial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : "S");

const StoreDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [vouchers, setVouchers] = useState([]); // dynamic vouchers from promotions API

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
        // 1) Seller detail (includes followers_count, is_following if authenticated)
        const sellerRes = await axios.get(`http://localhost:8000/api/sellers/${id}/`, { headers: authHeader });
        setStore(sellerRes.data);

        const initialFollowers = Number(sellerRes.data.followers_count || sellerRes.data.followers || 0);
        setFollowers(Number.isNaN(initialFollowers) ? 0 : initialFollowers);
        setIsFollowing(Boolean(sellerRes.data.is_following));

        // 2) Products by seller (public)
        const productsRes = await axios.get(
          `http://localhost:8000/api/products/?seller=${id}&ordering=-created_at`
        );
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.results || []);

        // 3) Vouchers from promotions service (filter by seller, active, and time window)
        try {
          // Gọi trực tiếp theo seller để backend lọc sẵn voucher hợp lệ
          const vRes = await axios.get(`http://localhost:8000/api/promotions/vouchers/?seller=${id}`);
          const list = Array.isArray(vRes.data) ? vRes.data : vRes.data?.results || [];
          setVouchers(list);
        } catch (e) {
          setVouchers([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cửa hàng hoặc sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

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
    const headers = { Authorization: `Bearer ${token}` };
    const next = !isFollowing;
    // Optimistic UI update
    setIsFollowing(next);
    setFollowers((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (next) {
        await axios.post(`http://localhost:8000/api/sellers/${id}/follow/`, {}, { headers });
      } else {
        await axios.delete(`http://localhost:8000/api/sellers/${id}/follow/`, { headers });
      }
    } catch (e) {
      // rollback on error
      setIsFollowing(!next);
      setFollowers((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  };

  // Tính toán đánh giá trung bình và tổng số đánh giá từ các sản phẩm của shop
  const ratingStats = useMemo(() => {
    if (!products || products.length === 0) return { avg: 0, total: 0 };
    let totalReviews = 0;
    let weightedSum = 0;
    for (const p of products) {
      const r = Number(p.rating || 0);
      const c = Number(p.review_count || 0);
      totalReviews += c;
      weightedSum += r * c;
    }
    if (totalReviews === 0) {
      // fallback: trung bình không trọng số nếu chưa có review_count
      const simpleAvg = products.reduce((s, p) => s + Number(p.rating || 0), 0) / products.length;
      return { avg: Number.isFinite(simpleAvg) ? simpleAvg : 0, total: 0 };
    }
    return { avg: weightedSum / totalReviews, total: totalReviews };
  }, [products]);

  // Lọc sản phẩm theo từ khóa — chỉ trong cửa hàng này
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name}`.toLowerCase().includes(q));
  }, [products, searchQuery]);

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

  // Nếu backend có following_count thì lấy, nếu không tạm để 0
  const followingCount = Number(store.following_count || 0);

  return (
    <Container className="my-4">
      {/* Header: bỏ banner dài, chia 2/5 - 3/5 */}
      <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="align-items-center">
            {/* 2/5: Avatar + nút Theo dõi/Nhắn tin */}
            <Col xs={12} md={5} className="d-flex align-items-center gap-3">
              {/* Avatar */}
              <div
                className="flex-shrink-0 d-flex align-items-center justify-content-center"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: "4px solid #fff",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  background: "#e9ecef",
                  color: "#6c757d",
                  fontSize: 48,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {store.image ? (
                  <img
                    src={store.image}
                    alt={store.store_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitial(store.store_name)
                )}
              </div>

              <div className="d-flex flex-column align-items-start gap-2">
                {/* Tên cửa hàng dời sang trái sát avatar */}
                <h3 className="fw-bold mb-1">{store.store_name}</h3>
                <div className="d-flex gap-2">
                  {/* Nút Theo dõi: mặc định màu nhạt (outline), khi đã theo dõi thì đậm */}
                  <Button
                    variant={isFollowing ? "primary" : "outline-primary"}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                  </Button>
                  <Button variant="outline-secondary" onClick={handleChat}>
                    Nhắn tin
                  </Button>
                </div>
              </div>
            </Col>

            {/* 3/5: Thông tin */}
            <Col xs={12} md={7} className="mt-3 mt-md-0">
              {/* 2 hàng: Đang theo dõi, Người theo dõi */}
              <div className="d-flex flex-column gap-2">
                <div>
                  <span className="fw-bold me-1">{followingCount}</span>
                  Đang theo dõi
                </div>
                <div>
                  <span className="fw-bold me-1">{followers}</span>
                  Người theo dõi
                </div>
                {/* Trường đánh giá (xóa chữ "(Đánh giá)") */}
                <div>
                  Đánh giá: <span className="fw-bold">{ratingStats.avg.toFixed(1)}</span>
                  {" "}
                  (<span className="fw-bold">{ratingStats.total}</span>)
                </div>
                {store.bio && (
                  <div className="text-muted" style={{ maxWidth: 560 }}>
                    {store.bio}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Hàng voucher lấy động từ promotions (không gắn cứng) */}
      <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <Card.Body>
          {vouchers && vouchers.length > 0 ? (
            <div className="d-flex flex-wrap" style={{ gap: 8 }}>
              {vouchers.slice(0, 8).map((v) => (
                <Badge key={v.id || v.code} bg="light" text="dark" className="p-2 border" style={{ borderRadius: 10 }}>
                  {v.title || v.campaign_name || v.code}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-muted">Hiện chưa có voucher nào.</div>
          )}
        </Card.Body>
      </Card>

      {/* Tìm kiếm chỉ trong cửa hàng này */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Sản phẩm của cửa hàng</h4>
        <div style={{ minWidth: 280 }}>
          <InputGroup>
            <Form.Control
              placeholder="Tìm trong cửa hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="primary">Tìm trong cửa hàng</Button>
          </InputGroup>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <Row>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
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
                  {product.image ? (
                    <Card.Img
                      variant="top"
                      src={product.image}
                      style={{ height: 200, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ height: 200, background: "#f1f3f5" }} />
                  )}
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
            <p className="text-muted">Không tìm thấy sản phẩm phù hợp.</p>
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