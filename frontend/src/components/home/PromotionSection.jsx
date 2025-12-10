import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Button,
  Skeleton,
  Rate,
  Empty,
  Tooltip
} from "antd";
import {
  ArrowRightOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  HeartOutlined
} from "@ant-design/icons";
import axios from "axios";
import styles from "./PromotionSection.module.css"; // Giữ nguyên file CSS cũ

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

// --- COMPONENT CON: SMART IMAGE ---
const SmartImage = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  return (
    <div className={styles.smartImageContainer}>
      {!isLoaded && !isError && (
        <div className={styles.skeletonWrapper}>
          <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      {isError && (
        <div className={styles.skeletonWrapper} style={{ background: '#f5f5f5' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
        </div>
      )}
      {!isError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => { setIsLoaded(true); setIsError(true); }}
          className={`${styles.realImage} ${isLoaded ? styles.loaded : ''}`}
        />
      )}
    </div>
  );
};

// --- HOOK: DATA FETCHING ---
const useProductData = (endpoint) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Nếu không có endpoint thì không fetch
        if (!endpoint) return;

        const { data } = await axios.get(`${API_BASE_URL}${endpoint}`);
        const transformed = data.map((item) => ({
          id: item.id,
          name: item.name,
          image: item.main_image?.image || item.images?.[0]?.image || DEFAULT_IMG,
          price: item.price,
          originalPrice: item.original_price,
          discountPercent: calculateDiscount(item.original_price, item.price),
          rating: item.rating || 5,
          sold: item.sold || 0,
        }));
        setProducts(transformed);
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint]);

  return { products, loading };
};

// --- COMPONENT CON: PRODUCT ITEM ---
const ProductItem = React.memo(({ product }) => {
  return (
    <div className={styles.productCard}>
      <div className={styles.imgWrapper}>
        {product.discountPercent && (
          <div className={styles.discountBadge}>-{product.discountPercent}%</div>
        )}
        <SmartImage src={product.image} alt={product.name} />

        <div className={styles.quickAction}>
          <Tooltip title="Xem chi tiết">
            <Button shape="circle" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Yêu thích">
            <Button shape="circle" icon={<HeartOutlined />} danger />
          </Tooltip>
          <Tooltip title="Thêm giỏ hàng">
            <Button type="primary" shape="circle" icon={<ShoppingCartOutlined />} />
          </Tooltip>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.name} title={product.name}>{product.name}</div>
        <div>
          <div className={styles.priceGroup}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className={styles.originalPrice}>{formatCurrency(product.originalPrice)}</span>
            )}
          </div>
          <div className={styles.metaInfo}>
            <Rate disabled defaultValue={product.rating} style={{ fontSize: 10 }} />
            <span>Đã bán {product.sold}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// --- MAIN COMPONENT (EXPORT DEFAULT) ---
// Đây là component tái sử dụng, nhận props để render nội dung tương ứng
// --- MAIN COMPONENT (EXPORT DEFAULT) ---
const ProductSection = ({
  title,
  icon,
  color = "#1677ff", // Màu mặc định
  endpoint,
  viewMoreLink
}) => {
  const { products, loading } = useProductData(endpoint);

  const displayProducts = useMemo(() => products.slice(0, 8), [products]);

  // Loading State
  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.header}>
          <Skeleton.Input active size="large" style={{ width: 300, height: 40 }} />
        </div>
        <div className={styles.gridContainer}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #f0f0f0' }}>
              <div style={{ paddingBottom: '100%', marginBottom: 10 }}><Skeleton.Image active style={{ width: '100%', height: '100%' }} /></div>
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className={styles.container}>
      {/* Header */}
      <div className={styles.header} style={{ borderBottomColor: `${color}20` }}>
        <div className={styles.titleWrapper}>

          {/* Icon Box */}
          <div className={styles.iconBox} style={{ backgroundColor: `${color}15`, color: color }}>
            {icon}
          </div>

          {/* Title: Đã cập nhật Style */}
          <Typography.Title
            level={1}
            style={{
              margin: 0,
              fontSize: '28px',    // Kích thước lớn chuẩn heading section
              color: color,        // <--- Lấy màu từ props (giống icon)
              fontWeight: 800,     // In đậm
              textTransform: 'uppercase', // (Tuỳ chọn) Viết hoa toàn bộ cho giống tiêu đề lớn
              letterSpacing: '0.5px',
              lineHeight: 1.2
            }}
          >
            {title}
          </Typography.Title>
        </div>

        <Button type="text" href={viewMoreLink} style={{ color: '#666', fontSize: 14 }}>
          Xem tất cả <ArrowRightOutlined />
        </Button>
      </div>

      {/* Grid Content */}
      <div className={styles.gridContainer}>
        {displayProducts.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
        {/* Fill empty slots */}
        {[...Array(Math.max(0, 8 - displayProducts.length))].map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;