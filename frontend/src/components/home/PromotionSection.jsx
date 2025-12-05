import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Typography,
  Button,
  Row,
  Col,
  Space,
  Badge,
  Flex,
  Skeleton,
  Tag,
  message,
} from "antd";
import {
  ArrowRightOutlined,
  EyeOutlined,
  FireOutlined,
  ThunderboltOutlined,
  StarFilled,
} from "@ant-design/icons";
import axios from "axios";
import NoImage from "../shared/NoImage";
import styles from "./PromotionSection.module.css";

const { Title, Text } = Typography;
const PRODUCTS_GRID_COUNT = 6;
const TOTAL_PRODUCTS_DISPLAYED = 7;
const DEFAULT_IMAGE_PATH =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";
const API_BASE_URL = "http://localhost:8000/api";

const formatPrice = (price) => {
  if (!price) return "0₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  })
    .format(price)
    .replace("₫", "₫");
};

const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return null;
  }
  const discountPercent = Math.round(
    ((originalPrice - currentPrice) / originalPrice) * 100
  );
  return `-${discountPercent}%`;
};

const transformProductData = (apiProduct) => {
  const mainImage =
    apiProduct.main_image?.image ||
    apiProduct.images?.[0]?.image ||
    DEFAULT_IMAGE_PATH;
  const originalPrice = apiProduct.original_price;
  const currentPrice = apiProduct.price;
  const discount = calculateDiscount(originalPrice, currentPrice);

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    image: mainImage,
    price: formatPrice(currentPrice),
    originalPrice:
      originalPrice && originalPrice > currentPrice
        ? formatPrice(originalPrice)
        : null,
    discount: discount,
    rating: apiProduct.rating || 0,
    sold: apiProduct.sold || 0,
  };
};

const HeroProductCard = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const hasValidImage =
    product.image && product.image !== DEFAULT_IMAGE_PATH && !imageError;

  return (
    <div className={styles.heroProductCard}>
      {/* 1. Phần Ảnh (Trên) */}
      <div className={styles.heroImageWrapper}>
        {product.discount && (
          <div className={styles.heroDiscountBadge}>
            <Tag color="red" className={styles.discountTag}>
              {product.discount}
            </Tag>
          </div>
        )}

        {hasValidImage ? (
          <img
            className={styles.heroProductImage}
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <NoImage height="100%" text={product.name} />
        )}
      </div>

      {/* 2. Phần Thông Tin (Dưới) */}
      <div className={styles.heroInfoContent}>
        {product.rating && (
          <div className={styles.heroRating}>
            <StarFilled style={{ color: "#fadb14", fontSize: "16px" }} />
            <span className={styles.heroRatingValue}>{product.rating}</span>
            <span className={styles.heroRatingText}>
              ({product.sold}+ đã bán)
            </span>
          </div>
        )}

        <Title
          level={3}
          className={styles.heroProductName}
          title={product.name}
        >
          {product.name}
        </Title>

        <div className={styles.heroFooter}>
          <div className={styles.heroPriceBlock}>
            <span className={styles.heroCurrentPrice}>{product.price}</span>
            {product.originalPrice && (
              <span className={styles.heroOriginalPrice}>
                {product.originalPrice}
              </span>
            )}
          </div>

          <Button
            type="primary"
            size="large"
            className={styles.heroCTA}
            icon={<EyeOutlined />}
          >
            Xem ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

const SmallProductCard = ({ product, badgeText, badgeColor }) => {
  const [imageError, setImageError] = useState(false);
  const hasValidImage =
    product.image && product.image !== DEFAULT_IMAGE_PATH && !imageError;

  return (
    <Badge.Ribbon
      text={badgeText}
      color={badgeColor}
      className={styles.ribbonBadge}
    >
      <Card
        hoverable
        className={styles.smallProductCard}
        cover={
          <div className={styles.smallCardImageWrapper}>
            {hasValidImage ? (
              <img
                className={styles.smallCardImage}
                src={product.image}
                alt={product.name}
                onError={() => setImageError(true)}
              />
            ) : (
              <NoImage height={200} text={product.name} />
            )}

            {product.discount && (
              <div className={styles.smallDiscountBadge}>
                <Tag color="red" className={styles.smallDiscountTag}>
                  {product.discount}
                </Tag>
              </div>
            )}

            <div className={styles.quickViewOverlay}>
              <EyeOutlined />
            </div>
          </div>
        }
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.smallCardContent}>
          <div className={styles.smallProductName}>{product.name}</div>

          {product.rating && (
            <div className={styles.smallRating}>
              <StarFilled style={{ color: "#fadb14", fontSize: "12px" }} />
              <span className={styles.smallRatingValue}>{product.rating}</span>
              <span className={styles.smallRatingCount}>({product.sold})</span>
            </div>
          )}

          <div className={styles.smallPriceSection}>
            <span className={styles.smallCurrentPrice}>{product.price}</span>
            {product.originalPrice && (
              <span className={styles.smallOriginalPrice}>
                {product.originalPrice}
              </span>
            )}
          </div>

          <div className={styles.smallCtaOnHover}>
            <Button
              type="primary"
              block
              size="small"
              className={styles.smallCTA}
              icon={<EyeOutlined />}
            >
              Xem ngay
            </Button>
          </div>
        </div>
      </Card>
    </Badge.Ribbon>
  );
};

