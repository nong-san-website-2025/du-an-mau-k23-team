// components/FlashSaleList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FlashSaleItem from './FlashSaleItem';

const FlashSaleList = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await axios.get('/api/flash-sales/');
        setFlashSales(res.data);
      } catch (err) {
        console.error("Failed to load flash sales", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
    // Polling nhẹ mỗi 30s để cập nhật thời gian
    const interval = setInterval(fetchFlashSales, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Đang tải Flash Sale...</div>;

  if (flashSales.length === 0) return null;

  return (
    <div className="flash-sale-section py-5 bg-light">
      <h2 className="text-center mb-4">⚡ FLASH SALE — GIẢM SỐC TRONG VÀI GIỜ</h2>
      <div className="container">
        <div className="row">
          {flashSales.map(flash => (
            <div key={flash.id} className="col-md-4 col-sm-6 mb-4">
              <FlashSaleItem flash={flash} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSaleList;