// src/features/admin/components/MarketingAdmin/DynamicAdSlot.jsx

import React, { useEffect, useState } from "react";
import { getBannersBySlot } from "../../services/marketingApi";
import { Spin } from "antd";

export default function DynamicAdSlot({
  slotCode,
  maxHeight = "300px", // mặc định
  maxWidth = "100%",
  limit = null, // không giới hạn
  className = "",
}) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBannersBySlot(slotCode)
      .then((res) => {
        const now = new Date();
        let active = (res.data || []).filter((b) => {
          const start = b.start_at ? new Date(b.start_at) : new Date(0);
          const end = b.end_at ? new Date(b.end_at) : new Date("2100-01-01");
          return b.is_active && now >= start && now <= end;
        });

        if (limit !== null) {
          active = active.slice(0, limit);
        }

        setBanners(active);
      })
      .catch((err) => console.error("❌ Lỗi DynamicAdSlot:", err))
      .finally(() => setLoading(false));
  }, [slotCode, limit]);

  if (loading) return <Spin />;
  if (banners.length === 0) return null;

  return (
    <div className={`dynamic-ad-slot ${className}`}>
      {banners.length === 1 ? (
        <img
          src={banners[0].image}
          alt={banners[0].title}
          onClick={() =>
            banners[0].click_url && window.open(banners[0].click_url, "_blank")
          }
          style={{
            width: "100%",
            maxHeight: "200px",
            objectFit: "cover",
            objectPosition: "center",
            cursor: "pointer",
          }}
          loading="lazy"
        />
      ) : (
        <div className="ad-slider">
          {banners.map((b) => (
            <img
              key={b.id}
              src={b.image}
              alt={b.title}
              onClick={() => b.click_url && window.open(b.click_url, "_blank")}
              style={{
                width: "100%",
                maxHeight: "200px",
                objectFit: "cover",
                objectPosition: "center",
                cursor: "pointer",
              }}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}
