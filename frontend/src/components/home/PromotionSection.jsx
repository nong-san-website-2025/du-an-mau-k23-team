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

const { Title, Text } = Typography;
const PRODUCTS_GRID_COUNT = 4;
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
    <div className="hero-product-card">
      {hasValidImage ? (
        <img
          src={product.image}
          alt={product.name}
          onError={() => setImageError(true)}
        />
      ) : (
        <NoImage height={450} text={product.name} />
      )}

      {product.discount && (
        <div className="hero-discount-badge">
          <Tag
            color="red"
            style={{
              fontSize: "16px",
              padding: "6px 12px",
              fontWeight: "bold",
              border: "none",
              boxShadow: "0 2px 8px rgba(255,77,79,0.3)",
            }}
          >
            {product.discount}
          </Tag>
        </div>
      )}

      <div className="hero-product-card-overlay">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {/* Rating */}
          {product.rating && (
            <Space size={4}>
              <StarFilled style={{ color: "#fadb14", fontSize: "16px" }} />
              <Text style={{ color: "#fff", fontWeight: 500 }}>
                {product.rating}
              </Text>
              <Text
                style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}
              >
                ({product.sold}+ đã bán)
              </Text>
            </Space>
          )}

          {/* Tên sản phẩm */}
          <Title
            level={3}
            style={{
              color: "#fff",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "2.6em",
              lineHeight: "1.3em",
            }}
          >
            {product.name}
          </Title>

          {/* Giá cả (đặt dưới tiêu đề, căn phải) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 12,
            }}
          >
            {/* Giá cả */}
            <div style={{ textAlign: "left" }}>
              <Text
                style={{
                  color: "#4caf50",
                  fontSize: "24px",
                  fontWeight: "bold",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {product.price}
              </Text>
              {product.originalPrice && (
                <Text
                  delete
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "16px",
                    display: "inline-block",
                    marginLeft: 8,
                  }}
                >
                  {product.originalPrice}
                </Text>
              )}
            </div>

            {/* CTA Button */}
            <Button
              type="primary"
              size="large"
              style={{
                height: "48px",
                fontWeight: 600,
                fontSize: "16px",
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)",
              }}
              icon={<EyeOutlined />}
            >
              Xem chi tiết
            </Button>
          </div>
        </Space>
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
      style={{ fontSize: "12px", fontWeight: 600 }}
    >
      <Card
        hoverable
        className="small-product-card"
        cover={
          <div className="small-card-image-wrapper">
            {hasValidImage ? (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImageError(true)}
              />
            ) : (
              <NoImage height={180} text={product.name} />
            )}

            {product.discount && (
              <div className="small-discount-badge">
                <Tag color="red" style={{ fontWeight: "bold", border: "none" }}>
                  {product.discount}
                </Tag>
              </div>
            )}

            <div className="quick-view-overlay">
              <EyeOutlined style={{ fontSize: "24px", color: "#fff" }} />
            </div>
          </div>
        }
        styles={{ body: { padding: "12px 16px" } }}
      >
        {/* Tên sản phẩm */}
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: 500,
            fontSize: "14px",
            marginBottom: "8px",
            minHeight: "21px",
          }}
        >
          {product.name}
        </div>

        {/* Rating */}
        {product.rating && (
          <Space size={4} style={{ marginBottom: "8px" }}>
            <StarFilled style={{ color: "#fadb14", fontSize: "12px" }} />
            <Text style={{ fontSize: "12px", color: "#595959" }}>
              {product.rating}
            </Text>
            <Text style={{ fontSize: "11px", color: "#8c8c8c" }}>
              ({product.sold})
            </Text>
          </Space>
        )}

        {/* Giá */}
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Text
            strong
            style={{
              color: "#ff4d4f",
              fontSize: "16px",
              display: "block",
            }}
          >
            {product.price}
          </Text>
          {product.originalPrice && (
            <Text
              delete
              style={{
                fontSize: "13px",
                color: "#8c8c8c",
              }}
            >
              {product.originalPrice}
            </Text>
          )}
        </Space>

        {/* CTA hiển thị khi hover */}
        <div className="cta-on-hover">
          <Button
            type="primary"
            block
            size="small"
            icon={<EyeOutlined />}
            style={{
              marginTop: "12px",
              fontWeight: 500,
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              border: "none",
            }}
          >
            Xem ngay
          </Button>
        </div>
      </Card>
    </Badge.Ribbon>
  );
};

