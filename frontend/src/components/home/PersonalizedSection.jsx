// src/components/home/PersonalizedSection.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { Skeleton, Empty, Button } from "antd"; // <--- Thêm Empty và Button
import { productApi } from "../../features/products/services/productApi.js";
import ProductCard from "../../features/products/components/ProductCard.jsx";
import { useCart } from "../../features/cart/services/CartContext";
import "../../styles/home/PersonalizedSections.css";

// ... (Giữ nguyên component ProductSkeleton của bạn) ...
const ProductSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img"></div>
      <div className="skeleton-info">
        <div className="skeleton-text"></div>
        <div className="skeleton-text short"></div>
        <div className="skeleton-text" style={{ width: '40%', marginTop: '10px' }}></div>
      </div>
    </div>
  );
};

const PersonalizedSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "0px 0px 200px 0px",
  });

  const shuffleArray = useCallback((array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  useEffect(() => {
    if (inView && !hasLoaded) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const data = await productApi.getAllProducts();
          const shuffled = shuffleArray(data || []);
          setProducts(shuffled.slice(0, 15));
          setHasLoaded(true);
        } catch (error) {
          console.error("Lỗi tải gợi ý:", error);
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [inView, hasLoaded, shuffleArray]);

  const handleViewMore = () => navigate("/products");

  // --- UX CẢI TIẾN: EMPTY STATE ---
  // Nếu đã load xong mà không có sản phẩm (hoặc lỗi), hiển thị Empty State thay vì return null
  if (!loading && hasLoaded && products.length === 0) {
    return (
      <section ref={ref} className="container my-5 py-4 bg-white rounded shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4 px-3">
             <h2 className="section-title mb-0" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Gợi ý cho bạn
             </h2>
        </div>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-muted">
              Hôm nay chưa có gợi ý phù hợp nào dành cho bạn. <br/>
              Hãy khám phá thêm các sản phẩm khác nhé!
            </span>
          }
        >
          <Button type="primary" onClick={handleViewMore} style={{ background: '#28a745', borderColor: '#28a745' }}>
            Khám phá ngay
          </Button>
        </Empty>
      </section>
    );
  }

  return (
    <section ref={ref} className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title mb-0" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Gợi ý cho bạn
        </h2>
        {!loading && !error && (
          <span onClick={handleViewMore} className="text-primary cursor-pointer d-none d-md-block" style={{ cursor: 'pointer' }}>
            Xem tất cả
          </span>
        )}
      </div>

      <div className="product-grid-wrapper">
        {loading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(e) => {
                e.stopPropagation();
                addToCart(product.id, 1, product);
              }}
            />
          ))
        )}
      </div>

      {!loading && !error && products.length > 0 && (
        <div className="mt-4 text-center d-md-none">
          <button className="btn btn-outline-primary rounded-pill px-4" onClick={handleViewMore}>
            Xem thêm
          </button>
        </div>
      )}
    </section>
  );
};

export default PersonalizedSection;