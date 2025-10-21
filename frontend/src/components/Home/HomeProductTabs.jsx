// src/components/HomeProductTabs.jsx (hoặc wherever you have it)
import React, { useEffect, useState, useRef } from "react";
import { Tabs, Card, Typography, Spin, Button } from "antd";
import Slider from "react-slick";
import { productApi } from "../../features/products/services/productApi";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
// import "./HomeProductTabs.css"; // optional: nếu bạn muốn tách CSS

const { Text } = Typography;

// Custom Prev Arrow
const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.9)",
        border: "1px solid #ddd",
        color: "#333",
        zIndex: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        left: "-32px",
        top: "50%",
        transform: "translateY(-50%)",
      }}
      onClick={onClick}
    >
      <ArrowLeftOutlined style={{ fontSize: "16px", color: "#555" }} />
    </div>
  );
};

// Custom Next Arrow
const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.9)",
        border: "1px solid #ddd",
        color: "#333",
        zIndex: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        right: "-32px",
        top: "50%",
        transform: "translateY(-50%)",
      }}
      onClick={onClick}
    >
      <ArrowRightOutlined style={{ fontSize: "16px", color: "#555" }} />
    </div>
  );
};

const HomeProductTabs = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();

        const availableProducts = data.filter(
          (p) => p.availability_status === "available"
        );
        const sorted = availableProducts.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNewProducts(sorted.slice(0, 12));

        const coming = data
          .filter((p) => p.availability_status === "coming_soon")
          .sort(
            (a, b) =>
              new Date(a.season_start || "2100-01-01") -
              new Date(b.season_start || "2100-01-01")
          );
        setComingSoon(coming.slice(0, 12));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
      </div>
    );

  const carouselSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 3,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 5 } },
      { breakpoint: 992, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 576, settings: { slidesToShow: 2 } },
    ],
  };

  const ProductCard = ({ product, isComingSoon = false }) => (
    <div style={{ padding: "0 8px" }}>
      <Card
        hoverable
        cover={
          <img
            src={
              product.image?.startsWith("/")
                ? `http://localhost:8000${product.image}`
                : product.image?.startsWith("http")
                ? product.image
                : "https://via.placeholder.com/400x300?text=No+Image"
            }
            alt={product.name}
            style={{
              height: 180,
              objectFit: "cover",
              borderRadius: "8px 8px 0 0",
            }}
          />
        }
        onClick={() => navigate(`/products/${product.id}`)}
        style={{
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "14px" }}
      >
        <Text strong style={{ fontSize: 16 }}>
          {product.name}
        </Text>
        <br />
        {isComingSoon ? (
          <>
            <Text type="secondary">
              Sắp có:{" "}
              {product.season_start
                ? new Date(product.season_start).toLocaleDateString("vi-VN")
                : "?"}{" "}
              →{" "}
              {product.season_end
                ? new Date(product.season_end).toLocaleDateString("vi-VN")
                : "?"}
            </Text>
            <br />
            <Text type="warning">
              Ước lượng: {product.estimated_quantity || 0} sản phẩm
            </Text>
          </>
        ) : (
          <Text type="danger" style={{ fontSize: 15 }}>
            {Math.round(product.price).toLocaleString("vi-VN")} ₫
          </Text>
        )}
      </Card>
    </div>
  );

  const handleViewAll = () => {
    if (activeTab === "1") {
      navigate("/products/new");
    } else if (activeTab === "2") {
      navigate("/products/coming-soon");
    }
  };

  return (
    <section
      style={{
        background: "#fff",
        padding: "12px 12px",
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: "30px",
        position: "relative",
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        tabBarExtraContent={
          <Button type="link" onClick={handleViewAll}>
            Xem tất cả
          </Button>
        }
        items={[
          {
            key: "1",
            label: "Sản phẩm mới",
            children: (
              <div style={{ padding: "0 8px", position: "relative" }}>
                <Slider {...carouselSettings}>
                  {newProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </Slider>
              </div>
            ),
          },
          {
            key: "2",
            label: "Sản phẩm sắp có",
            children: (
              <div style={{ padding: "0 8px", position: "relative" }}>
                <Slider {...carouselSettings}>
                  {comingSoon.map((p) => (
                    <ProductCard key={p.id} product={p} isComingSoon />
                  ))}
                </Slider>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
};

export default HomeProductTabs;