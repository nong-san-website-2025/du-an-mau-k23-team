import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { getBannersByPosition } from "../../features/admin/services/marketingApi.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import NoImage from "../shared/NoImage.jsx"; // ✅ Import NoImage
import "../../styles/home/BannerSlider.css";

// Hàm kiểm tra URL ảnh hợp lệ
const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http") || url.startsWith("/");
};

export default function BannerSlider() {
  const [banners, setBanners] = useState([]);
  const sliderRef = React.useRef(null);

  useEffect(() => {
    getBannersByPosition("hero")
      .then((res) => {
        const activeBanners = res.data.filter((b) => b.is_active);
        setBanners(activeBanners.length > 0 ? activeBanners : []);
      })
      .catch((err) => {
        console.error("Lỗi khi tải banner carousel:", err);
        setBanners([]); // hoặc giữ trống
      });
  }, []);

  const settings = {
    dots: false,
    infinite: banners.length > 1,
    speed: 500,
    autoplay: banners.length > 1,
    autoplaySpeed: 3000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  if (banners.length === 0) return null;

  return (
    <div className="position-relative mb-4 border">
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner) => {
          const hasValidImage = isValidImageUrl(banner.image);
          const imgSrc = hasValidImage
            ? banner.image.startsWith("/")
              ? `http://localhost:8000${banner.image}`
              : banner.image
            : null;

          return (
            <div
              key={banner.id}
              className="d-flex justify-content-center align-items-center"
              onClick={() =>
                banner.click_url && window.open(banner.click_url, "_blank")
              }
              style={{ cursor: banner.click_url ? "pointer" : "default"}}
            >
              {hasValidImage ? (
                <img
                  src={imgSrc}
                  alt={banner.title || "Banner"}
                  fetchpriority={banner.id === banners[0].id ? "high" : "auto"}
                  loading={banner.id === banners[0].id ? "eager" : "lazy"}
                  className="shadow"
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                  }}
                  // Không cần onLoad/onError phức tạp nữa
                />
              ) : (
                // ✅ Dùng NoImage khi không có ảnh hợp lệ
                <div style={{ width: "100%", height: "300px" }}>
                  <NoImage height={300} text="Banner không khả dụng" />
                </div>
              )}
            </div>
          );
        })}
      </Slider>

      {banners.length > 1 && (
        <>
          <button
            className="btn btn-light position-absolute top-50 start-0 translate-middle-y shadow"
            style={{ zIndex: 10 }}
            onClick={() => sliderRef.current?.slickPrev()}
          >
            <LeftOutlined />
          </button>
          <button
            className="btn btn-light position-absolute top-50 end-0 translate-middle-y shadow"
            style={{ zIndex: 10 }}
            onClick={() => sliderRef.current?.slickNext()}
          >
            <RightOutlined />
          </button>
        </>
      )}
    </div>
  );
}