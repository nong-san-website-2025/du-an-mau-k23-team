import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Badge,
  Button,
  Form,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import { message } from "antd";

const { Meta } = Card;

// Format tiền VND
const formatVND = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return Math.round(n).toLocaleString("vi-VN");
};

// Format ngày
const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

// Lấy chữ cái đầu từ tên cửa hàng làm avatar nếu không có ảnh
const getInitial = (name) =>
  name ? String(name).trim().charAt(0).toUpperCase() : "S";

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // 1) Lấy thông tin cửa hàng
        const storeRes = await axios.get(
          `http://localhost:8000/api/sellers/${id}/`,
          { headers: authHeader }
        );
        setStore(storeRes.data);
        setFollowers(storeRes.data.followers_count || 0);
        setIsFollowing(Boolean(storeRes.data.is_following));

        // 2) Lấy danh sách sản phẩm của cửa hàng
        const productsRes = await axios.get(
          `http://localhost:8000/api/products/?seller=${id}&ordering=-created_at`
        );
        setProducts(
          Array.isArray(productsRes.data)
            ? productsRes.data
            : productsRes.data?.results || []
        );

        // 3) Lấy voucher: của shop + toàn sàn (gộp dữ liệu)
        const [sellerVoucherRes, systemVoucherRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/promotions/vouchers/`, {
            params: { active: true, seller: id, ordering: "-created_at" },
          }),
          axios.get(`http://localhost:8000/api/promotions/vouchers/`, {
            params: { active: true, scope: "system", ordering: "-created_at" },
          }),
        ]);

        const combined = [
          ...(sellerVoucherRes.data?.results || sellerVoucherRes.data || []),
          ...(systemVoucherRes.data?.results || systemVoucherRes.data || []),
        ];

        // Lọc voucher hợp lệ theo thời gian
        const now = new Date();
        const valid = (v) =>
          (!v.start_at || new Date(v.start_at) <= now) &&
          (!v.end_at || new Date(v.end_at) >= now) &&
          v.active;

        setVouchers(combined.filter(valid));
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [id, token]);

  // Copy voucher
  const handleCopyVoucher = (v) => {
    navigator.clipboard.writeText(v.code);
    message.success(`Đã sao chép voucher ${v.code}`);
  };

  // Chọn voucher để áp dụng
  const handleUseVoucher = (v) => {
    localStorage.setItem(
      "selectedVoucher",
      JSON.stringify({ code: v.code, sellerId: id, savedAt: Date.now() })
    );
    message.success(`Voucher ${v.code} đã được chọn, áp dụng khi thanh toán`);
  };

  // Theo dõi hoặc bỏ theo dõi cửa hàng
  const handleFollow = async () => {
    if (!token) {
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (!isFollowing) {
        await axios.post(
          `http://localhost:8000/api/sellers/${id}/follow/`,
          {},
          { headers }
        );
        setFollowers((f) => f + 1);
      } else {
        await axios.delete(
          `http://localhost:8000/api/sellers/${id}/follow/`,
          { headers }
        );
        setFollowers((f) => Math.max(0, f - 1));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi cập nhật trạng thái theo dõi");
    }
  };

  // Tính toán đánh giá trung bình
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
      const simpleAvg =
        products.reduce((s, p) => s + Number(p.rating || 0), 0) /
        products.length;
      return { avg: Number.isFinite(simpleAvg) ? simpleAvg : 0, total: 0 };
    }
    return { avg: weightedSum / totalReviews, total: totalReviews };
  }, [products]);

  // Lọc sản phẩm theo từ khóa
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name}`.toLowerCase().includes(q));
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!store) {
    return <p className="text-center my-5">❌ Không tìm thấy cửa hàng.</p>;
  }

  const followingCount = Number(store.following_count || 0);

  return (
    <Container className="my-4">
      {/* Header cửa hàng */}
      <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="align-items-center">
            <Col xs={12} md={5} className="d-flex align-items-center gap-3">
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
                <h3 className="fw-bold mb-1">{store.store_name}</h3>
                <div className="d-flex gap-2">
                  <Button
                    variant={isFollowing ? "primary" : "outline-primary"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                  </Button>
                  <Button variant="outline-secondary">Nhắn tin</Button>
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

      {/* Voucher */}
      <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <Card.Body>
          {vouchers && vouchers.length > 0 ? (
            <div className="d-flex flex-wrap" style={{ gap: 8 }}>
              {vouchers.slice(0, 8).map((v) => (
                <Badge
                  key={v.id || v.code}
                  bg="light"
                  text="dark"
                  className="p-2 border"
                  style={{ borderRadius: 10, cursor: "pointer" }}
                  onClick={() => handleUseVoucher(v)}
                >
                  {v.title || v.campaign_name || v.code}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-muted">Hiện chưa có voucher nào.</div>
          )}
        </Card.Body>
      </Card>

      {/* Tìm kiếm sản phẩm */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Sản phẩm của cửa hàng</h4>
        <div style={{ minWidth: 280 }}>
          <InputGroup>
            <Form.Control
              placeholder="Tìm trong cửa hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="primary">Tìm</Button>
          </InputGroup>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <Row>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
              <Link
                to={`/products/${product.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card
                  className="h-100 shadow-sm border-0"
                  style={{
                    borderRadius: 15,
                    overflow: "hidden",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 24px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  <Card.Img
                    variant="top"
                    src={(() => {
                      const placeholder = "https://via.placeholder.com/300x200?text=No+Image";
                      if (!product.image) return placeholder;
                      if (product.image.startsWith("http")) return product.image;
                      if (product.image.startsWith("/")) return `http://localhost:8000${product.image}`;
                      return `http://localhost:8000/media/${product.image}`;
                    })()}
                    style={{ height: 200, objectFit: "cover" }}
                    onError={e => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
                  />
                  <Card.Body>
                    <Card.Title
                      className="fw-bold"
                      style={{ fontSize: "1rem", minHeight: 48 }}
                    >
                      {product.name}
                    </Card.Title>
                    <div className="mb-2 d-flex align-items-center gap-2">
                      <span className="text-danger fw-bold">
                        {formatVND(product.discounted_price ?? product.price)}{" "}
                        VNĐ
                      </span>
                    </div>
                    <Badge bg="secondary">
                      Còn {product.stock} {product.unit}
                    </Badge>
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
    </Container>
  );
};

export default StoreDetail;
