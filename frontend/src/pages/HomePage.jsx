import { useState, useEffect } from "react";
import { Spin, Modal } from "antd"; // TODO: nâng cấp props theo khuyến cáo: dùng styles.body thay cho bodyStyle
import BannerSlider from "../components/home/BannerSlider";
import CategorySection from "../components/home/CategorySection";
import PersonalizedSection from "../components/home/PersonalizedSection";
import { Helmet } from "react-helmet";

import {
  // fetchUserRecommendations,
  fetchCategories,
} from "../services/api/homepageApi.js";
import FlashSaleList from "../components/home/FlashSaleList.jsx";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  // const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popupAds, setPopupAds] = useState([]);

  const username = localStorage.getItem("username") || "Khách";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Gọi fetchCategories trước
        const catRes = await fetchCategories();

        setCategories(catRes.data || []);

        // setRecommendedProducts(recommendRes.data || []);
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
      <FlashSaleList />

      {/* Personalized Section */}
      <PersonalizedSection
        username={username}
        // recommended={recommendedProducts}
      />

      {/* Popup Modal */}
      <Modal
        key={popupAds[0]?.id}
        open={popupAds.length > 0}
        footer={null}
        closable={true}
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
            }}
            className="cursor-pointer"
          />
        )}
      </Modal>
    </div>
  );
}
