import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FireFilled } from "@ant-design/icons";
import { Skeleton } from "antd";
import { intcomma } from './../../utils/format';

export default function FlashSaleItem({ flash }) {
  // 1. Khai báo State đầu tiên
  const [progress, setProgress] = useState(0);

  // 2. Tính toán các giá trị cần thiết cho Effect (Sử dụng ?. để tránh lỗi nếu flash null)
  const remainingStock = flash?.remaining_stock ?? flash?.stock ?? 0;
  const stock = flash?.stock ?? 0;
  const soldPercent = stock > 0 ? ((stock - remainingStock) / stock) * 100 : 0;

  // 3. Gọi useEffect (Luôn gọi hook này, không được đặt sau return)
  useEffect(() => {
    setProgress(soldPercent);
  }, [soldPercent]);

  // 4. BÂY GIỜ MỚI ĐƯỢC CHECK ĐỂ RETURN SỚM
  // Nếu không có dữ liệu flash, trả về Skeleton
  if (!flash) return <Skeleton active />;

  // --- Các biến hiển thị khác (Chỉ chạy khi flash tồn tại) ---
  const isSoldOut = remainingStock <= 0;
  const isHot = soldPercent > 80;

  const imageUrl =
    flash.product_image?.trim() ||
    flash.thumbnail_url?.trim() ||
    flash.image?.trim();

  const discount =
    flash.original_price && flash.flash_price
      ? Math.round(((flash.original_price - flash.flash_price) / flash.original_price) * 100)
      : 0;

  return (
    <div className="flash-card">
      {/* Image Area */}
      <div className="flash-image-wrapper">
        <Link to={`/products/${flash.product_id}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={flash.product_name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="skeleton-wrapper">
                <Skeleton.Image active={true} style={{ width: '100%', height: '100%' }} />
            </div>
          )}
        </Link>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="discount-tag">
            <span className="percent">{discount}%</span>
            <span className="label">GIẢM</span>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="flash-info">
        <Link to={`/products/${flash.product_id}`} className="product-name" title={flash.product_name}>
          {flash.product_name || <Skeleton paragraph={{ rows: 1 }} title={false} active />}
        </Link>

        <div className="price-section">
          <div className="current-price">
            {flash.flash_price ? `${intcomma(flash.flash_price)}₫` : <Skeleton.Button active size="small" />}
          </div>
          {flash.original_price && (
            <div className="old-price">{intcomma(flash.original_price)} ₫</div>
          )}
        </div>

        {/* Stock Progress Bar */}
        <div className="stock-progress-wrapper">
          <div className="progress-bg">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
            
            <div className="stock-status-text">
              {isSoldOut ? "HẾT HÀNG" : <>ĐÃ BÁN {Math.round(soldPercent)}%</>}
            </div>
            {isHot && !isSoldOut && <FireFilled className="fire-icon" />}
          </div>
        </div>
      </div>

      <style jsx>{`
        .flash-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid #f0f0f0;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .flash-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border-color: #ff4d4f;
        }

        /* Image */
        .flash-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
        }
        .flash-image-wrapper img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }
        
        .skeleton-wrapper {
             position: absolute;
             top: 0; left: 0;
             width: 100%; height: 100%;
             display: flex;
             align-items: center;
             justify-content: center;
             background: #f5f5f5;
        }
        .skeleton-wrapper :global(.ant-skeleton-image) {
            width: 100% !important;
            height: 100% !important;
            border-radius: 0;
        }
        .skeleton-wrapper :global(.ant-skeleton-image svg) {
            width: 30%; height: 30%;
            color: #bfbfbf;
        }

        .flash-card:hover img {
          transform: scale(1.05);
        }

        /* Discount Tag Style */
        .discount-tag {
          position: absolute;
          top: 0; right: 0;
          background: rgba(255, 212, 36, 0.95);
          width: 40px; height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 12px; font-weight: 700;
          color: #ff4d4f;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
          z-index: 10;
        }
        .discount-tag .percent { font-size: 13px; line-height: 1; }
        .discount-tag .label { font-size: 10px; text-transform: uppercase; }

        /* Info */
        .flash-info {
          padding: 10px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .product-name {
          font-size: 14px;
          color: #333;
          line-height: 1.4;
          height: 40px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          margin-bottom: 8px;
          text-decoration: none;
        }
        .product-name:hover { color: #ff4d4f; }

        /* Price */
        .price-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
          min-height: 42px;
        }
        .current-price {
          font-size: 18px; font-weight: 700; color: #ff4d4f; line-height: 1.2;
        }
        .old-price {
          font-size: 13px; color: #999; text-decoration: line-through;
        }

        /* Stock Progress Bar */
        .stock-progress-wrapper {
            margin-top: auto;
        }
        .progress-bg {
            position: relative;
            width: 100%;
            height: 18px;
            background: #e6e6e6; 
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff9c00 0%, #ff0000 100%);
            border-radius: 10px 0 0 10px;
            transition: width 0.5s ease;
            position: relative;
            z-index: 1;
        }
        .stock-status-text {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            color: #fff;
            text-transform: uppercase;
            text-shadow: 0 0 3px rgba(0,0,0,0.4);
            z-index: 2;
        }
        .fire-icon {
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            color: #fff;
            z-index: 3;
            font-size: 12px;
            filter: drop-shadow(0 0 2px rgba(255,0,0,0.5));
        }
      `}</style>
    </div>
  );
}