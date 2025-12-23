// src/components/home/PersonalizedSection.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { Skeleton, Empty, Button, Row, Col, Typography } from "antd"; 
import { ArrowRightOutlined, BulbFilled } from "@ant-design/icons";
import { productApi } from "../../features/products/services/productApi.js";
import ProductCard from "../../features/products/components/ProductCard.jsx";
import { useCart } from "../../features/cart/services/CartContext.js";

// Import CSS Module mới (Thay thế file css cũ)
import styles from "./PersonalizedSection.module.css"; 

const { Title } = Typography;

const PersonalizedSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Trigger load khi cuộn tới gần (cách 200px)
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
          // Lấy 12 sản phẩm để chia hết cho các cột (2, 3, 4, 6) đều đẹp
          setProducts(shuffled.slice(0, 18)); 
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

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product.id, 1, product);
  };

  // --- SKELETON LOADING (Đồng bộ Ant Design) ---
  if (loading) {
    return (
      <section className={styles.sectionContainer}>
        <div className={styles.container}>
            <div className={styles.headerSkeleton}>
                 <Skeleton.Input active size="large" style={{ width: 200 }} />
                 <Skeleton.Button active size="small" />
            </div>
            <Row gutter={[16, 24]}>
                {[...Array(6)].map((_, i) => (
                    <Col xs={12} sm={8} md={6} lg={4} key={i}>
                         <div className={styles.skeletonCard}>
                             <Skeleton.Image active className={styles.skeletonImg} />
                             <div style={{ padding: 10 }}>
                                <Skeleton active paragraph={{ rows: 2 }} title={false} />
                             </div>
                         </div>
                    </Col>
                ))}
            </Row>
        </div>
      </section>
    );
  }

  // --- ERROR HOẶC EMPTY STATE ---
  if (!loading && hasLoaded && (products.length === 0 || error)) {
     return null; // Hoặc render component Empty nếu muốn
  }

  // --- MAIN RENDER ---
  return (
    <section ref={ref} className={styles.sectionContainer}>
      <div className={styles.container}>
        
        {/* HEADER SECTION: Title + Button gom chung */}
        <div className={styles.sectionHeader}>
            <div className={styles.titleGroup}>
                {/* Thanh dọc điểm nhấn màu cam/đỏ cho khác biệt với Promotion màu xanh */}
                <div className={styles.accentBar}></div> 
                <div className={styles.titleWrapper}>
                    <Title level={2} className={styles.title}>
                        GỢI Ý HÔM NAY
                    </Title>
                </div>
            </div>

            <Button 
                type="text" 
                onClick={handleViewMore}
                className={styles.viewMoreBtn}
            >
                Xem tất cả <ArrowRightOutlined />
            </Button>
        </div>

        {/* CONTENT GRID */}
        <div className={styles.gridWrapper}>
             <Row gutter={[16, 24]}>
                {products.map((product) => (
                    <Col 
                        key={product.id} 
                        xs={12}   // Mobile: 2 cột
                        sm={12}   // Tablet nhỏ: 2 cột
                        md={8}    // Tablet vừa: 3 cột
                        lg={6}    // Laptop: 4 cột
                        xl={4}    // Màn hình lớn: 6 cột (Hiển thị nhiều hàng gợi ý)
                    >
                        <div style={{ height: '100%' }}>
                            <ProductCard
                                product={product}
                                onAddToCart={(e) => handleAddToCart(e, product)}
                            />
                        </div>
                    </Col>
                ))}
            </Row>
        </div>

        {/* Nút xem thêm mobile (chỉ hiện trên màn nhỏ) */}
        <div className={styles.mobileViewMore}>
             <Button type="primary" ghost block onClick={handleViewMore}>
                 Xem thêm gợi ý khác
             </Button>
        </div>

      </div>
    </section>
  );
};

export default PersonalizedSection;