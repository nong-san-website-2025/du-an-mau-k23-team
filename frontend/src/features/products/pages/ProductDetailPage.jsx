import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../../cart/services/CartContext";
import { useParams, useNavigate } from "react-router-dom";
import { Badge, Button, Spinner, Alert, ButtonGroup } from "react-bootstrap";
import { ShoppingCart, ChevronLeft, Star, Minus, Plus, Heart, TrendingUp } from "lucide-react";
import { productApi } from "../services/productApi";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1); // ✅
  const [showSoldInfo, setShowSoldInfo] = useState(false);
  const [suggested, setSuggested] = useState([]);

  // Lấy gợi ý sản phẩm cùng danh mục
  useEffect(() => {
    if (!product || !product.category) return;
    const fetchSuggested = async () => {
      try {
        const all = await productApi.getAllProducts();
        // Lọc sản phẩm cùng danh mục, loại trừ chính nó
        const sameCategory = all.filter(p => p.category === product.category && p.id !== product.id);
        setSuggested(sameCategory);
      } catch {}
    };
    fetchSuggested();
  }, [product]);

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
      (err) => {
        toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
      }
    );
    setAdding(false);
  };

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

          {/* Đã bán + icon + yêu thích + modal mô tả */}
          <div className="mb-3 d-flex align-items-center gap-3">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setShowSoldInfo(true)}
              title="Xem thông tin lượt bán"
            >
              <TrendingUp size={18} className="text-success me-1" />
              <span className="fw-semibold text-dark">Đã bán 20+</span>
            </div>
            <button
              style={{ background: 'none', border: 'none', padding: 0, marginLeft: 8, cursor: 'pointer' }}
              title="Thêm vào yêu thích"
              onClick={() => {
                // Lưu vào wishlist localStorage
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const item = {
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  inStock: product.stock > 0
                };
                if (!wishlist.some(p => p.id === item.id)) {
                  wishlist.push(item);
                  localStorage.setItem('wishlist', JSON.stringify(wishlist));
                  toast.success('Đã thêm vào danh sách yêu thích!');
                } else {
                  toast.info('Sản phẩm đã có trong danh sách yêu thích.');
                }
              }}
            >
              <Heart size={22} color="#e53935" fill="none" />
            </button>
          </div>
          {showSoldInfo && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.25)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setShowSoldInfo(false)}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: 24,
                  maxWidth: 400,
                  boxShadow: '0 2px 16px #bbb',
                  textAlign: 'center',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                <h5 className="mb-3">Thông tin lượt bán</h5>
                <p style={{ color: '#444', fontSize: 15 }}>
                  Lượt bán này được tổng hợp từ lượt bán thành công của các sản phẩm tương tự trên Greenfram, để giúp người mua có thêm thông tin tham khảo về sản phẩm trước khi quyết định mua hàng.
                </p>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowSoldInfo(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}

          {/* ✅ Chọn số lượng */}
          <div className="mb-3">
            <strong>Số lượng:</strong>{" "}
            <ButtonGroup>
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
          </div>


          <div className="mb-3 d-flex gap-2">
            <Button
              variant="success"
              size="lg"
              disabled={adding}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={20} className="me-2" /> Thêm vào giỏ hàng
            </Button>
            <Button
              variant="warning"
              size="lg"
              style={{ color: '#fff', fontWeight: 600 }}
              onClick={async () => {
                await handleAddToCart();
                navigate('/cart');
              }}
            >
              Mua ngay
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
      {/* Gợi ý sản phẩm cùng danh mục */}
      {suggested.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h5 style={{ fontWeight: 600, marginBottom: 16 }}>Gợi ý cho bạn</h5>
          <div className="row">
            {suggested.map(item => (
              <div key={item.id} className="col-md-4 mb-4">
                <div
                  className="card h-100 border-0 shadow-sm overflow-hidden product-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${item.id}`)}
                >
                  <img
                    src={item.image && item.image.startsWith("/") ? `http://localhost:8000${item.image}` : item.image || "/logo192.png"}
                    alt={item.name}
                    style={{ height: 180, objectFit: 'cover', width: '100%' }}
                  />
                  <div className="card-body p-3">
                    <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 6 }}>{item.name}</div>
                    <div style={{ color: "#e53935", fontWeight: 700, fontSize: 16 }}>{item.price?.toLocaleString()} đ</div>
                    <div style={{ color: item.inStock ? '#388e3c' : '#bdbdbd', fontSize: 13 }}>{item.inStock ? 'Còn hàng' : 'Hết hàng'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;   