import React, { useEffect, useState } from "react";
import { getBannersByPosition } from "../../features/admin/services/marketingApi";

const SideBanners = () => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const fetchSideBanners = async () => {
      try {
        const res = await getBannersByPosition("carousel");
        const now = new Date();

        // Lọc banner active và trong khoảng thời gian hợp lệ
        const activeBanners = (res.data || [])
          .filter((banner) => {
            if (!banner.is_active) return false;
            const start = banner.start_at ? new Date(banner.start_at) : new Date(0);
            const end = banner.end_at
              ? new Date(banner.end_at)
              : new Date("2100-01-01");
            return now >= start && now <= end;
          })
          .slice(0, 2); // Chỉ lấy tối đa 2 banner

        // Nếu ít hơn 2, thêm banner trống (placeholder)
        while (activeBanners.length < 2) {
          activeBanners.push({
            id: `placeholder-${activeBanners.length}`,
            image: null,
            click_url: null,
            title: "Chưa có banner",
          });
        }

        setBanners(activeBanners);
      } catch (error) {
        console.error("Lỗi khi tải banner phụ (carousel):", error);
        // Dùng placeholder nếu lỗi
        setBanners([
          { id: "ph1", image: null, click_url: null, title: "Lỗi tải" },
          { id: "ph2", image: null, click_url: null, title: "Lỗi tải" },
        ]);
      }
    };

    fetchSideBanners();
  }, []);

  const handleClick = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      style={{
        flex: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          onClick={() => handleClick(banner.click_url)}
          style={{
            width: "100%",
            height: "150px",
            overflow: "hidden",
            cursor: banner.click_url ? "pointer" : "default",
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {banner.image ? (
            <img
              src={banner.image}
              alt={banner.title || `Banner phụ ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              loading="lazy"
            />
          ) : (
            <span style={{ color: "#999", fontSize: "12px", textAlign: "center" }}>
              {banner.title}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default SideBanners;