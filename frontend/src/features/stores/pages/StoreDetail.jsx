import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShoppingCart } from "lucide-react";
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
  // Dummy addToCart function (tùy bạn có thể import từ CartContext nếu cần)
  const addToCart = (productId) => {
    toast.success("Đã thêm vào giỏ hàng!", { position: "top-right", autoClose: 1500 });
    // TODO: Thực hiện logic thêm vào giỏ hàng thực tế
  };
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activeSub, setActiveSub] = useState("Tất cả");
  const [search, setSearch] = useState("");

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

  // Lấy danh sách danh mục và subcategory từ products
  const categories = store?.products
    ? Array.from(
        new Set(store.products.map((p) => p.category || "Khác"))
      ).map((cat) => ({
        name: cat,
        subcategories: Array.from(
          new Set(
            store.products
              .filter((p) => (p.category || "Khác") === cat)
              .map((p) => p.subcategory || "Khác")
          )
        ),
      }))
    : [];

  // Lọc sản phẩm theo danh mục và subcategory
  let filteredProducts = store?.products || [];
  if (activeCategory !== "Tất cả") {
    filteredProducts = filteredProducts.filter(
      (p) => (p.category || "Khác") === activeCategory
    );
  }
  if (activeSub !== "Tất cả") {
    filteredProducts = filteredProducts.filter(
      (p) => (p.subcategory || "Khác") === activeSub
    );
  }
  if (search) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

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

      {/* Danh mục sản phẩm + tìm kiếm */}
      <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="success">{categories.length} danh mục</Badge>
          <Badge bg="info">{store?.products?.length || 0} sản phẩm</Badge>
        </div>
        <input
          type="search"
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs danh mục */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          variant={activeCategory === "Tất cả" ? "dark" : "light"}
          size="sm"
          onClick={() => {
            setActiveCategory("Tất cả");
            setActiveSub("Tất cả");
          }}
        >
          Tất cả
          <Badge bg="secondary" className="ms-1">
            {store?.products?.length || 0}
          </Badge>
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.name}
            variant={activeCategory === cat.name ? "dark" : "light"}
            size="sm"
            onClick={() => {
              setActiveCategory(cat.name);
              setActiveSub("Tất cả");
            }}
          >
            {cat.name}
            <Badge bg="secondary" className="ms-1">
              {store.products.filter((p) => (p.category || "Khác") === cat.name).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Subcategory Tabs */}
      {activeCategory !== "Tất cả" && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button
            variant={activeSub === "Tất cả" ? "dark" : "light"}
            size="sm"
            onClick={() => setActiveSub("Tất cả")}
          >
            Tất cả
            <Badge bg="secondary" className="ms-1">
              {store.products.filter((p) => (p.category || "Khác") === activeCategory).length}
            </Badge>
          </Button>
          {categories
            .find((cat) => cat.name === activeCategory)
            ?.subcategories.map((sub) => (
              <Button
                key={sub}
                variant={activeSub === sub ? "dark" : "light"}
                size="sm"
                onClick={() => setActiveSub(sub)}
              >
                {sub}
                <Badge bg="secondary" className="ms-1">
                  {store.products.filter(
                    (p) =>
                      (p.category || "Khác") === activeCategory &&
                      (p.subcategory || "Khác") === sub
                  ).length}
                </Badge>
              </Button>
            ))}
        </div>
      )}

      {/* Danh sách sản phẩm */}
      <h4 className="fw-bold mb-4">🛒 Sản phẩm của cửa hàng</h4>
      {filteredProducts.length > 0 ? (
        <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3">
          {filteredProducts.map((product) => (
            <Col key={product.id}>
              <Card
                className="h-100 shadow-sm border-0"
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-5px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  className="position-relative"
                  style={{ height: 160, cursor: "pointer", backgroundColor: "#f8f9fa" }}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <Card.Img
                    variant="top"
                    src={
                      product.image && product.image.startsWith("/")
                        ? `http://localhost:8000${product.image}`
                        : product.image?.startsWith("http")
                        ? product.image
                        : "https://via.placeholder.com/400x300?text=No+Image"
                    }
                    alt={product.name}
                    style={{ height: "100%", objectFit: "cover" }}
                  />
                  {product.is_organic && (
                    <Badge bg="success" className="position-absolute top-0 start-0 m-2">
                      Hữu cơ
                    </Badge>
                  )}
                  {product.is_best_seller && (
                    <Badge bg="warning" text="dark" className="position-absolute top-0 start-50 translate-middle-x m-2">
                      Bán chạy
                    </Badge>
                  )}
                  {product.is_new && (
                    <Badge bg="info" className="position-absolute top-0 end-0 m-2">
                      Mới
                    </Badge>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fs-6 fw-semibold text-truncate" title={product.name}>
                    {product.name}
                  </Card.Title>
                  <div className="d-flex align-items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>
                        {i < Math.floor(product.rating || 0) ? (
                          <svg width="14" height="14" fill="currentColor" className="text-warning" viewBox="0 0 24 24"><path d="M12 17.75l-6.172 3.245 1.179-6.881-5-4.873 6.9-1.002L12 2.25l3.093 6.989 6.9 1.002-5 4.873 1.179 6.881z"/></svg>
                        ) : (
                          <svg width="14" height="14" fill="currentColor" className="text-muted" viewBox="0 0 24 24"><path d="M12 17.75l-6.172 3.245 1.179-6.881-5-4.873 6.9-1.002L12 2.25l3.093 6.989 6.9 1.002-5 4.873 1.179 6.881z"/></svg>
                        )}
                      </span>
                    ))}
                    <small className="text-muted ms-1">
                      ({product.review_count || 0})
                    </small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="fw-bold text-danger">
                      {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
                    </span>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => addToCart(product.id)}
                    >
                      <ShoppingCart size={16} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p className="text-muted">Chưa có sản phẩm nào.</p>
      )}
    </Container>
  );
};

export default StoreDetail;
