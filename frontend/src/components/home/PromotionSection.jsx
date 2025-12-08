import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Button,
  Skeleton,
  Rate,
  Empty, // <--- 1. Import thêm Empty
} from "antd";
import {
  ArrowRightOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  FireOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";
import styles from "./PromotionSection.module.css";

// --- CONSTANTS ---
const API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_IMG = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";

// --- UTILS ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const calculateDiscount = (original, current) => {
  if (!original || !current || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
};

// --- COMPONENT: SMART IMAGE (Tối ưu Skeleton Loading + Antd Empty) ---
const SmartImage = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Reset state khi src thay đổi
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  return (
    <div className={styles.smartImageContainer}>
      {/* 1. Layer Skeleton: Chỉ hiện khi chưa load xong và chưa lỗi */}
      {!isLoaded && !isError && (
        <div className={styles.skeletonWrapper}>
          <Skeleton.Image active />
        </div>
      )}

      {/* 2. Layer Error Fallback: Hiện khi ảnh lỗi -> Dùng Empty của Ant Design */}
      {isError && (
        <div 
          className={styles.skeletonWrapper} 
          style={{ 
            background: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          {/* Sử dụng component Empty chế độ Simple cho gọn */}
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={<span style={{ fontSize: 12, color: '#999' }}>No Image</span>} 
          />
        </div>
      )}

      {/* 3. Layer Real Image: Luôn render nhưng ẩn (opacity 0) cho đến khi load xong */}
      {!isError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsLoaded(true); // Tắt skeleton
            setIsError(true);  // Bật lỗi để hiện Empty
          }}
          className={`${styles.realImage} ${isLoaded ? styles.loaded : ''}`}
        />
      )}
    </div>
  );
};

// --- CUSTOM HOOK: Data Fetching ---
const useProductData = (endpoint) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}${endpoint}`);
        
        const transformed = data.map((item) => ({
          id: item.id,
          name: item.name,
          // Ưu tiên ảnh main, nếu không có thì lấy ảnh đầu tiên, không có nữa thì fallback
          image: item.main_image?.image || item.images?.[0]?.image || DEFAULT_IMG,
          price: item.price,
          originalPrice: item.original_price,
          discountPercent: calculateDiscount(item.original_price, item.price),
          rating: item.rating || 5,
          sold: item.sold || 0,
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

// --- COMPONENT: HERO PRODUCT (Cột Trái - Card Lớn) ---
const HeroProduct = React.memo(({ product }) => {
  if (!product) return null;

  return (
    <div className={styles.heroCard}>
      <div className={styles.heroImageWrapper}>
        {product.discountPercent && (
          <div className={styles.discountBadge}>-{product.discountPercent}%</div>
        )}
        <SmartImage src={product.image} alt={product.name} />
      </div>
      
      <div className={styles.heroContent}>
        <Typography.Title 
          level={4} 
          className={styles.name} 
          style={{ fontSize: 18, height: 'auto', marginBottom: 8 }}
          title={product.name}
        >
          {product.name}
        </Typography.Title>
        
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
          <Rate disabled defaultValue={product.rating} style={{ fontSize: 14, color: '#fadb14' }} />
          <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>({product.sold} đã bán)</span>
        </div>
        
        <div className={styles.priceGroup} style={{ marginBottom: 20 }}>
          <span className={styles.price} style={{ fontSize: 24 }}>{formatCurrency(product.price)}</span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
        
        <Button 
          type="primary" 
          size="large" 
          block 
          style={{ height: 48, borderRadius: 8, fontWeight: 500 }}
          icon={<ShoppingCartOutlined />}
        >
          Mua ngay
        </Button>
      </div>
    </div>
  );
});

// --- COMPONENT: PRODUCT ITEM (Lưới Phải - Card Nhỏ) ---
const ProductItem = React.memo(({ product }) => {
  return (
    <div className={styles.productCard}>
      <div className={styles.imgWrapper}>
        {product.discountPercent && (
          <div className={styles.discountBadge}>-{product.discountPercent}%</div>
        )}
        <SmartImage src={product.image} alt={product.name} />

        {/* Hover Actions */}
        <div className={styles.quickAction}>
          <Button type="primary" shape="circle" icon={<EyeOutlined />} />
          <Button type="default" shape="circle" icon={<ShoppingCartOutlined />} />
        </div>
      </div>

      <div className={styles.info}>
        <div>
          <div className={styles.name} title={product.name}>{product.name}</div>
          <div className={styles.priceGroup}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>{formatCurrency(product.originalPrice)}</span>
            )}
          </div>
        </div>
        
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Rate disabled defaultValue={product.rating} style={{ fontSize: 11, color: '#fadb14' }} />
          <span style={{ fontSize: 11, color: '#999' }}>Đã bán {product.sold}</span>
        </div>
      </div>
    </div>
  );
});

// --- SECTION COMPONENT ---
const ProductSection = ({ title, icon, color, endpoint, viewMoreLink }) => {
  const { products, loading } = useProductData(endpoint);
  
  const heroProduct = products[0];
  const gridProducts = useMemo(() => products.slice(1, 7), [products]);

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
           <Skeleton.Input active size="large" style={{ width: 200 }} />
        </div>
        <div className={styles.gridContainer}>
          <div className={styles.leftCol}>
             {/* Skeleton Hero */}
             <div style={{ height: '100%', minHeight: 400, background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <Skeleton.Image active style={{ width: '100%', height: '60%' }} />
                <div style={{ padding: 20 }}>
                   <Skeleton active paragraph={{ rows: 2 }} />
                </div>
             </div>
          </div>
          <div className={styles.rightGrid}>
            {/* Skeleton Grid */}
            {[...Array(6)].map((_, i) => (
               <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fff' }}>
                  <div style={{ paddingTop: '100%', position: 'relative' }}>
                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Skeleton.Image active />
                     </div>
                  </div>
                  <div style={{ padding: 10 }}>
                     <Skeleton active paragraph={{ rows: 1 }} title={false} />
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className={styles.container}>
      {/* Header */}
      <div className={styles.header} style={{ borderBottomColor: `${color}20` }}>
        <div className={styles.titleWrapper}>
          <div className={styles.iconBox} style={{ backgroundColor: `${color}15`, color: color }}>
            {icon}
          </div>
          <Typography.Title level={2} style={{ margin: 0, color: color, fontSize: 24 }}>
            {title}
          </Typography.Title>
        </div>
        <Button type="link" href={viewMoreLink} style={{ color: color }}>
          Xem tất cả <ArrowRightOutlined />
        </Button>
      </div>

      {/* Grid Content */}
      <div className={styles.gridContainer}>
        {/* Left: Hero Product */}
        <div className={styles.leftCol}>
           <HeroProduct product={heroProduct} />
        </div>

        {/* Right: Small Grid */}
        <div className={styles.rightGrid}>
          {gridProducts.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
          
          {/* Fill empty cells */}
          {[...Array(Math.max(0, 6 - gridProducts.length))].map((_, idx) => (
             <div key={`empty-${idx}`} style={{ background: '#f9f9f9', borderRadius: 12, border: '1px dashed #e8e8e8' }} />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- MAIN EXPORT ---
export default function PromotionSection() {
  return (
    <div style={{ padding: "40px 0", background: "#f8f9fa" }}>
      <ProductSection
        title="Sản phẩm mới"
        icon={<ThunderboltOutlined />}
        color="#1677ff" 
        endpoint="/products/new-products/"
        viewMoreLink="/new-products"
      />

      <div style={{ height: 40 }} /> 

      <ProductSection
        title="Bán chạy nhất"
        icon={<FireOutlined />}
        color="#f5222d" 
        endpoint="/products/best-sellers/"
        viewMoreLink="/best-sellers"
      />
    </div>
  );
}