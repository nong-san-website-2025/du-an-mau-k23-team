// FlashSaleItem.jsx (đã rút gọn phần không cần thiết)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FlashSaleItem = ({ flash }) => {
  // ❌ Không cần timeLeft nữa
  const [progress, setProgress] = useState(0);

  // Giả sử bạn có `remaining_stock` từ backend, nếu không thì cần tính hoặc ẩn
  const remainingStock = flash.remaining_stock ?? flash.stock; // fallback
  const isSoldOut = remainingStock <= 0;
  const progressPercent = ((flash.stock - remainingStock) / flash.stock) * 100;
  const isAlmostSoldOut = remainingStock / flash.stock < 0.1;

  useEffect(() => {
    setProgress(progressPercent);
  }, [progressPercent]);

  return (
    <div className="card h-100 shadow-sm border-0 overflow-hidden hover-scale">
      <Link to={`/products/${flash.product_id}`}>
        <img
          src={flash.product_image || '/default-product.jpg'}
          className="card-img-top"
          alt={flash.product_name}
          style={{ height: '160px', objectFit: 'cover' }}
        />
      </Link>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title text-truncate" title={flash.product_name}>
          {flash.product_name}
        </h5>
        <p className="text-danger fw-bold fs-5 mb-1">
          {Number(flash.flash_price).toLocaleString()}đ
        </p>
        {/* Progress Bar */}
        <div className="progress mt-3 mb-1" style={{ height: '10px', borderRadius: '5px', background: '#e0e0e0' }}>
          <div
            className={`progress-bar ${isAlmostSoldOut ? 'pulse' : ''} shimmer`}
            role="progressbar"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              borderRadius: '5px',
              transition: 'width 0.8s ease-in-out',
            }}
          ></div>
        </div>
        <small className="text-muted mb-2 d-block">
          Đã bán: {flash.stock - remainingStock} / {flash.stock}
        </small>

        <div className="mt-auto">
          {isSoldOut ? (
            <button className="btn btn-secondary w-100" disabled>Đã bán hết</button>
          ) : (
            <Link
              to={`/products/${flash.product_id}`}
              className="btn btn-success w-100 fw-bold"
            >
              Mua ngay
            </Link>
          )}
        </div>
      </div>
      <style jsx>{`
        .hover-scale:hover img {
          transform: scale(1.05);
        }
        .hover-scale:hover {
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          transition: box-shadow 0.3s;
        }

        /* Pulse khi gần hết stock */
        .pulse {
          animation: pulseGlow 1s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 8px #ff4d4f; }
          50% { box-shadow: 0 0 12px #ff4d4f; }
          100% { box-shadow: 0 0 8px #ff4d4f; }
        }

        /* Shimmer / gradient động */
        .shimmer {
          background: linear-gradient(270deg, #56ab2f, #a8e063, #56ab2f);
          background-size: 600% 100%;
          animation: shimmer 2s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 100% 0; }
        }
      `}</style>
    </div>
  );
};

export default FlashSaleItem;
  