// Enhanced Section với header đẹp hơn
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

  if (loading) {
    return (
      <div className="section-block">
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Skeleton.Input style={{ width: 200, height: 32 }} active />
          </Col>
        </Row>
        <Row gutter={24}>
          <Col lg={12} md={24} xs={24}>
            <Skeleton.Image
              active
              style={{ width: "100%", height: 450, borderRadius: 16 }}
            />
          </Col>
          <Col lg={12} md={24} xs={24}>
            <Row gutter={[16, 16]}>
              {[...Array(4)].map((_, i) => (
                <Col lg={12} md={12} sm={12} xs={12} key={i}>
                  <Card>
                    <Skeleton.Image
                      style={{ width: "100%", height: 180 }}
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
    <div className="section-block">
      {/* Enhanced Header */}
      <div className="section-header">
        <Flex align="center" gap="middle">
          <div
            className="section-icon-wrapper"
            style={{ background: `${iconColor}15` }}
          >
            {React.cloneElement(icon, {
              style: { fontSize: "28px", color: iconColor },
            })}
          </div>
          <Title
            level={2}
            style={{
              margin: 0,
              background: `linear-gradient(135deg, ${iconColor} 0%, ${iconColor}aa 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </Title>
        </Flex>

        {/* View all link - desktop */}
        <Button
          type="text"
          href={viewMoreLink}
          className="view-all-desktop"
          style={{
            color: iconColor,
            fontWeight: 500,
            display: "none",
          }}
        >
          Xem tất cả <ArrowRightOutlined />
        </Button>
      </div>

      {/* Product Layout */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Hero Product */}
        <Col lg={12} md={24} xs={24}>
          <HeroProductCard product={heroProduct} />
        </Col>

        {/* Grid Products */}
        <Col lg={12} md={24} xs={24}>
          <List
            grid={{
              gutter: 16,
              xs: 2,
              sm: 2,
              md: 2,
              lg: 2,
            }}
            dataSource={gridProducts}
            renderItem={(p) => (
              <List.Item style={{ marginBottom: 0 }}>
                {p.isPlaceholder ? (
                  <Card>
                    <Skeleton.Image
                      style={{ height: 180, width: "100%" }}
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
                    product={p}
                    badgeText={badgeText}
                    badgeColor={badgeColor}
                  />
                )}
              </List.Item>
            )}
          />
        </Col>
      </Row>

      {/* CTA Button - Mobile */}
      {products.length > TOTAL_PRODUCTS_DISPLAYED && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button
            type="primary"
            size="large"
            href={viewMoreLink}
            icon={<ArrowRightOutlined />}
            style={{
              fontWeight: 600,
              height: "48px",
              padding: "0 32px",
              fontSize: "16px",
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)",
            }}
          >
            Xem tất cả {title.toLowerCase()}
          </Button>
        </div>
      )}
    </div>
  );
}

const fetchNewProducts = async (setProducts, setLoading) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/new-products/`);
    const transformed = response.data.map(transformProductData);
    setProducts(transformed);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm mới:", error);
    message.error("Không thể tải sản phẩm mới. Vui lòng thử lại sau.");
  } finally {
    setLoading(false);
  }
};

const fetchBestSellers = async (setProducts, setLoading) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/best-sellers/`);
    const transformed = response.data.map(transformProductData);
    setProducts(transformed);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
    message.error("Không thể tải sản phẩm bán chạy. Vui lòng thử lại sau.");
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
    <>
      <style>{`
        /* ===== GLOBAL STYLES ===== */
        .section-block {
          margin-bottom: 64px;
          padding: 0 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
        }

        .section-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .section-icon-wrapper:hover {
          transform: scale(1.05);
        }

        @media (min-width: 768px) {
          .view-all-desktop {
            display: inline-flex !important;
          }
        }

        /* ===== HERO CARD STYLES ===== */
        .hero-product-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          height: 100%;
          min-height: 450px;
          cursor: pointer;
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .hero-product-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-product-card:hover img {
          transform: scale(1.08);
        }

        .hero-discount-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 2;
          animation: bounceIn 0.6s ease-out;
        }

        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .hero-product-card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 32px;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.5) 40%,
            rgba(0, 0, 0, 0.85) 100%
          );
          color: #fff;
          transform: translateY(20px);
          opacity: 0.9;
          transition: all 0.4s ease;
        }

        .hero-product-card:hover .hero-product-card-overlay {
          transform: translateY(0);
          opacity: 1;
        }

        /* ===== SMALL CARD STYLES ===== */
        .small-product-card {
          border-radius: 12px;
          overflow: hidden;
          height: 100%;
          border: 1px solid #f0f0f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .small-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border-color: #1677ff;
        }

        .small-card-image-wrapper {
          position: relative;
          height: 180px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .small-card-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .small-product-card:hover .small-card-image-wrapper img {
          transform: scale(1.1);
        }

        .small-discount-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 2;
        }

        .quick-view-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .small-product-card:hover .quick-view-overlay {
          opacity: 1;
        }

        .cta-on-hover {
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transform: translateY(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .small-product-card:hover .cta-on-hover {
          opacity: 1;
          max-height: 50px;
          transform: translateY(0);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .section-block {
            margin-bottom: 40px;
          }

          .hero-product-card {
            min-height: 350px;
          }

          .hero-product-card-overlay {
            padding: 20px;
          }

          .small-card-image-wrapper {
            height: 140px;
          }

          .section-icon-wrapper {
            width: 48px;
            height: 48px;
          }
        }

        /* ===== ANIMATIONS ===== */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-block {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>

      <div
        style={{
          padding: "40px 20px",
          maxWidth: 1400,
          margin: "0 auto",
          background: "#fafafa",
        }}
      >
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
    </>
  );
}
