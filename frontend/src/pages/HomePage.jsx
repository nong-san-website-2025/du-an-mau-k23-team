import { useState, useEffect } from "react";
import { Spin, Modal } from "antd";

import BannerCarousel from "../components/Home/BannerCarousel";
import FlashSaleSection from "../components/Home/FlashSaleSection";
import PersonalizedSection from "../components/Home/PersonalizedSection";

import {
  fetchBanners,
  fetchFlashSale,
  fetchUserRecommendations,
} from "../services/api/homepageApi";

import "../styles/Hompage.css";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [popupAds, setPopupAds] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const username = localStorage.getItem("username") || "Khách";
  const token = localStorage.getItem("token");

  // ====== Kiểm tra modal chào mừng ======
  useEffect(() => {
    const loadData = async () => {
      try {
        const adsRes = await fetchBanners();
        console.log("Popups:", adsRes.data.popups); // 🔹 DEBUG

        setPopupAds(adsRes.data.popups || []);
      } catch (error) {
        console.error("Error fetching popup ads:", error);
      }
    };

    loadData();
  }, []);

  // ====== Gọi API ======
  useEffect(() => {
    const loadData = async () => {
      try {
        const [adsRes, flashSaleRes, recommendRes] = await Promise.all([
          fetchBanners(),
          fetchFlashSale(),
          fetchUserRecommendations(token),
        ]);

        // Banners + Popups
        setBanners(adsRes.data.banners || []);
        setPopupAds(adsRes.data.popups || []);

        // Flash Sale
        setFlashSaleProducts(flashSaleRes.data || []);

        // Gợi ý cá nhân hóa
        setRecommendedProducts(recommendRes.data?.recommended_products || []);
        setVouchers(recommendRes.data?.vouchers || []);
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Khi popupAds thay đổi, mở popup đầu tiên
  useEffect(() => {
    if (popupAds.length > 0) {
      setActivePopup(popupAds[0]);
    }
  }, [popupAds]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="homepage-container">
      {/* Banner Carousel */}
      <BannerCarousel banners={banners} />

      {/* Flash Sale */}
      <FlashSaleSection products={flashSaleProducts} />

      {/* Personalized Section */}
      <PersonalizedSection
        username={username}
        recommended={recommendedProducts}
        vouchers={vouchers}
      />

      <Modal
        key={popupAds[0]?.id}
        open={popupAds.length > 0}
        footer={null}
        closable={true} // Bật nút X để đóng modal
        onCancel={() => setPopupAds([])}
        centered
        width="60vw"
        style={{
          top: 0,
          padding: 0,
          margin: 0,
        }}
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
              objectFit: "cover", // Ảnh phủ đầy modal
              display: "block", // Loại bỏ khoảng trắng dưới ảnh
            }}
            className="cursor-pointer"
          />
        )}
      </Modal>
    </div>
  );
}
