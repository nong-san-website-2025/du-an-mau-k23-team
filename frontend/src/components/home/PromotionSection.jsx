import React, { useEffect, useState, useMemo } from "react";
import { Typography, Button, Skeleton } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import axios from "axios";

// --- IMPORTS ---
// 1. Import ProductCard
import ProductCard from "../../features/products/components/ProductCard"; 
// 2. Import CartContext (Kiểm tra lại đường dẫn nếu cần)
import { useCart } from "../../features/cart/services/CartContext";
// 3. Import CSS
import styles from "./PromotionSection.module.css";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_IMG = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";

// --- HOOK FETCH DATA & ADAPTER ---
const useProductData = (endpoint) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!endpoint) return;

        const { data } = await axios.get(`${API_BASE_URL}${endpoint}`);
        
        // [ADAPTER] Chuyển đổi dữ liệu API sang format ProductCard cần
        const transformed = data.map((item) => ({
          id: item.id,
          name: item.name,
          
          // 1. Xử lý ảnh: ProductCard cần obj main_image hoặc fallback
          main_image: { 
            image: item.main_image?.image || item.images?.[0]?.image || DEFAULT_IMG 
          },
          
          // 2. Xử lý giá: ProductCard dùng discounted_price và original_price
          discounted_price: item.price, // Giá bán hiện tại
          original_price: item.original_price, // Giá gốc (nếu có)
          
          // 3. Tính % giảm giá
          discount_percent: item.discount_percent || 
            (item.original_price && item.price 
              ? Math.round(((item.original_price - item.price) / item.original_price) * 100) 
              : 0),
          
          // 4. Các thông tin phụ
          rating: item.rating || 5,
          sold: item.sold || 0,
          features: item.features || [],
          availability_status: item.availability_status || 'in_stock',
          
          // Giữ lại thông tin store cho CartContext
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

// --- COMPONENT CHÍNH ---
const ProductSection = ({
  title,          // Tiêu đề
  icon,           // Icon
  color = "#1677ff", // Màu chủ đạo
  endpoint,       // API Endpoint
  viewMoreLink    // Link xem tất cả
}) => {
  const { products, loading } = useProductData(endpoint);
  
  // ✅ 1. Lấy hàm addToCart từ Context
  const { addToCart } = useCart();

  // Chỉ lấy đúng 8 sản phẩm
  const displayProducts = useMemo(() => products.slice(0, 8), [products]);

  // ✅ 2. Xử lý logic thêm vào giỏ hàng
  const handleAddToCart = (e, product) => {
    // Ngăn chặn sự kiện nổi bọt (nếu ProductCard chưa xử lý)
    if (e && e.stopPropagation) e.stopPropagation();

    // Chuẩn bị data cho CartContext
    // Context mong đợi trường 'image' nằm ở root object để hiển thị trong Guest Cart/Notification
    const productInfoForCart = {
      ...product,
      image: product.main_image?.image // Flatten ảnh ra ngoài
    };

    console.log("Adding to cart:", product.name);
    
    // Gọi hàm từ Context: (productId, quantity, productInfo)
    addToCart(product.id, 1, productInfoForCart);
  };

  // --- RENDER LOADING (SKELETON) ---
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

  // Nếu không có sản phẩm nào thì ẩn luôn section
  if (!products || products.length === 0) return null;

  // --- RENDER CONTENT ---
  return (
    <section className={styles.container}>
      {/* 1. Header Section */}
      <div className={styles.header} style={{ borderBottomColor: `${color}20` }}>
        <div className={styles.titleWrapper}>
          {/* Icon Box */}
          <div className={styles.iconBox} style={{ backgroundColor: `${color}15`, color: color }}>
            {icon}
          </div>

          {/* Title */}
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

        {/* Nút Xem tất cả */}
        <Button 
          type="text" 
          href={viewMoreLink} 
          className={styles.viewMoreBtn}
          style={{ color: '#888' }}
        >
          Xem tất cả <ArrowRightOutlined />
        </Button>
      </div>

      {/* 2. Grid Product Cards */}
      <div className={styles.gridContainer}>
        {displayProducts.map((product) => (
          <div key={product.id} style={{ height: '100%' }}> 
            <ProductCard 
              product={product} 
              onAddToCart={handleAddToCart} // ✅ Truyền hàm đã kết nối Context
              showAddToCart={true}
            />
          </div>
        ))}
        
        {/* Fill ô trống */}
        {[...Array(Math.max(0, 8 - displayProducts.length))].map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;