import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
// SỬA 1: Trỏ đúng vào thư mục features/admin/services VÀ đổi tên hàm
import { getPublicBanners } from "../../features/admin/services/marketingApi"; 
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import NoImage from "../shared/NoImage.jsx";
import { Spin } from "antd";
import "../../styles/home/BannerSlider.css";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const apiUrl = process.env.REACT_APP_API_URL;
  const baseUrl = apiUrl ? apiUrl.replace("/api", "") : ""; 
  return `${baseUrl}${url}`;
};

export default function BannerSlider({ 
  slotCode, 
  className = "", 
  height = "auto", 
  slidesToShow = 1 
}) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!slotCode) return;
    setLoading(true);
    
    // SỬA 2: Gọi đúng hàm getPublicBanners
    getPublicBanners(slotCode)
      .then((res) => {
        // Data có thể là res hoặc res.data tùy axios config
        const data = res.data || res; 
        const list = Array.isArray(data) ? data : [];
        const activeBanners = list.filter((b) => b.is_active);
        activeBanners.sort((a, b) => b.priority - a.priority);
        setBanners(activeBanners);
      })
      .catch((err) => {
        console.error(`Error loading banner [${slotCode}]:`, err);
        setBanners([]);
      })
      .finally(() => setLoading(false));
  }, [slotCode]);

  // ... (Phần render settings và return giữ nguyên không đổi)
  const settings = {
    dots: true,
    infinite: banners.length > 1,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: slidesToShow,
    slidesToScroll: 1,
    arrows: false,
    dotsClass: "slick-dots custom-dots",
  };

  if (loading) return (
    <div className={`banner-slider-wrapper d-flex justify-content-center align-items-center ${className}`} style={{ height }}>
      <Spin />
    </div>
  );

  if (banners.length === 0) return null;

  return (
    <div className={`banner-slider-wrapper ${className}`} style={{ height }}>
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner) => (
          <div key={banner.id} className="slider-item">
            <div
              className="slider-image-container"
              onClick={() => banner.click_url && window.open(banner.click_url, "_blank")}
              style={{ 
                cursor: banner.click_url ? "pointer" : "default",
                height: height === "auto" ? "100%" : height 
              }}
            >
              {banner.image ? (
                <img
                  src={getImageUrl(banner.image)}
                  alt={banner.title}
                  loading="lazy"
                  style={{ height: "100%", width: "100%", objectFit: "cover" }}
                />
              ) : (
                <NoImage />
              )}
            </div>
          </div>
        ))}
      </Slider>

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