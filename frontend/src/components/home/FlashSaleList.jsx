// FlashSaleList.jsx
import React, { useEffect, useState } from 'react';
import FlashSaleItem from './FlashSaleItem';
import api from '../../features/login_register/services/api';
import { Carousel } from 'antd';
import '../../styles/home/FlashSaleList.css';
import CountdownTimer from './CountdownTimer';

const FlashSaleList = () => {
  const [flashItems, setFlashItems] = useState([]);
  const [globalCountdown, setGlobalCountdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await api.get('/promotions/flash-sales/');
        const sales = res.data || [];

        if (sales.length === 0) {
          setFlashItems([]);
          setGlobalCountdown(null);
          return;
        }

        const currentFlash = sales[0];
        const items = (currentFlash.flashsale_products || []).map(product => ({
          ...product,
          flash_sale_id: currentFlash.id,
        }));

        setFlashItems(items);

        const endTime = new Date(currentFlash.end_time);
        const now = new Date();
        const remainingSecs = Math.max(0, Math.floor((endTime - now) / 1000));
        setGlobalCountdown(remainingSecs);
      } catch (err) {
        console.error("Failed to load flash sales", err);
        setFlashItems([]);
        setGlobalCountdown(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
    const interval = setInterval(fetchFlashSales, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globalCountdown === null || globalCountdown <= 0) return;
    const timer = setInterval(() => {
      setGlobalCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [globalCountdown]);

  if (loading) return (
    <div className="flash-sale-section py-5 bg-light">
      <div className="container text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );

  if (flashItems.length === 0) return null;

  return (
    <div className="flash-sale-section py-3">
      <div className="container">
        {/* Tiêu đề + Countdown */}
        <div className="flash-sale-header d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 p-3 rounded-3 bg-white shadow-sm">
          <h2 className="mb-2 mb-md-0 text-primary fw-bold">
            ⚡ ĐẠI HẠ GIÁ — GIẢM SỐC TRONG VÀI GIỜ
          </h2>
          <div className="mt-2 mt-md-0">
            {globalCountdown !== null && (
              <div className="d-flex align-items-center">
                <span className="me-2 text-muted fw-medium">Kết thúc sau:</span>
                <CountdownTimer timeLeft={globalCountdown} />
              </div>
            )}
          </div>
        </div>

        {/* Carousel */}
        <Carousel
          dots
          arrows
          infinite
          slidesToShow={6}
          slidesToScroll={1}
          responsive={[
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 992, settings: { slidesToShow: 2 } },
            { breakpoint: 576, settings: { slidesToShow: 1 } },
          ]}
          className="flash-sale-carousel"
        >
          {flashItems.map(item => (
            <div key={`${item.flash_sale_id}-${item.product_id}`} className="px-0">
              <FlashSaleItem flash={item} />
            </div>
          ))}
        </Carousel>
      </div>

      <style jsx>{`
        .flash-sale-section {
          background: linear-gradient(135deg, #f9f7f0 0%, #fff 100%);
        }
        .flash-sale-header {
          border: 1px solid #e0e0e0;
          background: white;
        }
        .flash-sale-carousel .slick-slide {
          padding: 0 8px;
        }
        .flash-sale-carousel .slick-list {
          margin: 0 -8px;
        }
      `}</style>
    </div>
  );
};

export default FlashSaleList;