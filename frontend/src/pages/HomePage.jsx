import { useState, useEffect } from "react";
import { Spin, Modal } from "antd";
import { Helmet } from "react-helmet";

// Import components (chú ý: Home viết hoa)
import BannerSlider from "../components/Home/BannerSlider";
import CategorySection from "../components/Home/CategorySection";
import FlashSaleSection from "../components/Home/FlashSaleSection";
import PersonalizedSection from "../components/Home/PersonalizedSection";
import FlashSaleList from "../components/Home/FlashSaleList";

// Import API
import { fetchCategories } from "../services/api/homepageApi.js";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [popupAds, setPopupAds] = useState([]);

  const username = localStorage.getItem("username") || "Khách";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await fetchCategories();
        setCategories(catRes.data || []);
      } catch (error) {
        console.error("❌ Lỗi khi gọi API:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

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

      {/* Flash Sale */}
      <FlashSaleSection />
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
