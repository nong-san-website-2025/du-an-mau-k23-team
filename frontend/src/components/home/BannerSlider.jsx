// src/components/home/BannerSlider.jsx
import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import { getBannersBySlot } from "../../features/admin/services/marketingApi.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import NoImage from "../shared/NoImage.jsx";
import { Spin } from "antd";
import "../../styles/home/BannerSlider.css";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:8000${url}`;
};

export default function BannerSlider({ 
  slotCode, 
  className = "", 
  height = "auto", // Prop mới: Kiểm soát chiều cao cố định
  slidesToShow = 1 
}) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!slotCode) return;
    setLoading(true);
    getBannersBySlot(slotCode)
      .then((res) => {
        const activeBanners = (res.data || []).filter((b) => b.is_active);
        activeBanners.sort((a, b) => b.priority - a.priority); // Banner ưu tiên cao lên trước
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
    infinite: banners.length > 1,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: slidesToShow,
    slidesToScroll: 1,
    arrows: false, // Tắt arrow mặc định của slick để dùng custom arrow
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
                height: height === "auto" ? "100%" : height // Ép chiều cao nếu có
              }}
            >
              {banner.image ? (
                <img
                  src={getImageUrl(banner.image)}
                  alt={banner.title}
                  loading="lazy"
                  style={{ height: "100%", width: "100%" }}
                />
              ) : (
                <NoImage />
              )}
            </div>
          </div>
        ))}
      </Slider>

      {/* Custom Arrows */}
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