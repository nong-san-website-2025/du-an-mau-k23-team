import React, { useRef, useEffect, useState } from "react";
import { Carousel } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import FlashSaleItem from "./FlashSaleItem";
import CountdownTimer from "./CountdownTimer";
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
          const current = data[0];
          setFlashItems(current.flashsale_products || []);
          setEndTime(current.end_time);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!loading && flashItems.length === 0) return null;

  return (
    <div className="flash-sale-section">
      <div className="container">
        {/* Header */}
        <div className="flash-sale-header">
          <div className="left">
            <ThunderboltOutlined className="flash-icon" style={{ color: '#ff4d4f', fontSize: '24px' }} />
            <h2>FLASH SALE HÔM NAY</h2>
          </div>
          <div className="right d-flex align-items-center gap-3">
            {endTime && (
              <>
                <span>Kết thúc sau:</span>
                <CountdownTimer endTime={endTime} />
              </>
            )}
          </div>
        </div>

        {/* Carousel */}
        <div className="flash-sale-carousel-wrapper position-relative">
          <Carousel
            ref={carouselRef}
            infinite
            slidesToShow={Math.min(6, flashItems.length)}
            slidesToScroll={1}
            responsive={[
              { breakpoint: 1200, settings: { slidesToShow: 4 } },
              { breakpoint: 992, settings: { slidesToShow: 3 } },
              { breakpoint: 576, settings: { slidesToShow: 2 } },
            ]}
          >
            {flashItems.map((item) => (
              <div key={item.product_id} className="flash-slide">
                <FlashSaleItem flash={item} />
              </div>
            ))}
          </Carousel>

          {/* Custom Arrows */}
          <button className="custom-prev" onClick={() => carouselRef.current.prev()}>
            &#8249;
          </button>
          <button className="custom-next" onClick={() => carouselRef.current.next()}>
            &#8250;
          </button>
        </div>

        {/* View All */}
        <div className="view-all-container d-flex justify-content-end">
          <a href="/flash-sale" className="view-all-btn">
            Xem tất cả ưu đãi →
          </a>
        </div>
      </div>
    </div>
  );
}