// Enhanced Section component
function ProductSection({
  title,
  icon,
  iconColor,
  products,
  loading,
  viewMoreLink,
  badgeText,
  badgeColor,
}) {
  const heroProduct = products?.[0];
  let gridProducts = products?.slice(1, TOTAL_PRODUCTS_DISPLAYED);

  if (!loading && gridProducts && gridProducts.length < PRODUCTS_GRID_COUNT) {
    const missingCount = PRODUCTS_GRID_COUNT - gridProducts.length;
    for (let i = 0; i < missingCount; i++) {
      gridProducts.push({
        id: `placeholder-${title}-${i}`,
        name: "...",
        image: DEFAULT_IMAGE_PATH,
        isPlaceholder: true,
      });
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.sectionBlock}>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Skeleton.Input style={{ width: 240, height: 32 }} active />
          </Col>
        </Row>
        <Row gutter={32}>
          <Col lg={12} md={24} xs={24}>
            <Skeleton.Image
              active
              style={{ width: "100%", height: 480, borderRadius: 20 }}
            />
          </Col>
          <Col lg={12} md={24} xs={24}>
            <Row gutter={[20, 24]}>
              {[...Array(4)].map((_, i) => (
                <Col lg={12} md={12} sm={12} xs={12} key={i}>
                  <Card>
                    <Skeleton.Image
                      style={{ width: "100%", height: 200 }}
                      active
                    />
                    <Skeleton
                      paragraph={{ rows: 2 }}
                      active
                      style={{ marginTop: 12 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>
    );
  }

  if (!heroProduct) return null;

  return (
    <div className={styles.sectionBlock}>
      {/* Enhanced Header */}
      <div
        className={styles.sectionHeader}
        style={{ borderBottomColor: iconColor }}
      >
        <div className={styles.sectionHeaderContent}>
          <div
            className={styles.sectionIconWrapper}
            style={{ background: `${iconColor}15` }}
          >
            {React.cloneElement(icon, { style: { color: iconColor } })}
          </div>
          <Title
            level={2}
            className={styles.sectionTitle}
            style={{ color: iconColor }}
          >
            {title}
          </Title>
        </div>

        <Button
          type="text"
          href={viewMoreLink}
          className={styles.viewAllBtn}
          style={{ color: iconColor }}
        >
          Xem tất cả <ArrowRightOutlined />
        </Button>
      </div>

      {/* Product Layout */}
      <div className={styles.productLayout}>
        {/* Hero Product */}
        <div>
          <HeroProductCard product={heroProduct} />
        </div>

        {/* Grid Products */}
        <div className={styles.productGrid}>
          {gridProducts?.map((product) => (
            <div key={product.id}>
              {product.isPlaceholder ? (
                <Card>
                  <Skeleton.Image
                    style={{ height: 200, width: "100%" }}
                    active
                  />
                  <Skeleton
                    paragraph={{ rows: 2 }}
                    active
                    style={{ marginTop: 12 }}
                  />
                </Card>
              ) : (
                <SmallProductCard
                  product={product}
                  badgeText={badgeText}
                  badgeColor={badgeColor}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const fetchNewProducts = async (setProducts, setLoading) => {
  try {
    console.log(
      "[PromotionSection] Fetching new products from:",
      `${API_BASE_URL}/products/new-products/`
    );
    const response = await axios.get(`${API_BASE_URL}/products/new-products/`, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });
    console.log("[PromotionSection] New products fetched:", response.data);
    const transformed = response.data.map(transformProductData);
    setProducts(transformed);
  } catch (error) {
    console.error("[PromotionSection] Lỗi khi lấy sản phẩm mới:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    message.error("Không thể tải sản phẩm mới. Vui lòng kiểm tra backend.");
  } finally {
    setLoading(false);
  }
};

const fetchBestSellers = async (setProducts, setLoading) => {
  try {
    console.log(
      "[PromotionSection] Fetching best sellers from:",
      `${API_BASE_URL}/products/best-sellers/`
    );
    const response = await axios.get(`${API_BASE_URL}/products/best-sellers/`, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });
    console.log("[PromotionSection] Best sellers fetched:", response.data);
    const transformed = response.data.map(transformProductData);
    setProducts(transformed);
  } catch (error) {
    console.error("[PromotionSection] Lỗi khi lấy sản phẩm bán chạy:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    message.error(
      "Không thể tải sản phẩm bán chạy. Vui lòng kiểm tra backend."
    );
  } finally {
    setLoading(false);
  }
};

export default function PromotionSection() {
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);

  useEffect(() => {
    fetchNewProducts(setNewProducts, setLoadingNew);
    fetchBestSellers(setBestSellers, setLoadingBest);
  }, []);

  return (
    <div className={styles.promotionWrapper}>
      <ProductSection
        title="Sản phẩm mới"
        icon={<ThunderboltOutlined />}
        iconColor="#1677ff"
        products={newProducts}
        loading={loadingNew}
        viewMoreLink="/new-products"
        badgeText="Mới"
        badgeColor="blue"
      />

      <ProductSection
        title="Bán chạy nhất"
        icon={<FireOutlined />}
        iconColor="#f5222d"
        products={bestSellers}
        loading={loadingBest}
        viewMoreLink="/best-sellers"
        badgeText="Hot"
        badgeColor="red"
      />
    </div>
  );
}
