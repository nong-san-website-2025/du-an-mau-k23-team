// src/pages/HomePage.jsx
import React, { useState, useEffect, Suspense } from "react";
import { Spin, Row, Col } from "antd"; 
import { Helmet } from "react-helmet";
import { 
  FireOutlined, 
  ThunderboltOutlined, 
} from "@ant-design/icons";

// Components
import CategorySection from "../components/home/CategorySection.jsx";
import FlashSaleList from "../components/home/FlashSaleList.jsx";
import PersonalizedSection from "../components/home/PersonalizedSection.jsx";
import BannerSlider from "../components/home/BannerSlider.jsx";
import FeaturedBlogs from "../components/home/FeaturedBlogs.jsx";
import ProductSection from "../components/home/ProductSection.jsx";
import DynamicAdSlot from "../features/admin/components/MarketingAdmin/DynamicAdSlot.jsx";
import Layout from "../layout/LayoutDefault.js";
import QuickAccessBar from "../components/home/QuickAccessBar.jsx";

// APIs
import { fetchCategories } from "../services/api/homepageApi.js";
import { getBannersBySlot } from "../features/admin/services/marketingApi.js";

import "../styles/HomePage.css";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [popupAds, setPopupAds] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, modalRes] = await Promise.all([
          fetchCategories(),
          getBannersBySlot("homepage_popup"),
        ]);

        setCategories(catRes.data || []);
        
        // Logic lọc popup ads
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

  // Helper styles cho section banner
  const sectionBannerStyle = {
    width: "100%",
    borderRadius: "8px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    overflow: "hidden"
  };

  return (
    <Layout>
      <Helmet>
        <title>GreenFarm - Nông sản sạch cho mọi nhà</title>
        <meta name="description" content="Mua sắm nông sản sạch, tươi ngon mỗi ngày tại GreenFarm." />
      </Helmet>

      <div className="homepage-container py-3">
        <div className="container">
          
          {/* =========================================================
              SECTION 1: HERO SECTION (SLIDER + RIGHT BANNERS)
              ========================================================= */}
          <div className="section-white-bg p-0 overflow-hidden mb-3">
            <Row gutter={[0, 0]}>
              {/* Cột trái: Main Slider (66%) */}
              <Col xs={24} md={16}>
                <BannerSlider
                  slotCode="homepage_hero_carousel"
                  limit={5}
                  height="300px" 
                  className="hero-slider"
                />
              </Col>
              
              {/* Cột phải: 2 Banner tĩnh (33%) */}
              <Col xs={0} md={8} className="hero-right-banners pl-1">
                <div style={{ height: "300px", display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "2px" }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                      <DynamicAdSlot 
                        slotCode="homepage_hero_right_top" 
                        maxHeight="100%" 
                        style={{height: '100%', width: '100%', objectFit: 'cover'}}
                      />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                      <DynamicAdSlot 
                        slotCode="homepage_hero_right_bottom" 
                        maxHeight="100%" 
                        style={{height: '100%', width: '100%', objectFit: 'cover'}}
                      />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* SECTION 1.5: TRUST BADGE */}
          {/* <div className="section-white-bg py-3 mb-3">
            <Row gutter={[16, 16]} justify="space-around">
              <QuickAccessBar/>
            </Row>
          </div> */}

          {/* =========================================================
              SECTION 2: DANH MỤC (CATEGORY)
              ========================================================= */}
          {/* Banner cho Danh mục */}
          <div style={sectionBannerStyle}>
            <DynamicAdSlot slotCode="homepage_section_category" />
          </div>

          <section className="section-white-bg">
             <div className="section-header">
                <h3 className="section-title">Danh Mục Nổi Bật</h3>
             </div>
             <CategorySection categories={categories} />
          </section>

          {/* =========================================================
              SECTION 3: FLASH SALE
              ========================================================= */}
          {/* Banner cho Flash Sale */}
          <div style={sectionBannerStyle} className="mt-4">
            <DynamicAdSlot slotCode="homepage_section_flashsale" />
          </div>

          <section className="section-white-bg">
            <FlashSaleList />
          </section>

          {/* =========================================================
              SECTION 4: SẢN PHẨM (MỚI & BÁN CHẠY)
              ========================================================= */}
          {/* Banner cho Sản phẩm */}
          <div style={sectionBannerStyle} className="mt-4">
             <DynamicAdSlot slotCode="homepage_section_product" />
          </div>

          <Row gutter={[16, 16]} className="mb-4">
            {/* Cột Trái: Sản phẩm mới */}
            <Col xs={24} lg={12}>
               <div className="section-white-bg h-100">
                  <ProductSection
                    title="SẢN PHẨM MỚI"
                    icon={<ThunderboltOutlined />}
                    color="#1677ff" 
                    endpoint="/products/new-products/"
                    viewMoreLink="/new-products"
                    limit={4} 
                  />
               </div>
            </Col>

            {/* Cột Phải: Bán chạy */}
            <Col xs={24} lg={12}>
               <div className="section-white-bg h-100">
                  <ProductSection
                    title="BÁN CHẠY NHẤT"
                    icon={<FireOutlined />}
                    color="#f5222d" 
                    endpoint="/products/best-sellers/"
                    viewMoreLink="/best-sellers"
                    limit={4}
                  />
               </div>
            </Col>
          </Row>

          {/* =========================================================
              SECTION 5: GỢI Ý CHO BẠN (PERSONALIZATION)
              ========================================================= */}
          {/* Banner cho Gợi ý */}
          <div style={sectionBannerStyle} className="mt-4">
             <DynamicAdSlot slotCode="homepage_section_personalization" />
          </div>

          <section className="mb-4">
             <Suspense fallback={<Spin />}>
               <PersonalizedSection username={username || "Khách"} />
             </Suspense>
          </section>

          {/* =========================================================
              SECTION 6: TIN TỨC / BLOG
              ========================================================= */}
          {/* Banner cho Blog */}
          <div style={sectionBannerStyle} className="mt-4">
             <DynamicAdSlot slotCode="homepage_section_blog" />
          </div>

          <section className="section-white-bg">
             <div className="section-header">
                <h3 className="section-title">Góc nhà nông</h3>
             </div>
             <FeaturedBlogs />
          </section>

        </div>
      </div>
    </Layout>
  );
}