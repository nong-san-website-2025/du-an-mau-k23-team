import { useState, useEffect } from "react";
import { Spin, Modal } from "antd";

import BannerSlider from "../components/home/BannerSlider";
import CategorySection from "../components/home/CategorySection";
import FlashSaleSection from "../components/home/FlashSaleSection";
import PersonalizedSection from "../components/home/PersonalizedSection";

import {
  // fetchUserRecommendations,
  fetchCategories,
} from "../services/api/homepageApi.js";

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

        setCategories( catRes.data || []);

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
        style={{ height: "500px" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "0 20px" }}>
      {/* Banner Carousel */}
      <div className="row">
        <div className="col-12">
          <BannerSlider />
        </div>
      </div>

      {/* Danh Mục Nổi Bật */}
      <CategorySection categories={categories} />

      {/* Flash Sale */}
      <FlashSaleSection />

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
        bodyStyle={{
          padding: 0,
          margin: 0,
          height: "60vh",
          overflow: "hidden",
          background: "transparent",
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
            }}
            className="cursor-pointer"
          />
        )}
      </Modal>
    </div>
  );
}
