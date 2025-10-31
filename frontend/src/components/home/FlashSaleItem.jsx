import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NoImage from "../shared/NoImage";

export default function FlashSaleItem({ flash }) {
  const [progress, setProgress] = useState(0);

  const remainingStock = flash.remaining_stock ?? flash.stock;
  const isSoldOut = remainingStock <= 0;
  const soldPercent = ((flash.stock - remainingStock) / flash.stock) * 100;
  const isAlmostSoldOut = remainingStock / flash.stock < 0.1;

  useEffect(() => setProgress(soldPercent), [soldPercent]);

  const imageUrl =
    flash.product_image?.trim() ||
    flash.thumbnail_url?.trim() ||
    flash.image?.trim();

  const discount =
    flash.original_price && flash.flash_price
      ? Math.round(
          ((flash.original_price - flash.flash_price) / flash.original_price) *
            100
        )
      : 0;

  return (
    <div className="flash-card">
      <div className="flash-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={flash.product_name}
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <NoImage height={160} text="No Image" />
        )}
        {discount > 0 && <div className="discount-badge">-{discount}%</div>}
      </div>

      <div className="flash-info">
        <h6 className="product-name" title={flash.product_name}>
          {flash.product_name}
        </h6>
        <div className="price-group">
          <span className="flash-price">
            {Number(flash.flash_price).toLocaleString()}₫
          </span>
          {flash.original_price && (
            <span className="original-price">
              {Number(flash.original_price).toLocaleString()}₫
            </span>
          )}
        </div>

        <div className="progress-container">
          <div
            className="progress-bar"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>
        <small className="stock-text">
          {isSoldOut
            ? "Đã bán hết 🔥"
            : `Đã bán ${flash.stock - remainingStock}/${flash.stock}`}
        </small>

        <Link
          to={`/products/${flash.product_id}`}
          className={`buy-btn ${isSoldOut ? "disabled" : ""}`}
          style={{ textDecoration: "none" }}
        >
          {isSoldOut ? "Đã hết hàng" : "Mua ngay"}
        </Link>
      </div>

      <style jsx>{`
        .flash-card {
          background: #fff;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .flash-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .flash-image {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
        }

        .flash-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .flash-card:hover img {
          transform: scale(1.05);
        }

        .discount-badge {
          position: absolute;
          top: 0px;
          right: 0px;
          background: linear-gradient(45deg, #ff4d4f, #ff7a45);
          color: #fff;
          font-weight: bold;
          font-size: 0.8rem;
          padding: 4px 8px;
          border-radius: 0px 0px 0px 6px;
        }

        .flash-info {
          padding: 12px;
          text-align: center;
        }

        .product-name {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 6px;
          line-height: 1.3;
          min-height: 36px;
          color: #222;

          /* ✨ Giới hạn chữ hiển thị */
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2; /* số dòng muốn hiển thị, có thể đổi 1 hoặc 3 */
          -webkit-box-orient: vertical;
          word-break: break-word;
        }

        .price-group {
          margin-bottom: 8px;
        }

        .flash-price {
          font-size: 1.1rem;
          font-weight: bold;
          color: #ff4d4f;
          margin-right: 6px;
        }

        .original-price {
          text-decoration: line-through;
          color: #999;
          font-size: 0.85rem;
        }

        .progress-container {
          height: 8px;
          background: #f2f2f2;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ff7a45, #ff4d4f);
          transition: width 0.5s ease-in-out;
          position: relative;
        }

        .stock-text {
          font-size: 0.8rem;
          color: ${isAlmostSoldOut ? "#ff4d4f" : "#666"};
          font-weight: 500;
        }

        .buy-btn {
          display: block;
          margin-top: 8px;
          background: linear-gradient(90deg, #ff7a45, #ff4d4f);
          color: white;
          font-weight: bold;
          border: none;
          padding: 6px 0;
          border-radius: 6px;
          transition: 0.3s;
        }
        .buy-btn:hover {
          background: linear-gradient(90deg, #ff4d4f, #ff7a45);
        }
        .buy-btn.disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
