"use client"

import { useState, useEffect } from "react"
import a1 from"../assets/image/a1.jpg"
import a2 from"../assets/image/a2.jpg"
import a3 from"../assets/image/a3.jpg"
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  Shield,
  Truck,
  Award,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  Globe,
  CheckCircle,
} from "lucide-react"

// Dữ liệu banners
const banners = [
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
  },

]

const features = [
  {
    icon: Leaf,
    title: "100% Hữu Cơ",
    description: "Chứng nhận hữu cơ quốc tế USDA, JAS, EU với quy trình kiểm soát nghiêm ngặt",
    bgGradient: "linear-gradient(135deg, #22c55e, #10b981)",
  },
  {
    icon: Shield,
    title: "An Toàn Tuyệt Đối",
    description: "Kiểm tra 247 thông số chất lượng, đảm bảo 0% hóa chất độc hại",
    bgGradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
  },
  {
    icon: Truck,
    title: "Giao Hàng Express",
    description: "Giao hàng trong 2h với hệ thống chuỗi lạnh hiện đại nhất",
    bgGradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
  },
  {
    icon: Award,
    title: "Giải Thưởng Quốc Tế",
    description: "Đạt 15+ giải thưởng uy tín về chất lượng và bền vững",
    bgGradient: "linear-gradient(135deg, #eab308, #f97316)",
  },
]

const stats = [
  { icon: Users, number: "50,000+", label: "Khách Hàng Tin Tưởng" },
  { icon: Globe, number: "25+", label: "Tỉnh Thành Phủ Sóng" },
  { icon: Leaf, number: "1,000+", label: "Hecta Nông Trường" },
  { icon: Star, number: "4.9/5", label: "Đánh Giá Khách Hàng" },
]

const productCategories = [
  {
    title: "Rau Củ Hữu Cơ Premium",
    description: "Rau củ tươi ngon được trồng theo tiêu chuẩn hữu cơ quốc tế, giàu vitamin và khoáng chất thiết yếu",
    image: a1,
    features: ["Không thuốc trừ sâu", "Giàu dinh dưỡng", "Tươi ngon tự nhiên"],
    bgGradient: "linear-gradient(135deg, #22c55e, #10b981)",
  },
  {
    title: "Trái Cây Nhiệt Đới",
    description: "Trái cây ngọt ngào, thơm ngon được thu hoạch đúng độ chín, bảo quản bằng công nghệ hiện đại",
    image: a2,
    features: ["Ngọt tự nhiên", "Giàu Vitamin C", "Không chất bảo quản"],
    bgGradient: "linear-gradient(135deg, #f97316, #ef4444)",
  },
  {
    title: "Gạo Hữu Cơ Cao Cấp",
    description: "Gạo thơm dẻo, hạt đều được trồng trên những cánh đồng màu mỡ nhất miền Bắc và Nam Bộ",
    image: a3,
    features: ["Hạt đều đẹp", "Thơm dẻo tự nhiên", "Không tẩy trắng"],
    bgGradient: "linear-gradient(135deg, #eab308, #f59e0b)",
  },
]

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const currentBannerData = banners[currentBanner]

  return (
    <div className="min-vh-100" style={{ marginBottom: 0, paddingBottom: 0 }}>
      <section className="position-relative overflow-hidden" style={{ minHeight: "800px", marginTop: "-25px" }}>
        <div
          className="position-absolute w-100 h-100"
          style={{
            background: `linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.05) 50%, rgba(13,148,136,0.05) 100%)`,
          }}
        />

        <div className="container py-5 position-relative" style={{ minHeight: "800px", zIndex: 10 }}>
          <div className="row align-items-center min-vh-75 py-5">
            {/* Left Content */}
            <div className="col-lg-6 pe-lg-5">
              <div className="mb-4">  
                <span
                  className="badge px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center border-0"
                  style={{
                    background: currentBannerData.bgGradient,
                    color: "white",
                  }}
                >
                  <Award size={16} className="me-2" />
                  {currentBannerData.badge}
                </span>
              </div>

              <div className="mb-4">
                <h1 className="display-3 fw-bold text-dark mb-3 lh-1">
                  {currentBannerData.title.split(" ").map((word, idx) => (
                    <span
                      key={idx}
                      className={idx === currentBannerData.title.split(" ").length - 1 ? "" : ""}
                      style={
                        idx === currentBannerData.title.split(" ").length - 1
                          ? {
                              background: currentBannerData.bgGradient,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }
                          : {}
                      }
                    >
                      {word}{" "}
                    </span>
                  ))}
                </h1>
                <p className="fs-4 text-muted fw-light mb-4">{currentBannerData.subtitle}</p>
              </div>

              <p className="fs-5 text-secondary mb-4 lh-base" style={{ maxWidth: "600px" }}>
                {currentBannerData.description}
              </p>

              <div className="d-flex flex-wrap gap-2 mb-4">
                {currentBannerData.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="badge bg-light text-dark px-3 py-2 d-flex align-items-center border"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                  >
                    <CheckCircle size={16} className="text-success me-2" />
                    {feature}
                  </span>
                ))}
              </div>

              <div className="d-flex flex-column flex-sm-row gap-3 pt-3">
                <button
                  className="btn btn-lg px-4 py-3 fw-semibold shadow-lg border-0 btn-hover"
                  style={{
                    background: currentBannerData.bgGradient,
                    color: "white",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Phone size={20} className="me-2" />
                  Đặt Hàng Ngay
                </button>
                <button
                  className="btn btn-outline-secondary btn-lg px-4 py-3 fw-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.8)" }}
                >
                  <Globe size={20} className="me-2" />
                  Tìm Hiểu Thêm
                </button>
              </div>
            </div>

            {/* Right Content - Image & Rating */}
            <div className="col-lg-6 position-relative">
              <div className="position-relative">
                {/* Main Image */}
                <div className="card border-0 shadow-lg overflow-hidden rounded-4 position-relative" style={{ minHeight: "500px" }}>
                  <img
                    src={currentBannerData.image || "/placeholder.svg"}
                    alt={currentBannerData.title}
                    style={{ height: "500px", objectFit: "cover", width: "100%", zIndex: 2, position: "relative" }}
                    className="rounded-4"
                  />
                  {/* Removed overlay gradient to prevent color from covering the image */}
                </div>

                {/* Rating Card */}
                <div
                  className="card position-absolute shadow-lg border-0 rounded-4"
                  style={{
                    bottom: "-30px",
                    left: "-30px",
                    width: "280px",
                    zIndex: 20,
                  }}
                >
                  <div className="card-body p-4">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <div
                          className="p-3 rounded-3 d-flex align-items-center justify-content-center"
                          style={{ background: currentBannerData.bgGradient }}
                        >
                          <Star size={24} color="white" />
                        </div>
                      </div>
                      <div className="col">
                        <div className="d-flex align-items-center mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < Math.floor(currentBannerData.rating)
                                  ? "text-warning"
                                  : i < currentBannerData.rating
                                    ? "text-warning opacity-50"
                                    : "text-muted"
                              }
                              fill={i < Math.floor(currentBannerData.rating) ? "currentColor" : "none"}
                            />
                          ))}
                          <span className="fs-5 fw-bold text-dark ms-2">{currentBannerData.rating}</span>
                        </div>
                        <small className="text-muted">
                          <span className="fw-semibold">{currentBannerData.reviews}</span> đánh giá
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badge */}
                <div
                  className="position-absolute bg-white rounded-circle p-3 shadow-lg d-flex align-items-center justify-content-center"
                  style={{
                    top: "-20px",
                    right: "-20px",
                    width: "80px",
                    height: "80px",
                    border: "4px solid #dcfce7",
                    zIndex: 20,
                  }}
                >
                  <Shield size={32} className="text-success" />
                  <span
                    className="badge bg-success position-absolute"
                    style={{
                      bottom: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "10px",
                    }}
                  >
                    Chứng nhận
                  </span>
                </div>

                {/* Customer Review */}
                <div
                  className="card position-absolute shadow-lg border-0 rounded-4"
                  style={{
                    bottom: "-30px",
                    right: "-30px",
                    width: "300px",
                    zIndex: 20,
                  }}
                >
                  <div className="card-body p-3">
                    <div className="row align-items-start">
                      <div className="col-auto">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "40px",
                            height: "40px",
                            background: "linear-gradient(135deg, #22c55e, #10b981)",
                          }}
                        >
                          <Users size={20} color="white" />
                        </div>
                      </div>
                      <div className="col">
                        <p className="fw-semibold mb-1 small">Khách hàng nói gì?</p>
                        <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
                          "Sản phẩm tuyệt vời, chất lượng vượt mong đợi!"
                        </p>
                        <div className="d-flex align-items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className="text-warning" fill="currentColor" />
                          ))}
                          <small className="text-muted ms-1">Verified</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div
          className="position-absolute d-flex align-items-center gap-4"
          style={{
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
          }}
        >
          <button
            className="btn btn-light rounded-circle p-3 shadow border-0"
            onClick={prevBanner}
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="d-flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className="border-0 rounded-pill"
                onClick={() => setCurrentBanner(index)}
                style={{
                  width: index === currentBanner ? "48px" : "12px",
                  height: "12px",
                  background:
                    index === currentBanner ? "linear-gradient(90deg, #10b981, #059669)" : "rgba(255,255,255,0.6)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          <button
            className="btn btn-light rounded-circle p-3 shadow border-0"
            onClick={nextBanner}
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className="progress position-absolute w-100"
          style={{
            bottom: 0,
            height: "4px",
            backgroundColor: "#e5e7eb",
            zIndex: 20,
          }}
        >
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{
              width: `${((currentBanner + 1) / banners.length) * 100}%`,
              background: currentBannerData.bgGradient,
            }}
            aria-valuenow={((currentBanner + 1) / banners.length) * 100}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5" style={{ background: "linear-gradient(90deg, #f9fafb, #f0fdf4)" }}>
        <div className="container">
          <div className="row">
            {stats.map((stat, index) => (
              <div key={index} className="col-md-3 text-center mb-4">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center shadow-sm stat-icon"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <stat.icon size={32} color="white" />
                </div>
                <h3 className="fw-bold text-dark mb-2">{stat.number}</h3>
                <p className="text-muted fw-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col">
              <span
                className="badge px-4 py-2 mb-4 fw-semibold border-0"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                }}
              >
                VỀ CHÚNG TÔI
              </span>
              <h2 className="display-4 fw-bold text-dark mb-4">
                Tiên Phong Trong Nông Nghiệp{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Bền Vững
                </span>
              </h2>
              <p className="fs-5 text-muted mx-auto" style={{ maxWidth: "800px" }}>
                VietFarm là đơn vị hàng đầu Việt Nam trong lĩnh vực sản xuất và phân phối nông sản hữu cơ cao cấp. Với
                hơn 15 năm kinh nghiệm và công nghệ hiện đại, chúng tôi cam kết mang đến những sản phẩm chất lượng quốc
                tế.
              </p>
            </div>
          </div>

          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="position-relative">
                <img
                    src={a1}
                    alt="Nông trại VietFarm hiện đại"
                    className="img-fluid rounded-4 shadow-lg"
                />
                <div
                  className="card position-absolute shadow-lg border-0 rounded-3"
                  style={{ bottom: "-30px", right: "-30px", zIndex: 10 }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                        <Award size={24} className="text-success" />
                      </div>
                      <div>
                        <p className="fw-bold mb-0">15+ Giải Thưởng</p>
                        <small className="text-muted">Chất lượng quốc tế</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <h3 className="display-6 fw-bold text-dark mb-4">
                Tại Sao Chọn{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  VietFarm?
                </span>
              </h3>

              <div className="d-flex flex-column gap-4">
                {[
                  {
                    icon: CheckCircle,
                    title: "Nguồn Gốc Minh Bạch 100%",
                    description:
                      "Blockchain truy xuất nguồn gốc từ hạt giống đến sản phẩm cuối cùng, đảm bảo tính minh bạch tuyệt đối.",
                  },
                  {
                    icon: Shield,
                    title: "Quy Trình ISO 22000",
                    description:
                      "Áp dụng tiêu chuẩn quản lý an toàn thực phẩm quốc tế với 247 điểm kiểm soát chất lượng.",
                  },
                  {
                    icon: Globe,
                    title: "Chứng Nhận Quốc Tế",
                    description: "Được chứng nhận bởi USDA Organic, JAS Organic, EU Organic và GlobalGAP.",
                  },
                ].map((item, index) => (
                  <div key={index} className="d-flex align-items-start">
                    <div
                      className="p-3 rounded-3 me-4 d-flex align-items-center justify-content-center shadow-sm feature-icon"
                      style={{
                        background: "linear-gradient(135deg, #22c55e, #10b981)",
                        minWidth: "60px",
                        height: "60px",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <item.icon size={24} color="white" />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-2">{item.title}</h5>
                      <p className="text-muted mb-0">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #f9fafb 0%, #f0fdf4 50%, #ecfdf5 100%)",
        }}
      >
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col">
              <span
                className="badge px-4 py-2 mb-4 fw-semibold border-0"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                }}
              >
                CAM KẾT CHẤT LƯỢNG
              </span>
              <h2 className="display-4 fw-bold text-dark mb-4">
                Tiêu Chuẩn{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Quốc Tế
                </span>
              </h2>
              <p className="fs-5 text-muted mx-auto" style={{ maxWidth: "800px" }}>
                Chúng tôi không ngừng đầu tư và nâng cao chất lượng để mang đến những sản phẩm nông nghiệp đạt tiêu
                chuẩn quốc tế cao nhất cho người tiêu dùng Việt Nam.
              </p>
            </div>
          </div>

          <div className="row">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-3 col-md-6 mb-4">
                <div className="card h-100 border-0 shadow-sm bg-white bg-opacity-80 feature-card">
                  <div className="card-body text-center p-4">
                    <div
                      className="rounded-4 mx-auto mb-4 d-flex align-items-center justify-content-center shadow feature-icon"
                      style={{
                        width: "80px",
                        height: "80px",
                        background: feature.bgGradient,
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <feature.icon size={40} color="white" />
                    </div>
                    <h4 className="fw-bold text-dark mb-3">{feature.title}</h4>
                    <p className="text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col">
              <span
                className="badge px-4 py-2 mb-4 fw-semibold border-0"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                }}
              >
                SẢN PHẨM PREMIUM
              </span>
              <h2 className="display-4 fw-bold text-dark mb-4">
                Bộ Sưu Tập{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Đặc Biệt
                </span>
              </h2>
              <p className="fs-5 text-muted mx-auto" style={{ maxWidth: "800px" }}>
                Khám phá bộ sưu tập đa dạng các sản phẩm nông nghiệp cao cấp được tuyển chọn kỹ lưỡng từ những nông trại
                hữu cơ tốt nhất Việt Nam.
              </p>
            </div>
          </div>

          <div className="row">
            {productCategories.map((product, index) => (
              <div key={index} className="col-lg-4 mb-4">
                <div className="card h-100 border-0 shadow-sm overflow-hidden product-card">
                  <div className="position-relative overflow-hidden" style={{ padding: "10px" }}>
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      style={{
                        height: "300px",
                        objectFit: "cover",
                        width: "100%",
                        transition: "transform 0.5s ease",
                      }}
                      className="product-image"
                    />
                    <span
                      className="badge bg-light text-dark position-absolute fw-semibold"
                      style={{ top: "15px", right: "15px", backgroundColor: "rgba(255,255,255,0.9)" }}
                    >
                      Premium
                    </span>
                  </div>
                  <div className="card-body p-4">
                    <h4 className="fw-bold text-dark mb-3 product-title">{product.title}</h4>
                    <p className="text-muted mb-4">{product.description}</p>

                    <div className="mb-4">
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="d-flex align-items-center mb-2">
                          <CheckCircle size={16} className="text-success me-2" />
                          <small className="text-muted">{feature}</small>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn w-100 fw-semibold py-2 border-0 btn-product"
                      style={{
                        background: product.bgGradient,
                        color: "white",
                        transition: "all 0.3s ease",
                      }}
                    >
                      Xem Chi Tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-5 text-white position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%)",
        }}
      >
        <div
          className="position-absolute w-100 h-100 opacity-10"
          style={{
            background: "url('/placeholder.svg?height=400&width=1200')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container position-relative">
          <div className="row text-center">
            <div className="col">
              <span
                className="badge px-4 py-2 mb-4 fw-semibold border-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              >
                ĐẶT HÀNG NGAY
              </span>
              <h2 className="display-4 fw-bold mb-4">
                Trải Nghiệm Nông Sản <span style={{ color: "#86efac" }}>Premium</span> Ngay Hôm Nay
              </h2>
              <p className="fs-5 mb-5 mx-auto opacity-90" style={{ maxWidth: "700px" }}>
                Liên hệ với chúng tôi để được tư vấn miễn phí và đặt hàng những sản phẩm nông nghiệp chất lượng cao
                nhất. Chúng tôi cam kết mang đến trải nghiệm mua sắm đẳng cấp quốc tế.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-5">
                <button className="btn btn-light btn-lg px-5 py-3 fw-semibold shadow-lg" style={{ color: "#059669" }}>
                  <Phone size={20} className="me-2" />
                  Hotline: 1900 1234
                </button>
                <button
                  className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <Mail size={20} className="me-2" />
                  Tư Vấn Online
                </button>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="card bg-transparent border-0 text-white">
                    <div className="card-body p-3 rounded-3" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <h5 className="fw-bold mb-0">Giao Hàng Miễn Phí</h5>
                      <p className="mb-0" style={{ color: "#86efac" }}>
                        Đơn hàng từ 500.000đ
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card bg-transparent border-0 text-white">
                    <div className="card-body p-3 rounded-3" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <h5 className="fw-bold mb-0">Đổi Trả 7 Ngày</h5>
                      <p className="mb-0" style={{ color: "#86efac" }}>
                        Không hài lòng hoàn tiền
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card bg-transparent border-0 text-white">
                    <div className="card-body p-3 rounded-3" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <h5 className="fw-bold mb-0">Hỗ Trợ 24/7</h5>
                      <p className="mb-0" style={{ color: "#86efac" }}>
                        Tư vấn chuyên nghiệp
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 