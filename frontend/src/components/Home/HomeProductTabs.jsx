import React, { useEffect, useState, useRef } from "react";
import { Tabs, Spin, Button } from "antd";
import Slider from "react-slick";
import { productApi } from "../../features/products/services/productApi";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../features/products/components/ProductCard";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../styles/home/HomeProductTabs.css";
import { useCart } from "../../features/cart/services/CartContext";

const HomeProductTabs = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const sliderRef1 = useRef(null);
  const sliderRef2 = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();

        const availableProducts = data
          .filter((p) => p.availability_status === "available")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 12);
        setNewProducts(availableProducts);

        const coming = data
          .filter((p) => p.availability_status === "coming_soon")
          .sort(
            (a, b) =>
              new Date(a.season_start || "2100-01-01") -
              new Date(b.season_start || "2100-01-01")
          )
          .slice(0, 12);
        setComingSoon(coming);
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
    arrows: false, // ❗ tắt nút mặc định
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 3,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 5 } },
      { breakpoint: 992, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 576, settings: { slidesToShow: 2 } },
    ],
  };

  const handleViewAll = () => {
    navigate(activeTab === "1" ? "/products/new" : "/products/coming-soon");
  };

  const renderCarousel = (products, ref) => (
    <div className="carousel-wrapper">
      <Slider ref={ref} {...carouselSettings}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            showAddToCart
            onAddToCart={(e, product) => addToCart(product.id, 1, product)}
          />
        ))}
      </Slider>

      {/* Dòng nút */}
      <div
        className="d-flex align-items-center justify-content-between mt-3"
        style={{ width: "100%" }}
      >
        {/* Nút ← → ở giữa */}
        <div className="mx-auto">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={() => ref.current?.slickPrev()}
            style={{ marginRight: 8 }}
          />
          <Button
            shape="circle"
            icon={<ArrowRightOutlined />}
            onClick={() => ref.current?.slickNext()}
          />
        </div>

        {/* Nút Xem tất cả căn phải */}
        <div>
          <Button type="primary" onClick={handleViewAll}>
            Xem tất cả
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="home-product-tabs">
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
            children: renderCarousel(newProducts, sliderRef1),
          },
          {
            key: "2",
            label: "Sản phẩm sắp có",
            children: renderCarousel(comingSoon, sliderRef2),
          },
        ]}
      />
    </section>
  );
};

export default HomeProductTabs;
