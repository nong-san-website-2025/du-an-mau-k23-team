import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone, Clock, MapPin } from "lucide-react";
import logo from "../assets/logo/imagelogo.png";

export default function Footer() {
  const linkClass =
    "d-inline-block text-decoration-none text-dark mb-2 position-relative transition-all footer-link";

  // TikTok SVG icon
  const TikTokIcon = (props) => (
    <svg
      viewBox="0 0 32 32"
      width={props.size || 20}
      height={props.size || 20}
      fill="currentColor"
      {...props}
    >
      <path d="M28.5 10.5c-2.2 0-4-1.8-4-4V3h-4.2v18.2c0 2.3-1.9 4.2-4.2 4.2s-4.2-1.9-4.2-4.2 1.9-4.2 4.2-4.2c.2 0 .4 0 .6.1v-4.3c-.2 0-.4-.1-.6-.1-4.7 0-8.5 3.8-8.5 8.5S11.3 30 16 30s8.5-3.8 8.5-8.5v-6.7c1.1.5 2.3.7 3.5.7v-5z" />
    </svg>
  );

  const socialLinks = [
    {
      icon: Facebook,
      url: "https://www.facebook.com/share/17DvWxB4Xp/?mibextid=wwXIfr",
      label: "Facebook",
    },
    {
      icon: Instagram,
      url: "https://www.instagram.com/greenfarm_65?igsh=MTFjb3JxaDJ6cXNxcw==",
      label: "Instagram",
    },
    {
      icon: TikTokIcon,
      url: "https://www.tiktok.com/@www.tiktok.com/@greenfarm78",
      label: "TikTok",
    },
  ];

  return (
    <footer
      className="bg-light border-top mt-5 pt-5 pb-0"
      style={{ fontSize: 15 }}
    >
      <div className="container px-4 px-md-5">
        {/* --- 4 CỘT CHÍNH --- */}
        <div className="row gy-4 text-start text-md-start mb-4">
          {/* Cột 1 - Dịch vụ khách hàng */}
          <div className="col-12 col-md-3 px-2">
            <h6
              className="fw-bold mb-3 text-uppercase text-dark"
              style={{ letterSpacing: 1 }}
            >
              Dịch vụ khách hàng
            </h6>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/buying-guide" className={linkClass}>
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link to="/selling-guide" className={linkClass}>
                  Hướng Dẫn Bán Hàng
                </Link>
              </li>
              <li>
                <Link to="/contact-support" className={linkClass}>
                  Liên hệ hỗ trợ
                </Link>
              </li>
              <li>
                <Link to="/help-center" className={linkClass}>
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className={linkClass}>
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link to="/warranty-policy" className={linkClass}>
                  Chính sách bảo hành
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 2 - GreenFarm */}
          <div className="col-12 col-md-3 px-2">
            <h6
              className="fw-bold mb-3 text-uppercase text-dark"
              style={{ letterSpacing: 1 }}
            >
              GreenFarm
            </h6>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/abouts" className={linkClass}>
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <Link to="/featured" className={linkClass}>
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3 - Liên hệ */}
          <div className="col-12 col-md-3 px-2">
            <h6
              className="fw-bold mb-3 text-uppercase text-dark"
              style={{ letterSpacing: 1 }}
            >
              Liên hệ
            </h6>
            <ul className="list-unstyled mb-3">
              <li className="d-flex align-items-center mb-2">
                <Phone className="me-2 text-success" size={18} />
                <a href="tel:0123456789" className={linkClass}>
                  0123 456 789
                </a>
              </li>
              <li className="d-flex align-items-center mb-2">
                <Mail className="me-2 text-success" size={18} />
                <a href="mailto:info@greenfarm.vn" className={linkClass}>
                  info@greenfarm.vn
                </a>
              </li>
              <li className="d-flex align-items-center mb-2">
                <Clock className="me-2 text-success" size={18} />
                <span>8:00 - 20:00 (T2 - CN)</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <MapPin className="me-2 text-success" size={18} />
                <span>Cần Thơ, Việt Nam</span>
              </li>
            </ul>
          </div>

          {/* Cột 4 - Theo dõi & Thanh toán/Vận chuyển */}
          <div className="col-12 col-md-3 px-2">
            <h6
              className="fw-bold mb-3 text-uppercase text-dark"
              style={{ letterSpacing: 1 }}
            >
              Theo dõi GFarm
            </h6>
            <div className="d-flex gap-3 mb-4">
              {socialLinks.map(({ icon: Icon, url, label }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-success bg-white border rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: 38, height: 38, transition: "all 0.3s" }}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>

            <div className="d-flex flex-wrap justify-content-start align-items-stretch gap-4">
              <div className="d-flex flex-column align-items-center">
                <span
                  className="fw-bold footer-title mb-2 text-dark"
                  style={{ fontSize: 15 }}
                >
                  Thanh toán
                </span>
                <img
                  src="/assets/images/vnpay.jpg"
                  alt="VNPAY"
                  width={50}
                  className="hover-scale mb-1"
                  style={{ background: "#fff", borderRadius: 8, padding: 4 }}
                />
                <span className="small text-muted">VNPAY</span>
              </div>

              <div className="pay-ship-separator"></div>

              <div className="d-flex flex-column align-items-center">
                <span
                  className="fw-bold footer-title mb-2 text-dark"
                  style={{ fontSize: 15 }}
                >
                  Đơn vị vận chuyển
                </span>
                <img
                  src="/assets/images/ghm.png"
                  alt="GHN"
                  width={50}
                  className="hover-scale mb-1"
                  style={{ background: "#fff", borderRadius: 8, padding: 4 }}
                />
                <span className="small text-muted">GHN</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Logo & mô tả --- */}
        <div className="d-flex justify-content-center justify-content-md-between align-items-center">
          <div className="row align-items-center mt-3 mb-4">
            <div className="col-12 col-md-6 text-md-start text-center">
              <div className="d-flex align-items-center justify-content-md-start justify-content-center gap-3">
                <img
                  src={logo}
                  alt="GreenFarm"
                  width={100}
                  className="rounded"
                />
                <p
                  className="text-muted mb-0"
                  style={{ lineHeight: 1.6, maxWidth: "100%" }}
                >
                  GreenFarm là nền tảng cung cấp nông sản sạch, an toàn và chất
                  lượng cao cho mọi gia đình Việt Nam. Hành trình xanh – vì sức
                  khỏe cộng đồng 🌱
                </p>
              </div>
            </div>
          </div>

          {/* --- Địa chỉ + Google Map --- */}
          <div className="text-center mt-4 mb-3">
            <div className="d-flex align-items-center justify-content-center mb-2 text-dark fw-semibold">
              <MapPin size={18} className="me-2 text-success" />
              Địa chỉ: Khu vực Thạnh Thắng, phường Phú Thứ, quận Cái Răng, TP.
              Cần Thơ
            </div>
            <div
              className="rounded overflow-hidden shadow-sm border mx-auto"
              style={{ width: "100%", height: 180 }}
            >
              <iframe
                title="GreenFarm - Cần Thơ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.283182759711!2d105.76583947454679!3d10.051042972694316!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0882d3a5c5b05%3A0x8c8d2b3c2ccaa5b2!2zMTYwIMSQxrDhu51uZyAzMC80LCBQaMaw4budbmcgSMO5bmcgTOG7n2ksIFF14buRYyBOaW5oIEvGsMahdSwgQ8OibiBUaMahLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1696891234567!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
            <div className="mt-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Khu+v%E1%BB%B1c+Th%E1%BA%A1nh+Th%E1%BA%AFng%2C+ph%C6%B0%E1%BB%9Dng+Ph%C3%BA+Th%E1%BB%A9%2C+qu%E1%BA%ADn+C%C3%A1i+R%C4%83ng%2C+TP.+C%E1%BA%A7n+Th%C6%A1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-sm mt-2"
              >
                Chỉ đường tới địa chỉ này trên Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* --- Bản quyền --- */}
        <div className="border-top mt-4 pt-3 text-center">
          <p
            className="mb-0 fw-semibold"
            style={{
              color: "#198754",
              fontSize: 16,
              letterSpacing: 0.3,
              textShadow: "0 0 4px rgba(0,0,0,0.1)",
            }}
          >
            © <span style={{ fontWeight: "700", color: "#0a6847" }}>2025</span>{" "}
            <span style={{ color: "#14532d" }}>GreenFarm.vn</span> – Nông sản
            sạch cho mọi nhà 🌿
          </p>
        </div>
      </div>

      {/* --- CSS --- */}
      <style>{`
        .footer-link::after {
          content: "";
          position: absolute;
          width: 0;
          height: 2px;
          background-color: #198754;
          bottom: 0;
          left: 0;
          transition: width 0.3s;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .footer-link:hover {
          color: #198754 !important;
        }
        .hover-scale:hover {
          transform: scale(1.1);
          transition: all 0.3s;
        }
        .pay-ship-separator {
          width: 2px;
          height: 40px;
          background: #222;
          border-radius: 1px;
          opacity: 0.7;
        }
      `}</style>
    </footer>
  );
}
