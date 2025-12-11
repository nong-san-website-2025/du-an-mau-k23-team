// src/components/home/PersonalizedSection.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "antd"; // <--- Import Ant Design
import { productApi } from "../../features/products/services/productApi.js";
import ProductCard from "../../features/products/components/ProductCard.jsx";
import { useCart } from "../../features/cart/services/CartContext.js";
import "../../styles/home/PersonalizedSections.css";

// --- SUB-COMPONENT: SKELETON LOADER CHUẨN ANT DESIGN ---
const ProductSkeleton = () => {
  return (
    <div className="card h-100 border-0 shadow-sm overflow-hidden">
      {/* Phần giả lập ảnh sản phẩm:
         - Skeleton.Image của Antd mặc định là hình vuông nhỏ.
         - Ta dùng flexbox của Bootstrap để căn giữa nó trong khung hình chữ nhật.
         - bg-light giúp tạo khung nền xám nhẹ cho giống khung ảnh.
      */}
      <div 
        className="d-flex justify-content-center align-items-center bg-light position-relative" 
        style={{ height: "200px" }} // Chiều cao khớp với ảnh thật
      >
        {/* active: tạo hiệu ứng sóng chạy qua */}
        <Skeleton.Image active style={{ transform: "scale(1.5)" }} /> 
      </div>

      {/* Phần giả lập thông tin (Tên + Giá) */}
      <div className="card-body p-3">
        {/* active: hiệu ứng sóng; paragraph: giả lập các dòng text mô tả */}
        <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 1, width: '40%' }} />
        
        {/* Giả lập nút bấm (nếu cần) */}
        <div className="mt-2">
             <Skeleton.Button active size="small" shape="round" block={false} style={{ width: 80 }} />
        </div>
      </div>
    </div>
  );
};

const PersonalizedSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
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

  if (!loading && hasLoaded && products.length === 0 && !error) return null;

  return (
    <section ref={ref} className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title mb-0" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
            Gợi ý cho bạn
        </h2>
        {!loading && !error && (
            <span onClick={handleViewMore} className="text-primary cursor-pointer d-none d-md-block" style={{cursor: 'pointer'}}>
                Xem tất cả
            </span>
        )}
      </div>

      <div className="product-grid-wrapper"> 
        {/* Note: Class 'product-grid-wrapper' lấy từ file CSS ở câu trả lời trước */}
        
        {loading ? (
          // Render 12 Skeletons khi đang loading
          Array.from({ length: 12 }).map((_, index) => (
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
      
      {/* Fallback button mobile */}
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