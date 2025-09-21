// components/FlashSaleItem.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

const FlashSaleItem = ({ flash }) => {
  const [timeLeft, setTimeLeft] = useState(flash.remaining_time);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isSoldOut = flash.remaining_stock <= 0;
  const isExpired = timeLeft <= 0;

  return (
    <div className="card h-100 shadow-sm">
      <Link to={`/products/${flash.product_id}`}>
        <img
          src={flash.product_image || '/default-product.jpg'}
          className="card-img-top"
          alt={flash.product_name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
      </Link>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{flash.product_name}</h5>
        <p className="text-danger fw-bold">
          {flash.flash_price.toLocaleString()}đ
          <small className="text-muted text-decoration-line-through ms-2">
            {flash.original_price.toLocaleString()}đ
          </small>
        </p>
        <div className="mt-auto">
          <CountdownTimer timeLeft={timeLeft} />
          <div className="progress mt-2" style={{ height: '8px' }}>
            <div
              className="progress-bar bg-danger"
              role="progressbar"
              style={{ width: `${((flash.stock - flash.remaining_stock) / flash.stock) * 100}%` }}
            ></div>
          </div>
          <small className="text-muted">
            Đã bán: {flash.stock - flash.remaining_stock} / {flash.stock}
          </small>
          <div className="mt-3">
            {isExpired ? (
              <button className="btn btn-secondary w-100" disabled>Hết giờ</button>
            ) : isSoldOut ? (
              <button className="btn btn-secondary w-100" disabled>Đã bán hết</button>
            ) : (
              <Link
                to={`/products/${flash.product_id}`}
                className="btn btn-danger w-100"
              >
                Mua ngay
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleItem;