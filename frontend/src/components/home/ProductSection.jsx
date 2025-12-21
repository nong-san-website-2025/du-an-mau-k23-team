// src/components/home/PromotionSection.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Typography, Button, Skeleton, Empty, Row, Col } from "antd";
import { ArrowRightOutlined, InboxOutlined } from "@ant-design/icons";
import axios from "axios";

import ProductCard from "../../features/products/components/ProductCard";
import { useCart } from "../../features/cart/services/CartContext";
import styles from "./PromotionSection.module.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const DEFAULT_IMG = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";

// Hook giữ nguyên logic cũ nhưng tối ưu một chút
const useProductData = (endpoint) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!endpoint) return;
        const { data } = await axios.get(`${API_BASE_URL}${endpoint}`);
        
        const transformed = data.map((item) => ({
          id: item.id,
          name: item.name,
          main_image: { 
            image: item.main_image?.image || item.images?.[0]?.image || DEFAULT_IMG 
          },
          discounted_price: item.price,
          original_price: item.original_price,
          discount_percent: item.discount_percent || 
            (item.original_price && item.price 
              ? Math.round(((item.original_price - item.price) / item.original_price) * 100) 
              : 0),
          rating: item.rating || 5,
          sold: item.sold || 0,
          store_name: item.store_name || item.store?.store_name || "GreenFarm Official"
        }));

        setProducts(transformed);
      } catch (error) {
        console.error(`[PromotionSection] Error fetching ${endpoint}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint]);

  return { products, loading };
};

const PromotionSection = ({
  title,
  icon,
  // Đổi màu mặc định sang Xanh lá GreenFarm
  color = "#389e0d", 
  endpoint,
  viewMoreLink
}) => {
  const { products, loading } = useProductData(endpoint);
  const { addToCart } = useCart();

  // Lấy tối đa 8 sản phẩm (2 hàng trên desktop)
  const displayProducts = useMemo(() => products.slice(0, 6), [products]);

  const handleAddToCart = (e, product) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const productInfoForCart = {
      ...product,
      image: product.main_image?.image
    };
    addToCart(product.id, 1, productInfoForCart);
  };

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <section className={styles.sectionContainer}>
        <div className={styles.container}>
           <div className={styles.headerSkeleton}>
             <Skeleton.Input active size="large" style={{ width: 200 }} />
             <Skeleton.Button active size="small" style={{ width: 100 }} />
           </div>
           <Row gutter={[16, 24]}>
             {[...Array(4)].map((_, i) => (
               <Col xs={12} sm={12} md={8} lg={6} key={i}>
                 <div className={styles.skeletonCard}>
                   <Skeleton.Image active className={styles.skeletonImg} />
                   <div style={{ padding: 12 }}>
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

  // --- EMPTY STATE (Khi load xong nhưng không có data) ---
  if (!loading && products.length === 0) {
      return (
        <section className={styles.sectionContainer}>
           <div className={styles.container}>
                <div className={styles.sectionHeader} style={{ borderColor: `${color}30` }}>
                    <div className={styles.titleGroup}>
                        {/* Thanh dọc trang trí */}
                        <div className={styles.accentBar} style={{ background: color }}></div>
                        <Typography.Title level={2} className={styles.title} style={{ color: '#333' }}>
                            {title}
                        </Typography.Title>
                    </div>
                </div>
                <div className={styles.emptyWrapper}>
                    <Empty
                        image={<InboxOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                        description={<span className={styles.emptyText}>Chưa có sản phẩm nào trong mục này</span>}
                    >
                        <Button type="primary" ghost style={{ borderColor: color, color: color }} href="/products">
                            Khám phá cửa hàng
                        </Button>
                    </Empty>
                </div>
           </div>
        </section>
      );
  }

  // --- RENDER CHÍNH ---
  return (
    <section className={styles.sectionContainer}>
      <div className={styles.container}>
        
        {/* 1. Header Section Cải tiến */}
        <div className={styles.sectionHeader}>
          <div className={styles.titleGroup}>
            {/* Điểm nhấn thương hiệu */}
            <div className={styles.accentBar} style={{ background: color }}></div>
            
            <div className={styles.titleTextWrapper}>
                <Typography.Title 
                    level={2} 
                    className={styles.title}
                >
                    {title}
                </Typography.Title>
                {/* Nếu muốn hiển thị icon nhỏ bên cạnh title thì bỏ comment dòng dưới */}
                {/* <span style={{ color: color, fontSize: 20, marginLeft: 8 }}>{icon}</span> */}
            </div>
          </div>

          <Button 
            type="text" 
            href={viewMoreLink} 
            className={styles.viewMoreBtn}
          >
            Xem tất cả <ArrowRightOutlined />
          </Button>
        </div>

        {/* 2. Grid System dùng Ant Design Row/Col */}
        <Row gutter={[16, 24]}> 
          {displayProducts.map((product) => (
            <Col 
                key={product.id} 
                xs={12}   // Mobile: 2 cột (rất quan trọng cho sàn TMĐT)
                sm={12}   // Tablet nhỏ: 2 cột
                md={8}    // Tablet: 3 cột
                lg={8}    // Desktop: 4 cột
                xl={8}
            >
              <div className={styles.cardWrapper}>
                  <ProductCard 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    showAddToCart={true}
                  />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default PromotionSection;