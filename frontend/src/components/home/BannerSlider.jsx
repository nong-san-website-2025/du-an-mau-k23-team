// src/components/home/BannerSlider.jsx
import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import { getBannersBySlot } from "../../features/admin/services/marketingApi.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import NoImage from "../shared/NoImage.jsx";
import { Spin } from "antd";
import "../../styles/home/BannerSlider.css";

// Helper xử lý URL ảnh
const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
};

export default function BannerSlider({ slotCode, className = "", style = {} }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!slotCode) return;
    setLoading(true);
    getBannersBySlot(slotCode)
      .then((res) => {
        const activeBanners = (res.data || []).filter((b) => b.is_active);
        activeBanners.sort((a, b) => b.priority - a.priority);
        setBanners(activeBanners);
      })
      .catch((err) => {
        console.error(`Error loading banner [${slotCode}]:`, err);
        setBanners([]);
      })
      .finally(() => setLoading(false));
  }, [slotCode]);

  const settings = {
    dots: true,
    infinite: banners.length > 1, // Chỉ loop nếu có > 1 ảnh
    speed: 500,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dotsClass: "slick-dots custom-dots",
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center h-100"><Spin /></div>;
  if (banners.length === 0) return null;

  return (
    <div 
        className={`banner-slider-wrapper position-relative ${className}`} 
        // ✅ CẬP NHẬT 1: Ép style tại đây để cắt phần thừa (Quan trọng nhất)
        style={{ 
            ...style, 
            overflow: 'hidden',   // Cắt mọi thứ tràn ra ngoài
            borderRadius: '8px',  // Bo góc đồng bộ
            height: style.height || '100%' // Lấy height từ props truyền vào hoặc full cha
        }}
    >
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner) => (
          <div key={banner.id} className="slider-item">
            {/* WRAPPER ẢNH */}
            <div 
                className="slider-image-container"
                onClick={() => banner.click_url && window.open(banner.click_url, "_blank")}
                style={{ 
                    cursor: banner.click_url ? "pointer" : "default",
                    width: "100%",
                    // ✅ CẬP NHẬT 2: Chiều cao 100% của cha (đã bị giới hạn ở trên)
                    height: "100%", 
                    display: "block",
                }}
            >
               {banner.image ? (
                  <img
                    src={getImageUrl(banner.image)}
                    alt={banner.title}
                    style={{
                        width: "100%",
                        height: "100%",
                        // ✅ CẬP NHẬT 3: Cover để ảnh luôn lấp đầy khung mà không méo
                        objectFit: "cover", 
                        objectPosition: "center",
                        display: "block"
                    }}
                    loading="lazy"
                  />
               ) : (
                  <NoImage />
               )}
            </div>
          </div>
        ))}
      </Slider>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button className="slider-arrow prev-arrow" onClick={() => sliderRef.current?.slickPrev()}>
            <LeftOutlined />
          </button>
          <button className="slider-arrow next-arrow" onClick={() => sliderRef.current?.slickNext()}>
            <RightOutlined />
          </button>
        </>
      )}
    </div>
  );
}