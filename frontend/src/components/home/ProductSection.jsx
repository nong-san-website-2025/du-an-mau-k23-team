// src/components/home/PromotionSection.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Typography, Button, Skeleton, Empty } from "antd"; // <--- Import Empty
import { ArrowRightOutlined, InboxOutlined } from "@ant-design/icons"; // <--- Import Icon cho Empty
import axios from "axios";

import ProductCard from "../../features/products/components/ProductCard"; 
import { useCart } from "../../features/cart/services/CartContext";
import styles from "./PromotionSection.module.css";

const API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_IMG = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";

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
          features: item.features || [],
          availability_status: item.availability_status || 'in_stock',
          store: item.store || null,
          store_name: item.store_name || item.store?.store_name || ""
        }));

        setProducts(transformed);
      } catch (error) {
        console.error(`[ProductSection] Error fetching ${endpoint}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint]);

  return { products, loading };
};

const ProductSection = ({
  title,
  icon,
  color = "#1677ff",
  endpoint,
  viewMoreLink
}) => {
  const { products, loading } = useProductData(endpoint);
  const { addToCart } = useCart();

  const displayProducts = useMemo(() => products.slice(0, 8), [products]);

  const handleAddToCart = (e, product) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const productInfoForCart = {
      ...product,
      image: product.main_image?.image
    };
    addToCart(product.id, 1, productInfoForCart);
  };

  // --- SKELETON LOADING ---
  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.header}>
          <Skeleton.Input active size="large" style={{ width: 250, height: 40 }} />
        </div>
        <div className={styles.gridContainer}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
              <Skeleton.Image active style={{ width: '100%', height: 180 }} />
              <div style={{ padding: 12 }}>
                <Skeleton active paragraph={{ rows: 2 }} title />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // --- RENDER CONTENT ---
  return (
    <section className={styles.container}>
      {/* 1. Header Section (Luôn hiển thị kể cả khi rỗng) */}
      <div className={styles.header} style={{ borderBottomColor: `${color}20` }}>
        <div className={styles.titleWrapper}>
          <div className={styles.iconBox} style={{ backgroundColor: `${color}15`, color: color }}>
            {icon}
          </div>
          <Typography.Title
            level={1}
            style={{
              margin: 0,
              fontSize: '28px',
              color: color,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1.2
            }}
          >
            {title}
          </Typography.Title>
        </div>

        {/* Ẩn nút xem thêm nếu không có sản phẩm */}
        {products.length > 0 && (
          <Button 
            type="text" 
            href={viewMoreLink} 
            className={styles.viewMoreBtn}
            style={{ color: '#888' }}
          >
            Xem tất cả <ArrowRightOutlined />
          </Button>
        )}
      </div>

      {/* 2. Grid Product Cards HOẶC Empty State */}
      {displayProducts.length > 0 ? (
        <div className={styles.gridContainer}>
          {displayProducts.map((product) => (
            <div key={product.id} style={{ height: '100%' }}> 
              <ProductCard 
                product={product} 
                onAddToCart={handleAddToCart}
                showAddToCart={true}
              />
            </div>
          ))}
          {[...Array(Math.max(0, 8 - displayProducts.length))].map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}
        </div>
      ) : (
        // --- UX CẢI TIẾN: EMPTY STATE KHI KHÔNG CÓ DATA ---
        <div className="py-5 bg-white rounded text-center">
            <Empty
                image={<InboxOutlined style={{ fontSize: 60, color: '#e0e0e0' }} />}
                description={
                    <span style={{ color: '#999', fontSize: '16px' }}>
                        Danh mục này hiện đang được cập nhật thêm sản phẩm.
                    </span>
                }
            >
                <Button href="/products">Xem các sản phẩm khác</Button>
            </Empty>
        </div>
      )}
    </section>
  );
};

export default ProductSection;