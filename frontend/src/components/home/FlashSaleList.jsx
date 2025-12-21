import React, { useRef, useEffect, useState } from "react";
import { Carousel, Skeleton, Empty, Button } from "antd";
import { RightOutlined, LeftOutlined, FireFilled, ClockCircleFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import FlashSaleItem from "./FlashSaleItem";
import CountdownTimer from "./CountdownTimer"; // Giả sử bạn đã có component này
import api from "../../features/login_register/services/api";

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
          setFlashItems(data[0].flashsale_products || []);
          setEndTime(data[0].end_time);
        } else {
          setFlashItems([]);
        }
      } catch (e) {
        console.error("Lỗi tải Flash Sale:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const carouselSettings = {
    dots: false,
    infinite: false, // Flash sale thường không nên loop vô hạn để người dùng biết điểm dừng
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 5,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 4 } },
      { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    ],
  };

  if (loading) return <SkeletonFlashSale />;
  if (flashItems.length === 0) return null; // Ẩn luôn section nếu không có Flash Sale (UX tốt hơn là hiện bảng trống)

  return (
    <div className="flash-sale-container container">
      {/* 1. Header Area: Tạo cảm giác gấp rút */}
      <div className="flash-sale-header">
        <div className="header-brand">
          <div className="flash-logo">
             <FireFilled className="animate-flicker" /> FLASH SALE
          </div>
          <div className="flash-timer">
            <span className="timer-text">Kết thúc trong:</span>
            {endTime && <CountdownTimer endTime={endTime} theme="box" />} 
          </div>
        </div>
        <Link to="/flash-sale" className="view-all-link">
          Xem tất cả <RightOutlined />
        </Link>
      </div>

      {/* 2. Body Area: Carousel */}
      <div className="flash-sale-body">
        <Carousel ref={carouselRef} {...carouselSettings} arrows={false}>
          {flashItems.map((item) => (
            <div key={item.product_id} className="carousel-item-padding">
              <FlashSaleItem flash={item} />
            </div>
          ))}
        </Carousel>

        {/* Custom Navigation Arrows (Chỉ hiện khi items > slides) */}
        {flashItems.length > 5 && (
            <>
                <div className="custom-arrow prev" onClick={() => carouselRef.current.prev()}>
                <LeftOutlined />
                </div>
                <div className="custom-arrow next" onClick={() => carouselRef.current.next()}>
                <RightOutlined />
                </div>
            </>
        )}
      </div>
    </div>
  );
}

// Sub-component Skeleton gọn gàng
const SkeletonFlashSale = () => (
  <div className="container" style={{ padding: '20px 0' }}>
    <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 20 }} />
    <div style={{ display: 'flex', gap: 15, overflow: 'hidden' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton.Button key={i} active style={{ width: 220, height: 300, borderRadius: 8 }} />
      ))}
    </div>
  </div>
);