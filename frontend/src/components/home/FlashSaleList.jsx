import React, { useEffect, useState } from 'react';
import FlashSaleItem from './FlashSaleItem';
import api from '../../features/login_register/services/api';
import { Carousel } from 'antd';
import CountdownTimer from './CountdownTimer';
import '../../styles/home/FlashSaleList.css';

const FlashSaleItemSkeleton = () => (
  <div
    className="flash-sale-item-skeleton"
    style={{
      width: '100%',
      height: '200px',
      borderRadius: 8,
      background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }}
  />
);

const FlashSaleList = () => {
  const [flashItems, setFlashItems] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await api.get('/promotions/flash-sales/');
        const sales = res.data || [];
        if (!sales.length) {
          setFlashItems([]);
          setEndTime(null);
          return;
        }

        const currentFlash = sales[0];
        const items = (currentFlash.flashsale_products || []).map(p => ({
          ...p,
          flash_sale_id: currentFlash.id,
        }));

        setFlashItems(prev => {
          const prevIds = prev.map(i => i.product_id).join(',');
          const newIds = items.map(i => i.product_id).join(',');
          if (prevIds === newIds) return prev;
          return items;
        });

        setEndTime(currentFlash.end_time);
      } catch (err) {
        console.error('Failed to load flash sales', err);
        setFlashItems([]);
        setEndTime(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
    const interval = setInterval(fetchFlashSales, 30000);
    return () => clearInterval(interval);
  }, []);

  const slidesToShow = Math.min(6, flashItems.length);

  if (!loading && flashItems.length === 0) {
    return null;
  }

  return (
    <div className="flash-sale-section py-3">
      <div className="container">
        {/* Header */}
        <div className="flash-sale-header d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 p-3 rounded-3 bg-white shadow-sm">
          <h2 className="mb-2 mb-md-0 text-primary fw-bold">
            ⚡ ĐẠI HẠ GIÁ — GIẢM SỐC TRONG VÀI GIỜ
          </h2>
          {endTime && (
            <div className="mt-2 mt-md-0">
              <div className="d-flex align-items-center">
                <span className="me-2 text-muted fw-medium">Kết thúc sau:</span>
                <CountdownTimer endTime={endTime} />
              </div>
            </div>
          )}
        </div>

        {/* Carousel */}
        {loading ? (
          <Carousel dots slidesToShow={6} slidesToScroll={1} arrows>
            {Array.from({ length: 6 }).map((_, idx) => (
              <FlashSaleItemSkeleton key={idx} />
            ))}
          </Carousel>
        ) : flashItems.length > 0 ? (
          <Carousel
            dots
            arrows={flashItems.length > slidesToShow}
            infinite={flashItems.length > slidesToShow}
            slidesToShow={slidesToShow}
            slidesToScroll={1}
            responsive={[
              { breakpoint: 1200, settings: { slidesToShow: Math.min(3, flashItems.length), arrows: flashItems.length > 3 } },
              { breakpoint: 992, settings: { slidesToShow: Math.min(2, flashItems.length), arrows: flashItems.length > 2 } },
              { breakpoint: 576, settings: { slidesToShow: 1, arrows: flashItems.length > 1 } },
            ]}
          >
            {flashItems.map(item => (
              <div key={`${item.flash_sale_id}-${item.product_id}`} className="px-1">
                <FlashSaleItem flash={item} />
              </div>
            ))}
          </Carousel>
        ) : (
          <p className="text-center text-muted">Không có flash sale hiện tại</p>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .flash-sale-section {
          background: linear-gradient(135deg, #f9f7f0 0%, #fff 100%);
        }
        .flash-sale-header {
          border: 1px solid #e0e0e0;
          background: white;
        }
        .flash-sale-item-skeleton {
          display: block;
        }
      `}</style>
    </div>
  );
};

export default FlashSaleList;
