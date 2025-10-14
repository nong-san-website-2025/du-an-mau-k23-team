import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { getBannersByPosition } from "../../features/admin/services/marketingApi.js";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "../../styles/home/BannerSlider.css"; // nhớ import CSS

const defaultBanner = {
  id: "default",
  image: "https://via.placeholder.com/1200x400?text=Loading...",
  title: "Banner đang tải...",
  click_url: null,
};

export default function BannerSlider() {
  const [banners, setBanners] = useState([defaultBanner]);

  const [loadedImages, setLoadedImages] = useState({});
  const sliderRef = React.useRef(null);

  useEffect(() => {
    getBannersByPosition("carousel")
      .then((res) => {
        const activeBanners = res.data.filter((b) => b.is_active);
        if (activeBanners.length > 0) {
          setBanners(activeBanners);
        }
        // nếu backend trả rỗng thì giữ default banner
      })
      .catch((err) => console.error("Lỗi khi tải banner carousel:", err));
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
    <div className="position-relative mb-4">
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="d-flex justify-content-center align-items-center"
          >
            {!loadedImages[banner.id] && <div className="banner-placeholder" />}

            <img
              src={banner.image}
              alt={banner.title || "Banner"}
              fetchpriority={banner.id === banners[0].id ? "high" : "auto"}
              loading={banner.id === banners[0].id ? "eager" : "lazy"}
              onClick={() =>
                banner.click_url && window.open(banner.click_url, "_blank")
              }
              className="shadow"
              style={{
                width: "100%",
                height: "300px",
                objectFit: "cover",
                cursor: "pointer",
                display: loadedImages[banner.id] ? "block" : "none",
              }}
              onLoad={() =>
                setLoadedImages((prev) => ({ ...prev, [banner.id]: true }))
              }
              onError={
                () =>
                  setLoadedImages((prev) => ({ ...prev, [banner.id]: true })) // <== Tắt skeleton nếu lỗi ảnh
              }
            />
          </div>
        ))}
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
