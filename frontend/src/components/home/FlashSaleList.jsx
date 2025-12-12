import React, { useRef, useEffect, useState } from "react";
import { Carousel, Button, Skeleton, Typography, theme } from "antd";
import { ThunderboltFilled, RightOutlined, LeftOutlined, FireFilled } from "@ant-design/icons";
import FlashSaleItem from "./FlashSaleItem";
import CountdownTimer from "./CountdownTimer";
import api from "../../features/login_register/services/api";

const { Title } = Typography;

export default function FlashSaleList() {
  const carouselRef = useRef();
  const [flashItems, setFlashItems] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook lấy token màu sắc từ Ant Design để đồng bộ theme
  const { token } = theme.useToken();

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

  // 1. Loading State: Hiển thị Skeleton thay vì null để chuẩn UX
  if (loading) {
    return (
      <div className="container" style={{ margin: "20px 0", padding: "20px" }}>
        <Skeleton active paragraph={{ rows: 1 }} />
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton.Image key={i} active style={{ width: 200, height: 250 }} />
          ))}
        </div>
      </div>
    );
  }

  if (flashItems.length === 0) return null;

  return (
    <div className="flash-sale-section">
      <div className="container">
        {/* Header Section */}
        <div className="flash-header">
          <div className="header-left">
            <div className="title-wrapper" >
              <ThunderboltFilled className="flash-icon" />
              <h1 className="gradient-text">FLASH SALE</h1>

            </div>

            {/* Countdown Wrapper - Tạo điểm nhấn cho đồng hồ */}
            {endTime && (
              <div className="countdown-badge">
                <span className="ending-text">Kết thúc trong:</span>
                <CountdownTimer endTime={endTime} />
              </div>
            )}
          </div>

          <Button type="link" href="/flash-sale" className="view-all-btn">
            Xem tất cả <RightOutlined />
          </Button>
        </div>

        {/* Carousel Section */}
        <div className="carousel-container">
          <Carousel
            ref={carouselRef}
            infinite
            dots={false}
            slidesToShow={5}
            slidesToScroll={2} // Scroll 2 item cho nhanh hơn
            draggable
            responsive={[
              { breakpoint: 1400, settings: { slidesToShow: 5 } },
              { breakpoint: 1200, settings: { slidesToShow: 4 } },
              { breakpoint: 992, settings: { slidesToShow: 3 } },
              { breakpoint: 768, settings: { slidesToShow: 2 } },
              { breakpoint: 576, settings: { slidesToShow: 1 } }, // Mobile hiển thị 1 cái to
            ]}
          >
            {flashItems.map((item) => (
              <div key={item.product_id} className="slide-item">
                <FlashSaleItem flash={item} />
              </div>
            ))}
          </Carousel>

          {/* Navigation Arrows - Đặt giữa chiều cao hình ảnh */}
          <div className="nav-arrow prev" onClick={() => carouselRef.current.prev()}>
            <LeftOutlined />
          </div>
          <div className="nav-arrow next" onClick={() => carouselRef.current.next()}>
            <RightOutlined />
          </div>
        </div>
      </div>

      <style jsx>{`
        .flash-sale-section {
          background-color: #fff;
          margin: 24px 0;
          padding: 24px 0;
          border-radius: 8px; /* Bo góc nhẹ cho container */
          /* Có thể thêm shadow nếu nền web màu xám */
          /* box-shadow: 0 2px 8px rgba(0,0,0,0.06); */
        }

        /* --- Header Styling --- */
        .flash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f5f5f5; /* Line ngăn cách rõ hơn */
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .title-wrapper {
        display: flex;           /* Kích hoạt Flexbox */
        align-items: center;     /* Căn giữa theo trục dọc (Vertical Center) */
        justify-content: center; /* (Tuỳ chọn) Căn giữa theo trục ngang nếu cần */
        gap: 12px;               /* Khoảng cách giữa Icon và Chữ */
        height: 100%;            /* Đảm bảo chiều cao để căn giữa hoạt động */
    }

    .gradient-text {
        font-size: 28px;
        font-weight: 900;
        
        /* --- DÒNG QUAN TRỌNG ĐỂ CĂN GIỮA --- */
        margin: 0;              /* Xóa margin mặc định của h2 */
        line-height: 1;         /* Giảm chiều cao dòng để chữ không bị lệch lên/xuống */
        padding-top: 4px;       /* (Mẹo) Đôi khi font chữ in hoa cần đẩy xuống xíu để đều mắt với icon */
        
        /* Style màu mè cũ */
        text-transform: uppercase;
        font-family: 'Arial Black', sans-serif;
        background: linear-gradient(90deg, #ff4d4f 0%, #f5222d 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .flash-icon {
        font-size: 32px;
        color: #ff4d4f;
        display: flex;          /* Giúp icon căn chuẩn hơn trong flex */
        align-items: center;
    }
        
        .fire-icon {
            font-size: 24px;
            color: #ff7a45;
        }

        /* --- Countdown Styling --- */
        .countdown-badge {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #262626; /* Nền tối để làm nổi bật số */
            padding: 6px 16px;
            border-radius: 20px;
            color: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        
        .ending-text {
            font-size: 13px;
            opacity: 0.8;
            font-weight: 500;
        }

        /* Giả sử CountdownTimer trả về text, CSS này sẽ style cho text đó màu trắng */
        .countdown-badge :global(div), .countdown-badge :global(span) {
            color: #fff; 
            font-weight: 700;
            font-size: 16px;
            font-family: monospace; /* Font số kỹ thuật số */
        }

        .view-all-btn {
            font-weight: 600;
            font-size: 15px;
            color: #595959;
        }
        .view-all-btn:hover {
            color: #ff4d4f;
        }

        /* --- Carousel & Navigation --- */
        .carousel-container {
            position: relative;
            padding: 0 10px; /* Tránh bị cắt shadow của item */
        }

        .slide-item {
            padding: 10px 8px; /* Tạo khoảng thở giữa các card */
            transition: transform 0.3s;
        }
        
        /* Hiệu ứng hover cho card bên trong (nếu FlashSaleItem chưa có) */
        .slide-item:hover {
             transform: translateY(-5px);
        }

        .nav-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 44px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #f0f0f0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10;
            font-size: 18px;
            color: #595959;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0; /* Ẩn mặc định */
        }
        
        /* Chỉ hiện mũi tên khi hover vào vùng carousel */
        .carousel-container:hover .nav-arrow {
            opacity: 1;
        }

        .nav-arrow:hover {
            background: #ff4d4f;
            color: white;
            border-color: #ff4d4f;
            transform: translateY(-50%) scale(1.1);
        }

        .prev { left: -22px; }
        .next { right: -22px; }

        @keyframes shake {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-15deg); }
            100% { transform: rotate(0deg); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-left {
                gap: 10px;
                flex-direction: column;
                align-items: flex-start;
            }
            .gradient-text {
                font-size: 22px;
            }
            .nav-arrow {
                display: none; /* Ẩn mũi tên trên mobile, dùng vuốt tay */
            }
        }
      `}</style>
    </div>
  );
}