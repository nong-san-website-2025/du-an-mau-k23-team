// src/pages/HomePage.jsx
import { useState, useEffect, Suspense } from "react";
import { Spin, Modal } from "antd";
import { Helmet } from "react-helmet";

// Components
import BannerSlider from "../components/home/BannerSlider.jsx"; // hero
import SideBanners from "../components/home/SideBanners.jsx"; // carousel (2 banner nhỏ)
import QuickAccessBar from "../components/home/QuickAccessBar.jsx";
import CategorySection from "../components/home/CategorySection.jsx";
import HomeProductTabs from "../components/home/HomeProductTabs.jsx";
import FlashSaleList from "../components/home/FlashSaleList.jsx";
import PersonalizedSection from "../components/home/PersonalizedSection.jsx";

// APIs
import { fetchCategories } from "../services/api/homepageApi.js";
import { getBannersByPosition } from "../features/admin/services/marketingApi.js";
import Layout from "../Layout/LayoutDefault.js";

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
          getBannersByPosition("modal"),
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
      <div className="container" style={{ padding: "0 16px" }}>
        <Helmet>
          <title>GreenFarm</title>
          <meta name="description" content="Đây là trang chủ của website." />
        </Helmet>

        {/* === Hero + Side Banners === */}
        <div className="d-flex gap-0 mt-3">
          <div style={{ flex: 7 }}>
            <BannerSlider /> {/* position = "hero" */}
          </div>
          <div style={{ flex: 3 }}>
            <SideBanners /> {/* position = "carousel" — tự gọi API bên trong */}
          </div>
        </div>

        <QuickAccessBar />
        <CategorySection categories={categories} />

        <FlashSaleList />

        <HomeProductTabs />

        <Suspense fallback={<Spin />}>
          <PersonalizedSection username={username} />
        </Suspense>

        {/* === Modal Popup === */}
        {popupAds.length > 0 && (
          <Modal
            key={popupAds[0]?.id}
            open={true}
            footer={null}
            closable
            onCancel={() => setPopupAds([])}
            centered
            width="60vw"
            styles={{
              body: {
                padding: 0,
                margin: 0,
                height: "60vh",
                overflow: "hidden",
                background: "transparent",
              },
            }}
            className="full-screen-modal"
          >
            {popupAds[0]?.image && (
              <img
                src={popupAds[0].image}
                alt={popupAds[0].title || "Popup Banner"}
                loading="lazy"
                onClick={() =>
                  popupAds[0].click_url &&
                  window.open(
                    popupAds[0].click_url,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              />
            )}
          </Modal>
        )}
      </div>
    </Layout>
  );
}
