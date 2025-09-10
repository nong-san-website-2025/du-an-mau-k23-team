import React, { useRef } from "react";
import { Carousel } from "antd";
import "../../styles/home/BannerCarousel.css";

export default function BannerCarousel({ banners = [] }) {
  const carouselRef = useRef(null);

  return (
    <div className="banner-carousel" style={{ position: "relative" }}>
      <Carousel autoplay ref={carouselRef} >
        {banners.map((banner) => (
          <div key={banner.id} className="banner-slide">
            <img
              src={banner.image_url || banner.image}
              alt={banner.title}
              onClick={() =>
                banner.redirect_link && window.open(banner.redirect_link, "_blank")
              }
            />
          </div>
        ))}
      </Carousel>

      {/* Nút Prev */}
      <button
        className="carousel-btn prev-btn"
        onClick={() => carouselRef.current.prev()}
      >
        &#10094; {/* ký tự mũi tên trái */}
      </button>

      {/* Nút Next */}
      <button
        className="carousel-btn next-btn"
        onClick={() => carouselRef.current.next()}
      >
        &#10095; {/* ký tự mũi tên phải */}
      </button>
    </div>
  );
}
