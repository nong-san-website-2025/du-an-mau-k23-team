import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";
import { productApi } from "../../products/services/productApi";

const FeaturedProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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
      <Row className="g-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Col key={product.id} md={3} sm={6} xs={12}>
              <Card className="shadow-sm border-0 h-100">
                <div className="text-center p-3">
                  <img
                    src={
                      product.image && product.image.startsWith("/")
                        ? `http://localhost:8000${product.image}`
                        : product.image?.startsWith("http")
                        ? product.image
                        : "https://via.placeholder.com/300x200?text=No+Image"
                    }
                    alt={product.name}
                    className="img-fluid rounded"
                    style={{ maxHeight: 180, objectFit: "contain" }}
                  />
                </div>
                <Card.Body>
                  <h5 className="fw-bold mb-2">{product.name}</h5>
                  <div className="mb-2">
                    <span className="text-success fw-bold fs-5">
                        {product.discount > 0
                          ? `${Math.round(product.price * (1 - product.discount / 100)).toLocaleString("vi-VN")} VNĐ`
                          : `${Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ`}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-muted text-decoration-line-through ms-2">
                          {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
                      </span>
                    )}
                    <span className="ms-2 text-muted">/ {product.unit}</span>
                  </div>
                  <div className="mb-2">
                    <span className="me-2">⭐ {product.rating} ({product.review_count})</span>
                    {product.is_best_seller && (
                      <span className="badge bg-warning text-dark">Bán chạy</span>
                    )}
                  </div>
                  <Button
                    variant="outline-success"
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-100"
                  >
                    Xem chi tiết
                  </Button>
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
