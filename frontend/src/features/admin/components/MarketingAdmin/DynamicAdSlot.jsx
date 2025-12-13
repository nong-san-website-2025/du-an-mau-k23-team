// src/features/admin/components/MarketingAdmin/DynamicAdSlot.jsx
import React, { useEffect, useState } from "react";
import { getBannersBySlot } from "../../services/marketingApi";
import { Skeleton } from "antd"; // Dùng Skeleton nhìn chuyên nghiệp hơn Spin
// import { trackBannerClick } from "../../services/trackingApi"; // (Gợi ý cho tương lai)

export default function DynamicAdSlot({ 
  slotCode, 
  maxHeight, 
  className = "", 
  limit = 0 // 0 = lấy hết
}) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getBannersBySlot(slotCode)
      .then((res) => {
        if (!isMounted) return;
        const now = new Date();
        // Lọc banner active & còn hạn
        let active = (res.data || []).filter((b) => {
          const start = b.start_at ? new Date(b.start_at) : new Date(0);
          const end = b.end_at ? new Date(b.end_at) : new Date("2100-01-01");
          return b.is_active && now >= start && now <= end;
        });

        // Sắp xếp theo priority (độ ưu tiên) cao nhất lên đầu
        active.sort((a, b) => b.priority - a.priority);

        // Giới hạn số lượng nếu cần
        if (limit > 0) {
          active = active.slice(0, limit);
        }

        setBanners(active);
      })
      .catch((err) => console.error(`⚠️ Lỗi tải slot [${slotCode}]:`, err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slotCode, limit]);

  const handleBannerClick = (banner) => {
    // 1. (Optional) Gọi API tracking để đếm lượt click
    // trackBannerClick(banner.id);
    
    // 2. Chuyển hướng
    if (banner.click_url) {
      window.open(banner.click_url, "_blank");
    }
  };

  // 1. State Loading: Hiển thị khung xương (Skeleton) để tránh giật layout
  if (loading) {
    return (
      <div className={`promo-slot-skeleton ${className}`} style={{ height: maxHeight || '200px', overflow: 'hidden' }}>
        <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  if (banners.length === 0) return null;

  // 2. Render Banner
  // Mẹo: Đổi tên class 'ad-slot' thành 'promo-box' để tránh AdBlock
  return (
    <div className={`promo-box-container ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {banners.map((b) => (
        <div 
          key={b.id} 
          className="promo-item"
          style={{ 
            flex: 1, // Để các banner tự chia đều chiều cao nếu có nhiều banner
            overflow: 'hidden',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => handleBannerClick(b)}
        >
          <img
            src={b.image}
            alt={b.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover", // Quan trọng: Giữ ảnh đẹp dù khung hình thay đổi
              transition: "transform 0.3s ease"
            }}
            // Hiệu ứng hover nhẹ
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
        </div>
      ))}
    </div>
  );
}