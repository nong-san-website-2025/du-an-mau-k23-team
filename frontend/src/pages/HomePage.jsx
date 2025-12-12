// src/pages/HomePage.jsx
import { useState, useEffect, Suspense } from "react";
import { Spin } from "antd";
import { Helmet } from "react-helmet";

// Components
import QuickAccessBar from "../components/home/QuickAccessBar.jsx";
import CategorySection from "../components/home/CategorySection.jsx";
import FlashSaleList from "../components/home/FlashSaleList.jsx";
import PersonalizedSection from "../components/home/PersonalizedSection.jsx";
import BannerSlider from "../components/home/BannerSlider.jsx";
import FeaturedBlogs from "../components/home/FeaturedBlogs.jsx";
import DynamicAdSlot from "../features/admin/components/MarketingAdmin/DynamicAdSlot.jsx";
import Layout from "../layout/LayoutDefault.js";

// APIs
import { fetchCategories } from "../services/api/homepageApi.js";
import { getBannersBySlot } from "../features/admin/services/marketingApi.js";

import "../styles/HomePage.css";
import ProductSection from "../components/home/PromotionSection.jsx";
import { FireOutlined, ThunderboltOutlined } from "@ant-design/icons";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [popupAds, setPopupAds] = useState([]);

  const username = localStorage.getItem("username") || "Khách";

  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi song song 2 API: categories và banner popup
        const [catRes, modalRes] = await Promise.all([
          fetchCategories(),
          // Cập nhật slotCode đúng với backend
          getBannersBySlot("homepage_popup"),
        ]);

        setCategories(catRes.data || []);

        // Lọc modal active
        const now = new Date();
        const activeModals = (modalRes.data || []).filter((banner) => {
          const start = banner.start_at
            ? new Date(banner.start_at)
            : new Date(0);
          const end = banner.end_at
            ? new Date(banner.end_at)
            : new Date("2100-01-01");
          return banner.is_active && now >= start && now <= end;
        });

        setPopupAds(activeModals);

        // TODO: Logic hiển thị Modal popupAds ở đây (nếu bạn có component Modal)

      } catch (error) {
        console.error("❌ Lỗi khi gọi API:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spin size="large" className="spinning" />
      </div>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>GreenFarm - Trang chủ</title>
        <meta name="description" content="Mua sắm nông sản sạch tại GreenFarm." />
      </Helmet>

      <div className="container">
        {/* === Section 1: Hero Slider & Side Banners === */}
        <section className="home-section hero-section">
          <div className="d-flex gap-0 mt-3 note">
            <div style={{ flex: 7 }}>
             
              <BannerSlider slotCode="homepage_hero_carousel" />
            </div>
            <div style={{ flex: 3 }}>
             
              <DynamicAdSlot
                slotCode="homepage_hero_side"
                maxHeight="150px"
                limit={2}
                className="side-banners-container"
              />
            </div>
          </div>
        </section>

        {/* === Section 3: Danh mục === */}
        <section className="home-section">
          <CategorySection categories={categories} />
        </section>


        {/* Banner: Dưới Quick Access */}
        <DynamicAdSlot slotCode="homepage_below_quick_access" maxHeight="200px" />
        <section className="home-section">
          <FlashSaleList />
        </section>

        {/* SECTION 1: SẢN PHẨM MỚI */}
        <ProductSection
          title="SẢN PHẨM MỚI"
          icon={<ThunderboltOutlined />}
          color="#1677ff"
          endpoint="/products/new-products/"
          viewMoreLink="/new-products"
        />

        <ProductSection
          title="BÁN CHẠY NHẤT"
          icon={<FireOutlined />}
          color="#f5222d"
          endpoint="/products/best-sellers/"
          viewMoreLink="/best-sellers"
        />


        {/* Banner: Trước Flash Sale */}
        <DynamicAdSlot slotCode="homepage_above_flash_sale" maxHeight="400px" />

        {/* === Section 5: Flash Sale === */}


        {/* Banner: Dưới Flash Sale */}
        <DynamicAdSlot slotCode="homepage_below_flash_sale" maxHeight="400px" />

        {/* === Section 6: Gợi ý cho bạn === */}
        <section className="home-section">
          <Suspense fallback={<Spin />}>
            <PersonalizedSection username={username} />
          </Suspense>
        </section>

        {/* Banner: Trước Blogs */}
        <DynamicAdSlot slotCode="homepage_above_blogs" maxHeight="400px" />

        {/* === Section 7: Tin tức === */}
        <section className="home-section">
          <FeaturedBlogs />
        </section>
      </div>
    </Layout>
  );
}