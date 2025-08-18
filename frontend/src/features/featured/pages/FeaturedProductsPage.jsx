import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Spinner, Button, Badge } from "react-bootstrap";
import { ShoppingCart, Star, Star as StarFill } from "lucide-react";
import { productApi } from "../../products/services/productApi";
import { useCart } from "../../cart/services/CartContext";
import { toast } from "react-toastify";

const FeaturedProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
  const data = await productApi.getAllProducts();
        // Sắp xếp: bán chạy lên đầu
  const bestSellerProducts = data.filter(p => p.is_best_seller);
  setProducts(bestSellerProducts);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Đang tải sản phẩm nổi bật...</p>
      </div>
    );
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    setAddingId(product.id);
    await addToCart(
      product.id,
      1,
      () => {
        toast.success("Đã thêm vào giỏ hàng!", { position: "top-right", autoClose: 1500 });
        setAddingId(null);
      },
      (err) => {
        setAddingId(null);
        if (err?.response?.status === 401) {
          toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", { position: "top-right" });
        } else {
          toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.", { position: "top-right" });
        }
      },
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image:
          product.image && product.image.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image?.startsWith("http")
            ? product.image
            : "",
      }
    );
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Sản phẩm nổi bật</h2>
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Tìm kiếm sản phẩm nổi bật..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>
      <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
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
                          <StarFill size={14} className="text-warning" />
                        ) : (
                          <Star size={14} className="text-muted" />
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
                      disabled={addingId === product.id}
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingCart size={16} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <div className="text-center text-muted py-5">Không tìm thấy sản phẩm nổi bật phù hợp.</div>
        )}
      </Row>
    </div>
  );
};

export default FeaturedProductsPage;
