import { useState, useEffect } from "react";
import { Spin, Modal } from "antd"; // TODO: nâng cấp props theo khuyến cáo: dùng styles.body thay cho bodyStyle
import BannerSlider from "../components/home/BannerSlider.jsx";
import CategorySection from "../components/home/CategorySection.jsx";
import PersonalizedSection from "../components/home/PersonalizedSection.jsx";
import { Helmet } from "react-helmet";

import {
  // fetchUserRecommendations,
  fetchCategories,
} from "../services/api/homepageApi.js";
import FlashSaleList from "../components/home/FlashSaleList.jsx";
import { getBannersByPosition } from "../features/admin/services/marketingApi.js";
export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [popupAds, setPopupAds] = useState([]);

  const username = localStorage.getItem("username") || "Khách";

  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi song song
        const [catRes, modalRes] = await Promise.all([
          fetchCategories(),
          getBannersByPosition("modal"),
        ]);

        setCategories(catRes.data || []);

        // Lọc banner modal đang active và trong thời gian hợp lệ
        const activeModals = (modalRes.data || []).filter((banner) => {
          const now = new Date();
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
    <div className="container" style={{ padding: "0 16px" }}>
      <Helmet>
        <title>GreenFarm</title>
        <meta name="description" content="Đây là trang chủ của website." />
      </Helmet>

      {/* Banner Carousel */}
      <BannerSlider />

      {/* Danh Mục Nổi Bật */}
      <CategorySection categories={categories} />

      <FlashSaleList />

      {/* Personalized Section */}
      <PersonalizedSection username={username} />

      {/* Popup Modal */}
      <Modal
        key={popupAds[0]?.id}
        open={popupAds.length > 0}
        footer={null}
        closable
        onCancel={() => setPopupAds([])}
        centered
        width="60vw"
        style={{ top: 0, padding: 0, margin: 0 }}
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
        {popupAds.length > 0 && popupAds[0].image && (
          <img
            src={popupAds[0].image}
            alt={popupAds[0].title}
            onClick={() => window.open(popupAds[0].redirect_link, "_blank")}
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
    </div>
  );
}
