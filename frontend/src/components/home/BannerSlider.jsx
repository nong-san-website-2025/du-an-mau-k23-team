import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { getBanners } from "../../features/admin/services/marketingApi.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

export default function BannerSlider() {
  const [banners, setBanners] = useState([]);
  const sliderRef = React.useRef(null);

  useEffect(() => {
    getBanners()
      .then((res) => setBanners(res.data || []))
      .catch((err) => console.error("Lỗi khi tải banner:", err));
  }, []);

  const settings = {
    dots: false, // ❌ Tắt dots
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, // ❌ Tắt arrow mặc định
  };

  return (
    <div className="position-relative mb-4">
      {/* Slider */}
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="d-flex justify-content-center align-items-center"
          >
            <img
              src={banner.image}
              alt={banner.title}
              onClick={() => window.open(banner.redirect_link, "_blank")}
              className="rounded shadow"
              style={{
                width: "100%",
                height: "400px",
                objectFit: "",
                cursor: "pointer",
              }}
            />
          </div>
        ))}
      </Slider>

      {/* Nút Back */}
      <button
        className="btn btn-light position-absolute top-50 start-0 translate-middle-y shadow"
        style={{ zIndex: 10 }}
        onClick={() => sliderRef.current.slickPrev()}
      >
        <LeftOutlined />
      </button>

      {/* Nút Next */}
      <button
        className="btn btn-light position-absolute top-50 end-0 translate-middle-y shadow"
        style={{ zIndex: 10 }}
        onClick={() => sliderRef.current.slickNext()}
      >
        <RightOutlined />
      </button>
    </div>
  );
}
