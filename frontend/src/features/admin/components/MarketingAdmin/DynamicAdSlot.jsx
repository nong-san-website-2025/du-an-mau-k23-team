// src/features/admin/components/MarketingAdmin/DynamicAdSlot.jsx
import React, { useEffect, useState } from "react";
import { getBannersBySlot } from "../../services/marketingApi";
import { Spin } from "antd";

export default function DynamicAdSlot({ slotCode }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBannersBySlot(slotCode)
      .then((res) => {
        const now = new Date();
        const active = (res.data || []).filter((b) => {
          const start = b.start_at ? new Date(b.start_at) : new Date(0);
          const end = b.end_at ? new Date(b.end_at) : new Date("2100-01-01");
          return b.is_active && now >= start && now <= end;
        });
        setBanners(active);
      })
      .catch((err) => console.error("❌ Lỗi DynamicAdSlot:", err))
      .finally(() => setLoading(false));
  }, [slotCode]);

  if (loading) return <Spin />;
  if (banners.length === 0) return null;

  // Quyết định cách hiển thị: 1 banner = ảnh tĩnh, nhiều banner = slider
  return (
    <div className="dynamic-ad-slot">
      {banners.length === 1 ? (
        <img
          src={banners[0].image}
          alt={banners[0].title}
          onClick={() =>
            banners[0].click_url && window.open(banners[0].click_url, "_blank")
          }
          style={{
            width: "100%",
            height: "auto", // ← Quan trọng: để ảnh tự điều chỉnh chiều cao theo tỷ lệ
            maxHeight: "600px", // ← Giới hạn max-height nếu cần
            objectFit: "cover", // ← Cắt ảnh để lấp đầy mà không bóp
            objectPosition: "center", // ← Cắt ở giữa, thường đẹp nhất cho banner
            borderRadius: "8px",
            cursor: "pointer",
          }}
        />
      ) : (
        <div className="ad-slider">
          {/* Có thể dùng react-slick để hiển thị carousel */}
          {banners.map((b) => (
            <img
              key={b.id}
              src={b.image}
              alt={b.title}
              onClick={() => b.click_url && window.open(b.click_url, "_blank")}
              style={{ width: "100%", maxHeight: "150px", cursor: "pointer", borderRadius: "8px", }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
