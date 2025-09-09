import { useState, useEffect } from "react";
import { Spin, Modal } from "antd";

import BannerCarousel from "../components/Home/BannerCarousel";
import CategorySection from "../components/Home/CategorySection";
import FlashSaleSection from "../components/Home/FlashSaleSection";
import PersonalizedSection from "../components/Home/PersonalizedSection";

import {
  fetchBanners,
  fetchFlashSale,
  fetchUserRecommendations,
  fetchCategories,
} from "../services/api/homepageApi";

import "../styles/Hompage.css";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [popupAds, setPopupAds] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]); // NEW
  const [showLoginModal, setShowLoginModal] = useState(false);

  const username = localStorage.getItem("username") || "Khách";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          fetchCategories(),
          fetchBanners(),
          fetchFlashSale(),
          fetchUserRecommendations(token),
        ]);

        const [catRes, bannersRes, flashRes, recommendRes] = results;

        if (catRes.status === "fulfilled") {
          setCategories(catRes.value.data || []);
        } else {
          console.error("Categories failed:", catRes.reason);
        }

        if (bannersRes.status === "fulfilled") {
          setBanners(bannersRes.value || []); // <-- value đã là mảng banners
        } else {
          console.warn("Banners API missing/failed:", bannersRes.reason);
        }

        if (flashRes.status === "fulfilled") {
          setFlashSaleProducts(flashRes.value.data || []);
        } else {
          console.warn("Flash sale API missing/failed:", flashRes.reason);
        }

        if (recommendRes.status === "fulfilled") {
          setRecommendedProducts(recommendRes.value.data || []);
        } else {
          console.warn(
            "Recommendations API missing/failed:",
            recommendRes.reason
          );
        }
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="homepage-container p-4">
      {/* Banner Carousel */}
      <BannerCarousel banners={banners} />

      {/* Danh Mục Nổi Bật */}
      <CategorySection categories={categories} />

      {/* Flash Sale */}
      <FlashSaleSection products={flashSaleProducts} />

      {/* Personalized Section */}
      <PersonalizedSection
        username={username}
        recommended={recommendedProducts}
        vouchers={vouchers}
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
