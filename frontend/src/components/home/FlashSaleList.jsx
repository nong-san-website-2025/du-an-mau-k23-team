import React, { useRef, useEffect, useState } from "react";
import { Carousel } from "antd";
import { ThunderboltFilled, RightOutlined, LeftOutlined } from "@ant-design/icons";
import FlashSaleItem from "./FlashSaleItem";
import CountdownTimer from "./CountdownTimer";
import api from "../../features/login_register/services/api"; // Giữ nguyên import của bạn

export default function FlashSaleList() {
  const carouselRef = useRef();
  const [flashItems, setFlashItems] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Giả lập data để test giao diện (bạn có thể xóa và dùng api call như cũ)
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
    <div className="flash-sale-container">
      <div className="container">
        {/* Header Section */}
        <div className="flash-header">
          <div className="header-title-group">
            <div className="flash-icon-box">
               <ThunderboltFilled />
            </div>
            <h2 className="title">FLASH SALE</h2>
            {endTime && <CountdownTimer endTime={endTime} />}
          </div>
          
          <a href="/flash-sale" className="view-all-link">
            Xem tất cả <RightOutlined style={{ fontSize: '10px' }} />
          </a>
        </div>

        {/* Carousel Section */}
        <div className="carousel-wrapper">
          <Carousel
            ref={carouselRef}
            infinite
            dots={false}
            slidesToShow={5} // Chỉnh số lượng mặc định phù hợp
            slidesToScroll={1}
            responsive={[
              { breakpoint: 1200, settings: { slidesToShow: 4 } },
              { breakpoint: 992, settings: { slidesToShow: 3 } },
              { breakpoint: 576, settings: { slidesToShow: 2 } },
            ]}
          >
            {flashItems.map((item) => (
              <div key={item.product_id} className="slide-padding">
                <FlashSaleItem flash={item} />
              </div>
            ))}
          </Carousel>

          {/* Navigation Arrows */}
          <button className="nav-btn prev-btn" onClick={() => carouselRef.current.prev()}>
            <LeftOutlined />
          </button>
          <button className="nav-btn next-btn" onClick={() => carouselRef.current.next()}>
            <RightOutlined />
          </button>
        </div>
      </div>

      <style jsx>{`
        .flash-sale-container {
          background-color: #fff;
          margin: 20px 0;
          padding: 20px 0;
        }

        /* Header Styling */
        .flash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 12px;
        }
        .header-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .flash-icon-box {
            font-size: 24px;
            color: #ff4d4f;
            animation: flash 1.5s infinite;
        }
        .title {
          margin: 0;
          color: #ff4d4f;
          font-weight: 800;
          font-size: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-right: 12px;
        }
        .view-all-link {
          color: #666;
          font-size: 14px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.3s;
        }
        .view-all-link:hover {
          color: #ff4d4f;
        }

        /* Carousel Styling */
        .carousel-wrapper {
          position: relative;
        }
        .slide-padding {
          padding: 0 6px; /* Khoảng cách giữa các card */
          height: 100%;
        }
        
        /* Custom Navigation Buttons */
        .nav-btn {
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #eee;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          color: #333;
          font-size: 16px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          opacity: 0; /* Ẩn mặc định */
        }
        .carousel-wrapper:hover .nav-btn {
          opacity: 1; /* Hiện khi hover vùng carousel */
        }
        .nav-btn:hover {
          background: #ff4d4f;
          color: #fff;
          border-color: #ff4d4f;
        }
        .prev-btn { left: -20px; }
        .next-btn { right: -20px; }

        @keyframes flash {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}