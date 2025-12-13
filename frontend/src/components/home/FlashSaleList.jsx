import React, { useRef, useEffect, useState } from "react";
import { Carousel, Button, Skeleton } from "antd";
import { ThunderboltFilled, RightOutlined, LeftOutlined } from "@ant-design/icons";
import FlashSaleItem from "./FlashSaleItem";
import CountdownTimer from "./CountdownTimer";
import api from "../../features/login_register/services/api";

// Import file CSS riêng biệt
import "../../styles/home/FlashSaleList.css";

export default function FlashSaleList() {
  const carouselRef = useRef();
  const [flashItems, setFlashItems] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/promotions/flash-sales/");
        const data = res.data || [];
        if (data.length > 0) {
          const current = data[0];
          setFlashItems(current.flashsale_products || []);
          setEndTime(current.end_time);
        }
      } catch (e) {
        console.error("Lỗi tải Flash Sale:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cấu hình Carousel responsive
  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    draggable: true,
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 5, slidesToScroll: 2 } },
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 2 } },
      { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }, 
    ],
  };

  // Render Skeleton Loading (Giữ nguyên cấu trúc Container để không bị giật layout)
  if (loading) {
    return (
      <div className="flash-sale-section container">
        <div className="flash-header" style={{ border: 'none' }}>
           <Skeleton.Input active size="large" style={{ width: 200 }} />
        </div>
        <div style={{ display: "flex", gap: 16, padding: "0 24px", overflow: "hidden" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton.Node key={i} active style={{ width: 220, height: 320 }} />
          ))}
        </div>
      </div>
    );
  }

  if (flashItems.length === 0) return null;

  return (
    <div className="flash-sale-section">
      <div className="container">
        {/* --- Header Section --- */}
        <div className="flash-header">
          <div className="header-left">
            <div className="title-wrapper">
              <ThunderboltFilled className="flash-icon" />
              <h1 className="gradient-text">FLASH SALE</h1>
            </div>

            {endTime && (
              <div className="countdown-wrapper">
                <span className="ending-text">Kết thúc trong</span>
                <div className="timer-box">
                  <CountdownTimer endTime={endTime} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Carousel Section --- */}
        <div className="carousel-wrapper">
          <Carousel ref={carouselRef} {...carouselSettings}>
            {flashItems.map((item) => (
              <div key={item.product_id} className="slide-item-wrapper">
                <FlashSaleItem flash={item} />
              </div>
            ))}
          </Carousel>

          {/* Custom Navigation Arrows */}
          <div 
            className="nav-arrow prev" 
            onClick={() => carouselRef.current.prev()}
            role="button"
            aria-label="Previous Slide"
          >
            <LeftOutlined />
          </div>
          <div 
            className="nav-arrow next" 
            onClick={() => carouselRef.current.next()}
            role="button"
            aria-label="Next Slide"
          >
            <RightOutlined />
          </div>
        </div>
      </div>
    </div>
  );
}