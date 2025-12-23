import React, { useEffect, useState } from "react";
import { Skeleton } from "antd";
// ĐƯỜNG DẪN IMPORT: Lùi 2 cấp từ components/MarketingAdmin đến services
import { getPublicBanners } from "../../services/marketingApi";

export default function DynamicAdSlot({ 
  slotCode, 
  maxHeight, 
  className = "", 
  limit = 0 
}) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!slotCode) return;
    
    setLoading(true);

    // Dùng API Public: Backend đã tự lọc ngày giờ và trạng thái active
    getPublicBanners(slotCode)
      .then((res) => {
        if (!isMounted) return;
        
        // Data có thể là res hoặc res.data tùy cấu hình axios
        let list = res.data || res;
        if (!Array.isArray(list)) list = [];

        // Backend đã lọc rồi, nhưng frontend sort lại theo priority cho chắc chắn
        list.sort((a, b) => b.priority - a.priority);

        // Giới hạn số lượng
        if (limit > 0) {
          list = list.slice(0, limit);
        }

        setBanners(list);
      })
      .catch((err) => console.error(`⚠️ Lỗi tải slot [${slotCode}]:`, err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slotCode, limit]);

  const handleBannerClick = (banner) => {
    if (banner.click_url) {
      window.open(banner.click_url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className={`promo-slot-skeleton ${className}`} style={{ height: maxHeight || '200px', overflow: 'hidden' }}>
        <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className={`promo-box-container ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {banners.map((b) => (
        <div 
          key={b.id} 
          className="promo-item"
          style={{ 
            flex: 1, 
            overflow: 'hidden',
            borderRadius: '8px',
            cursor: b.click_url ? 'pointer' : 'default',
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
              objectFit: "cover",
              transition: "transform 0.3s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
        </div>
      ))}
    </div>
  );
}