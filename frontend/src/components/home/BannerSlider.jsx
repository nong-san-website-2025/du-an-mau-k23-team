import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { getBannersByPosition } from "../../features/admin/services/marketingApi.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

export default function BannerSlider() {
  const [banners, setBanners] = useState([]);
  const sliderRef = React.useRef(null);

  useEffect(() => {
    getBannersByPosition("carousel")
      .then((res) => {
        const activeBanners = res.data.filter((b) => b.is_active);
        setBanners(activeBanners);
      })
      .catch((err) => console.error("Lỗi khi tải banner carousel:", err));
  }, []);

  const settings = {
    dots: false,
    infinite: banners.length > 1, // chỉ infinite nếu có >1 banner
    speed: 500,
    autoplay: banners.length > 1, // chỉ autoplay nếu có >1
    autoplaySpeed: 3000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  if (banners.length === 0) {
    return null; 
  }

  return (
    <div className="position-relative mb-4">
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="d-flex justify-content-center align-items-center"
          >
            <img
              src={banner.image}
              alt={banner.title || "Banner"}
              onClick={() => banner.click_url && window.open(banner.click_url, "_blank")}
              className="shadow"
              style={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                cursor: "pointer",
              }}
            />
          </div>
        ))}
      </Slider>

      {/* Chỉ hiện nút nếu có nhiều hơn 1 banner */}
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