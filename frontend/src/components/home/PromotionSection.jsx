import React, { useEffect, useState } from "react";
import {
  Card,
  Spin,
  List,
  Typography,
  Button,
  Row,
  Col,
  Space,
  Badge,
  Flex,
  Skeleton,
} from "antd";
import {
  ArrowRightOutlined,
  EyeOutlined,
  FireOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  fetchNewProducts,
  fetchBestSellers,
} from "../../features/products/services/productApi";
import "../../styles/home/PromotionSection.css"; // Import file CSS

const { Title, Text } = Typography;
const PRODUCTS_GRID_COUNT = 4;
const TOTAL_PRODUCTS_DISPLAYED = 5;
const DEFAULT_IMAGE_PATH = "/path/to/your/default_image.png";

// --- (CẬP NHẬT) Component Card "Hero" ---
// Chúng ta sẽ thêm style để giới hạn số dòng cho Title và Text
const HeroProductCard = ({ product }) => (
  <div className="hero-product-card">
    <img src={product.image || DEFAULT_IMAGE_PATH} alt={product.name} />
    <div className="hero-product-card-overlay">
      <Title
        level={3}
        style={{
          // (MỚI) Giới hạn tên sản phẩm hero thành 2 dòng
          display: "-webkit-box",
          WebkitLineClamp: 2, // Số dòng tối đa
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minHeight: "2.6em", // Giữ chỗ cho 2 dòng (line-height ~1.3em)
        }}
      >
        {product.name}
      </Title>
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.85)",
          // (MỚI) Giới hạn text mô tả thành 1 dòng
          display: "-webkit-box",
          WebkitLineClamp: 1, // Số dòng tối đa
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Khám phá ngay sản phẩm {product.name?.toLowerCase()}
      </Text>
      <Button type="primary" style={{ marginTop: 16 }} icon={<EyeOutlined />}>
        Xem chi tiết
      </Button>
    </div>
  </div>
);

// --- Component Card "Grid" (Không thay đổi) ---
// Component này đã có sẵn logic giới hạn 1 dòng, không cần sửa
const SmallProductCard = ({ product, badgeText, badgeColor }) => {
  const imageUrl = product.image || DEFAULT_IMAGE_PATH;

  return (
    <Badge.Ribbon text={badgeText} color={badgeColor}>
      <Card
        key={product.id}
        hoverable
        className="small-product-card"
        cover={
          <div style={{ height: 160, overflow: "hidden" }}>
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.4s ease-out",
              }}
            />
          </div>
        }
        bodyStyle={{ padding: 16 }}
      >
        <Card.Meta
          title={
            // Logic giới hạn 1 dòng đã có sẵn ở đây
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",

              }}
            >
              {product.name}
            </div>
          }
        />
        <div className="cta-on-hover">
          <Space style={{ color: "#1677ff", cursor: "pointer" }}>
            <EyeOutlined />
            <span>Xem chi tiết</span>
          </Space>
        </div>
      </Card>
    </Badge.Ribbon>
  );
};

// --- Component Section chính (Không thay đổi) ---
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
      <div className="section-block" style={{ marginBottom: 40 }}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Flex align="center" gap="small">
              <span style={{ fontSize: "24px", color: iconColor }}>{icon}</span>
              <Title
                level={3}
                style={{ margin: 0, textTransform: "uppercase" }}
              >
                {title}
              </Title>
            </Flex>
          </Col>
        </Row>
        {/* Layout Skeleton */}
        <Row gutter={24}>
          <Col lg={12} md={24} xs={24}>
            <Skeleton.Input
              active
              style={{ width: "100%", height: 400, borderRadius: 12 }}
            />
          </Col>
          <Col lg={12} md={24} xs={24}>
            <Row gutter={[16, 16]}>
              {[...Array(4)].map((_, i) => (
                <Col lg={12} md={12} sm={12} xs={12} key={i}>
                  <Skeleton.Input
                    active
                    style={{ width: "100%", height: 160, borderRadius: 8 }}
                  />
                  <Skeleton
                    title={false}
                    paragraph={{ rows: 1, width: "80%" }}
                    active
                  />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>
    );
  }

  if (!heroProduct) {
    return null;
  }

  return (
    <div className="section-block" style={{ marginBottom: 40 }}>
      {/* 1. HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Flex align="center" gap="small">
            <span style={{ fontSize: "24px", color: iconColor }}>{icon}</span>
            <Title
              level={3}
              style={{ margin: 0, textTransform: "uppercase" }}
            >
              {title}
            </Title>
          </Flex>
        </Col>
      </Row>

      {/* 2. LAYOUT */}
      <Row gutter={[24, 24]}>
        {/* (A) CỘT "HERO" */}
        <Col lg={12} md={24} xs={24}>
          <HeroProductCard product={heroProduct} />
        </Col>

        {/* (B) CỘT "GRID" */}
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
                  <Card style={{ borderRadius: 8, overflow: "hidden" }}>
                    <Skeleton.Image
                      style={{ height: 160, width: "100%" }}
                      active
                    />
                    <Card.Meta
                      title={
                        <Skeleton.Input
                          style={{ width: "80%", marginTop: 16 }}
                          active
                          size="small"
                        />
                      }
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

      {/* 3. NÚT CTA */}
      {products.length > TOTAL_PRODUCTS_DISPLAYED && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button
            type="primary"
            size="large"
            href={viewMoreLink}
            icon={<ArrowRightOutlined />}
            style={{ fontWeight: 600, textDecoration: "none" }}
          >
            Xem tất cả {title.toLowerCase()}
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Component chính (Nơi gọi API - Không thay đổi) ---
export default function PromotionSection() {
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingBest, setLoadingBest] = useState(true);

  // (QUAN TRỌNG) Thay đổi địa chỉ này thành địa chỉ backend của bạn
  const API_BASE_URL = "http://localhost:8000";

  useEffect(() => {
    const processProducts = (products) => {
      if (!Array.isArray(products)) return [];
      
      return products.map((p) => {
        let relativePath = null;
        if (p.main_image && p.main_image.image) {
          relativePath = p.main_image.image;
        } else if (p.images && p.images.length > 0 && p.images[0].image) {
          relativePath = p.images[0].image;
        }
        return {
          ...p,
          image: relativePath ? `${API_BASE_URL}${relativePath}` : null,
        };
      });
    };

    fetchNewProducts()
      .then((data) => setNewProducts(processProducts(data)))
      .catch((err) => console.error("Lỗi tải sản phẩm mới:", err))
      .finally(() => setLoadingNew(false));

    fetchBestSellers()
      .then((data) => setBestSellers(processProducts(data)))
      .catch((err) => console.error("Lỗi tải sản phẩm bán chạy:", err))
      .finally(() => setLoadingBest(false));
  }, []);

  const hotColor = "#f5222d";
  const newColor = "#1677ff";

  return (
    <div
      className="promotion-section"
      style={{ padding: "40px 20px", maxWidth: 1400, margin: "0 auto" }}
    >
      <ProductSection
        title="Sản phẩm mới"
        icon={<ThunderboltOutlined />}
        iconColor={newColor}
        products={newProducts}
        loading={loadingNew}
        viewMoreLink="/new-products"
        badgeText="Mới"
        badgeColor="blue"
      />

      <ProductSection
        title="Bán chạy nhất"
        icon={<FireOutlined />}
        iconColor={hotColor}
        products={bestSellers}
        loading={loadingBest}
        viewMoreLink="/best-sellers"
        badgeText="Bán chạy"
        badgeColor="red"
      />
    </div>
  );
}