import React from "react";
import { Link } from "react-router-dom";
import { FireFilled } from "@ant-design/icons";
import { intcomma } from '../../utils/format';

export default function FlashSaleItem({ flash }) {
  if (!flash) return null;

  // Logic tính toán
  const stock = flash.stock || 0;
  const remaining = flash.remaining_stock ?? stock;
  const soldQty = stock - remaining;
  const soldPercent = stock > 0 ? Math.round((soldQty / stock) * 100) : 0;
  const discount = Math.round(((flash.original_price - flash.flash_price) / flash.original_price) * 100);

  // UX Logic: Hiển thị thanh trạng thái
  let statusText = `Đã bán ${soldQty}`;
  let progressWidth = soldPercent;
  
  if (soldPercent >= 90) {
      statusText = "Sắp cháy hàng";
      progressWidth = 100; // Visual trick: đầy thanh để báo động đỏ
  } else if (soldPercent === 0) {
      statusText = "Vừa mở bán";
  }

  return (
    <Link to={`/products/${flash.product_id}`} className="fs-card">
      {/* Image Section */}
      <div className="fs-img-wrapper">
        <img 
            src={flash.product_image || flash.thumbnail_url} 
            alt={flash.product_name} 
            loading="lazy" 
        />
        {/* Sticker giảm giá chuẩn Shopee */}
        <div className="fs-badge">
          <span className="fs-badge-percent">{discount}%</span>
          <span className="fs-badge-label">GIẢM</span>
        </div>
        
        {/* Overlay brand logo/mall nếu có (Optional) */}
        <div className="fs-overlay"></div>
      </div>

      {/* Content Section */}
      <div className="fs-content">
        <div className="fs-price">
          <span className="currency">₫</span>
          <span className="amount">{intcomma(flash.flash_price)}</span>
        </div>
        
        {/* Progress Bar kiểu "Viên thuốc" */}
        <div className="fs-progress-bar">
          <div 
            className="fs-progress-fill" 
            style={{ width: `${Math.max(10, progressWidth)}%` }} // Luôn hiện ít nhất 10% màu để đẹp
          ></div>
          <div className="fs-progress-text">
            {soldPercent >= 90 && <FireFilled />} {statusText}
          </div>
        </div>
      </div>
    </Link>
  );
}