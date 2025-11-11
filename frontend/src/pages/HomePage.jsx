// src/pages/HomePage.jsx
import { useState, useEffect, Suspense } from "react";
import { Spin } from "antd";
import { Helmet } from "react-helmet";

// Components
import QuickAccessBar from "../components/home/QuickAccessBar.jsx";
import CategorySection from "../components/home/CategorySection.jsx";
import HomeProductTabs from "../components/home/HomeProductTabs.jsx";
import FlashSaleList from "../components/home/FlashSaleList.jsx";
import PersonalizedSection from "../components/home/PersonalizedSection.jsx";

// APIs
import { fetchCategories } from "../services/api/homepageApi.js";
import { getBannersBySlot } from "../features/admin/services/marketingApi.js";
import Layout from "../Layout/LayoutDefault.js";
import "../styles/HomePage.css";
import DynamicAdSlot from "../features/admin/components/MarketingAdmin/DynamicAdSlot.jsx";
import BannerSlider from "../components/home/BannerSlider.jsx";
import FeaturedBlogs from "../components/home/FeaturedBlogs.jsx";
import PromotionSection from "../components/home/PromotionSection.jsx";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [popupAds, setPopupAds] = useState([]);

  const username = localStorage.getItem("username") || "Khách";

  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi song song 3 API: categories, modal, carousel
        const [catRes, modalRes] = await Promise.all([
          fetchCategories(),
          getBannersBySlot("modal"),
          // Không cần gọi carousel ở đây vì SideBanners sẽ tự gọi
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
        <title>GreenFarm</title>
        <meta name="description" content="Đây là trang chủ của website." />
      </Helmet>
      <div className="container">
        <section className="home-section hero-section">
          <div className="d-flex gap-0 mt-3 note">
            <div style={{ flex: 7 }}>
              <BannerSlider slotCode="banner_hero" />
            </div>
            <div style={{ flex: 3 }}>
              <DynamicAdSlot
                slotCode="banner_mini_side"
                maxHeight="150px"
                limit={2}
                className="side-banners-container"
              />
            </div>
          </div>
        </section>

        {/* === Thanh truy cập nhanh === */}
        <section className="home-section">
          <QuickAccessBar />
        </section>

        <DynamicAdSlot slotCode="homepage_between_sections" maxHeight="200px" />

        {/* === Danh mục nổi bật === */}
        <section className="home-section">
          <CategorySection categories={categories} />
        </section>

        <section className="home-section">
          <PromotionSection />
        </section>

        {/* === Flash Sale === */}
        <section className="home-section">
          <FlashSaleList />
        </section>

        <DynamicAdSlot slotCode="category-personalized" maxHeight="400px" />

        {/* === Gợi ý cho bạn === */}
        <section className="home-section">
          <Suspense fallback={<Spin />}>
            <PersonalizedSection username={username} />
          </Suspense>
        </section>

        <section className="home-section">
          <FeaturedBlogs />
        </section>
      </div>
    </Layout>
  );
}
