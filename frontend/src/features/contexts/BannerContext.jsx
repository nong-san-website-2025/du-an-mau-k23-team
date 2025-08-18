import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import a1 from "../../assets/image/a1.jpg";
import a2 from "../../assets/image/a2.jpg";
import a3 from "../../assets/image/a3.jpg";


// 1) Shape of a banner
// id, title, subtitle, description, image, bgGradient, rating, reviews, badge, features, isActive (optional)

const BannerContext = createContext(null);

const STORAGE_KEY = "gf_banners_v1";

const defaultBanners = [
  {
    id: 1,
    title: "Sạch Tuyệt Đối Đẳng Cấp Premium",
    subtitle: "Trực tiếp từ nông trường đến bàn ăn của bạn",
    description:
      "Chúng tôi cam kết mang đến những sản phẩm nông nghiệp tươi ngon, an toàn và chất lượng cao nhất với tiêu chuẩn quốc tế. Được chứng nhận bởi các tổ chức uy tín thế giới.",
    image: a1,
    bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)",
    rating: 4.9,
    reviews: "15,247",
    badge: "Chứng nhận USDA Organic",
    features: ["100% Hữu cơ", "Không hóa chất", "Tươi ngon tự nhiên"],
    isActive: true,
  },
  {
    id: 2,
    title: "Công Nghệ Nông Nghiệp 4.0",
    subtitle: "Ứng dụng AI và IoT trong canh tác hiện đại",
    description:
      "Sử dụng công nghệ tiên tiến nhất bao gồm trí tuệ nhân tạo, IoT và blockchain để đảm bảo chất lượng, năng suất và tính bền vững trong sản xuất nông nghiệp.",
    image: a2,
    bgGradient: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
    rating: 4.8,
    reviews: "8,932",
    badge: "Công nghệ AI tiên tiến",
    features: ["Smart Farming", "AI Monitoring", "IoT Sensors"],
    isActive: true,
  },
  {
    id: 3,
    title: "Trồng Tự Nhiên Sống An Nhiên",
    subtitle: "Không hóa chất - Không GMO - Không thuốc trừ sâu",
    description:
      "Tất cả sản phẩm đều được trồng theo phương pháp hữu cơ nghiêm ngặt, thân thiện với môi trường và sức khỏe. Được kiểm định bởi các tổ chức chứng nhận quốc tế uy tín.",
    image: a3,
    bgGradient: "linear-gradient(135deg, #22c55e 0%, #10b981 50%, #84cc16 100%)",
    rating: 5.0,
    reviews: "22,156",
    badge: "Chứng nhận EU Organic",
    features: ["Zero Pesticide", "Non-GMO", "Eco-Friendly"],
    isActive: true,
  },
  {
    id: 4,
    title: "Giao Hàng Super Premium",
    subtitle: "Giao hàng trong 2 giờ - Tươi ngon đảm bảo",
    description:
      "Hệ thống logistics hiện đại với chuỗi lạnh hoàn hảo, đội ngũ giao hàng chuyên nghiệp và công nghệ theo dõi real-time đảm bảo sản phẩm luôn tươi ngon khi đến tay bạn.",
    image: a1,
    bgGradient: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)",
    rating: 4.9,
    reviews: "31,428",
    badge: "Giao hàng 2h Express",
    features: ["Cold Chain", "Real-time Tracking", "Premium Service"],
    isActive: true,
  },
];

export function BannerProvider({ children }) {
  const [banners, setBanners] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultBanners;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
    } catch {}
  }, [banners]);

  const updateBanner = (id, data) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const toggleBannerStatus = (id) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)));
  };

  const value = useMemo(
    () => ({ banners, updateBanner, toggleBannerStatus }),
    [banners]
  );

  return <BannerContext.Provider value={value}>{children}</BannerContext.Provider>;
}

export function useBanner() {
  const ctx = useContext(BannerContext);
  if (!ctx) throw new Error("useBanner must be used within BannerProvider");
  return ctx;
}