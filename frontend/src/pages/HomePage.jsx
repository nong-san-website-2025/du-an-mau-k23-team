// src/pages/HomePage.jsx
import React, { useState, useEffect, Suspense } from "react";
import { Spin, Row, Col } from "antd"; // Dùng Row/Col của Antd hoặc Bootstrap đều được, ở đây dùng Bootstrap class cho layout chính
import { Helmet } from "react-helmet";
import { FireOutlined, ThunderboltOutlined } from "@ant-design/icons";

// Components
import CategorySection from "../components/home/CategorySection.jsx";
import FlashSaleList from "../components/home/FlashSaleList.jsx";
import PersonalizedSection from "../components/home/PersonalizedSection.jsx";
import BannerSlider from "../components/home/BannerSlider.jsx";
import FeaturedBlogs from "../components/home/FeaturedBlogs.jsx";
import ProductSection from "../components/home/PromotionSection.jsx";
import DynamicAdSlot from "../features/admin/components/MarketingAdmin/DynamicAdSlot.jsx";
import Layout from "../layout/LayoutDefault.js";

// APIs
import { fetchCategories } from "../services/api/homepageApi.js";
import { getBannersBySlot } from "../features/admin/services/marketingApi.js";

import "../styles/HomePage.css";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const [popupAds, setPopupAds] = useState([]);
  const username = localStorage.getItem("username") || "Khách";

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, modalRes] = await Promise.all([
          fetchCategories(),
          getBannersBySlot("homepage_popup"),
        ]);

        setCategories(catRes.data || []);

        const now = new Date();
        const activeModals = (modalRes.data || []).filter((banner) => {
          const start = banner.start_at ? new Date(banner.start_at) : new Date(0);
          const end = banner.end_at ? new Date(banner.end_at) : new Date("2100-01-01");
          return banner.is_active && now >= start && now <= end;
        });
        setPopupAds(activeModals);

      } catch (error) {
        console.error("❌ Lỗi khi gọi API Homepage:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
        <Spin size="large" tip="Đang tải GreenFarm..." />
      </div>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>GreenFarm - Nông sản sạch cho mọi nhà</title>
        <meta name="description" content="Mua sắm nông sản sạch, tươi ngon mỗi ngày tại GreenFarm." />
      </Helmet>

      <div className="container py-3">
        {/* =========================================================
            SECTION 1: HERO SECTION (Slider + Side Banners)
            Chuẩn UI: Sử dụng Grid 8:4 (hoặc 2/3 : 1/3)
           ========================================================= */}
        <section className="hero-section mb-4">
          <div className="row g-2"> {/* g-2 tạo khoảng cách nhỏ giữa các cột */}

            {/* Cột Trái: Slider Chính (Chiếm 66% - 8/12) */}
            <BannerSlider
              slotCode="homepage_hero_carousel"
              limit={5} // Chỉ hiện 5 banner ưu tiên cao nhất
              className="hero-slider shadow-sm rounded overflow-hidden"
              style={{ height: '100%', minHeight: '300px', }}
            />
          </div>
        </section>

        {/* =========================================================
            SECTION 2: DANH MỤC & QUICK ACCESS
           ========================================================= */}
        <section className="mb-4">
          <CategorySection categories={categories} />
        </section>

        {/* Banner quảng cáo ngang (Dải) */}
        <div className="mb-4">
          <DynamicAdSlot
            slotCode="homepage_below_quick_access"
            maxHeight="110px" // Banner ngang mỏng
            className="rounded shadow-sm overflow-hidden"
          />
        </div>

        {/* =========================================================
            SECTION 3: FLASH SALE
           ========================================================= */}
        <section className="mb-4">
          <FlashSaleList />
        </section>

        {/* Banner phân cách */}
        <div className="my-4">
          <DynamicAdSlot slotCode="homepage_above_flash_sale" maxHeight="180px" className="rounded" />
        </div>

        {/* =========================================================
            SECTION 4: SẢN PHẨM (MỚI & BÁN CHẠY)
           ========================================================= */}
        <div className="row g-3 mb-4">
          <div className="col-12">
            <ProductSection
              title="SẢN PHẨM MỚI"
              icon={<ThunderboltOutlined />}
              color="#1677ff" // Xanh Blue
              endpoint="/products/new-products/"
              viewMoreLink="/new-products"
            />
          </div>

          {/* Nếu muốn tách 2 cột thì dùng col-md-6, ở đây để full row */}
          <div className="col-12 mt-4">
            <ProductSection
              title="BÁN CHẠY NHẤT"
              icon={<FireOutlined />}
              color="#f5222d" // Đỏ Red
              endpoint="/products/best-sellers/"
              viewMoreLink="/best-sellers"
            />
          </div>
        </div>

        {/* Banner phân cách */}
        <div className="my-4">
          <DynamicAdSlot slotCode="homepage_below_flash_sale" maxHeight="200px" className="rounded shadow-sm" />
        </div>

        {/* =========================================================
            SECTION 5: GỢI Ý CHO BẠN (PERSONALIZATION)
           ========================================================= */}
        <section className="mb-4">
          <Suspense fallback={<Spin />}>
            <PersonalizedSection username={username} />
          </Suspense>
        </section>

        {/* Banner trước Blog */}
        <div className="my-4">
          <DynamicAdSlot slotCode="homepage_above_blogs" maxHeight="200px" className="rounded" />
        </div>

        {/* =========================================================
            SECTION 6: TIN TỨC / BLOG
           ========================================================= */}
        <section className="mb-5">
          <FeaturedBlogs />
        </section>

      </div>

      {/* CSS Nhúng trực tiếp cho bố cục Hero (Hoặc bạn đưa vào HomePage.css) */}
      {/* CSS Nhúng trực tiếp cho bố cục Hero */}
      
    </Layout>
  );
}