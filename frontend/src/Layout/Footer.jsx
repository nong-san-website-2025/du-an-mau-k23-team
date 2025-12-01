import React, { useState } from "react";
import { Facebook, Instagram, Mail, Phone, Clock, MapPin, Send } from "lucide-react";
import logo from "../assets/logo/whitelogo1.png";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 3000);
    }
  };

  const linkClass = "footer-link";

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
      color: "#1877f2",
    },
    {
      icon: TikTokIcon,
      url: "https://www.tiktok.com/@greenfarmorganicvn",
      label: "TikTok",
      color: "#000000",
    },
  ];

  return (
    <footer style={{ backgroundColor: "#1a1a1a", color: "#fff", marginTop: "3rem" }}>

      {/* Main Footer Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1rem" }}>
        {/* Logo & Description */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid #333" }}>
          <div style={{ flex: "1", minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <img
                src={logo}
                alt="GreenFarm"
                style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover" }}
              />
              <div>
                <h4 style={{ fontWeight: "700", color: "#198754", marginBottom: "0.5rem", fontSize: "1.5rem" }}>GreenFarm</h4>
                <p style={{ color: "#aaa", margin: 0, lineHeight: "1.7", fontSize: "0.95rem" }}>
                  Nền tảng cung cấp nông sản sạch, an toàn và chất lượng cao
                  cho mọi gia đình Việt Nam. Hành trình xanh – vì sức khỏe cộng
                  đồng 🌱
                </p>
              </div>
            </div>
          </div>

          <div style={{ flex: "1", minWidth: "300px" }}>
            {/* Social Links */}
            <h6 style={{ fontWeight: "600", marginBottom: "1rem", color: "#198754", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              Kết nối với chúng tôi
            </h6>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              {socialLinks.map(({ icon: Icon, url, label, color }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="social-icon"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>

            {/* Payment & Shipping */}
            <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  Thanh toán
                </span>
                <div style={{
                  width: "50px",
                  height: "32px",
                  background: "#fff",
                  borderRadius: "6px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  color: "#0066cc"
                }}>
                  VNPAY
                </div>
              </div>

              <div style={{ width: "2px", height: "50px", background: "#444" }}></div>

              <div>
                <span style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  Vận chuyển
                </span>
                <div style={{
                  width: "50px",
                  height: "32px",
                  background: "#fff",
                  borderRadius: "6px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  color: "#ff5722"
                }}>
                  GHN
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Column Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
          {/* Column 1 - Customer Service */}
          <div>
            <h6 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Dịch vụ khách hàng
            </h6>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem" }}>
              <li style={{ marginBottom: "0.5rem" }}><a href="/buying-guide" className={linkClass}>Hướng dẫn mua hàng</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/selling-guide" className={linkClass}>Hướng dẫn bán hàng</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/contactsupport" className={linkClass}>Liên hệ hỗ trợ</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/returnpolicy" className={linkClass}>Chính sách đổi trả</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/warrantypolicy" className={linkClass}>Chính sách bảo hành</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/RturnmoNey" className={linkClass}>Trả hàng/Hoàn tiền</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/GreenFarmwallet" className={linkClass}>Ví GreenFarm</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/faq" className={linkClass}>Câu hỏi thường gặp</a></li>
            </ul>
          </div>

          {/* Column 2 - About GreenFarm */}
          <div>
            <h6 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Về GreenFarm
            </h6>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem" }}>
              <li style={{ marginBottom: "0.5rem" }}><a href="/abouts" className={linkClass}>Về chúng tôi</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/recruitment" className={linkClass}>Tuyển dụng</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/primarysecurity" className={linkClass}>Chính sách bảo mật</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/terms-of-service" className={linkClass}>Điều khoản dịch vụ</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/featured" className={linkClass}>Sản phẩm</a></li>
              <li style={{ marginBottom: "0.5rem" }}><a href="/blog" className={linkClass}>Blog</a></li>
            </ul>
          </div>

          {/* Column 3 - Contact Info */}
          <div>
            <h6 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Liên hệ
            </h6>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem" }}>
              <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <Phone className="me-2" size={16} style={{ color: "#198754", marginTop: "3px", flexShrink: 0 }} />
                <a href="tel:0328002213" className={linkClass}>0328002213</a>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <Mail className="me-2" size={16} style={{ color: "#198754", marginTop: "3px", flexShrink: 0 }} />
                <a href="mailto:greenfarmorganicvietnam@gmail.com" className={linkClass} style={{ wordBreak: "break-word" }}>
                  greenfarmorganicvietnam@gmail.com
                </a>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <Clock className="me-2" size={16} style={{ color: "#198754", marginTop: "3px", flexShrink: 0 }} />
                <span style={{ color: "#aaa" }}>8:00 - 20:00 (T2 - CN)</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start" }}>
                <MapPin className="me-2" size={16} style={{ color: "#198754", marginTop: "3px", flexShrink: 0 }} />
                <span style={{ color: "#aaa" }}>Cần Thơ, Việt Nam</span>
              </li>
            </ul>
          </div>

          {/* Column 4 - Map */}
          <div>
            <h6 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Địa chỉ
            </h6>
            <p style={{ color: "#aaa", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
              Khu vực Thạnh Thắng, phường Phú Thứ, quận Cái Răng, TP. Cần Thơ
            </p>
            <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #333", marginBottom: "0.75rem" }}>
              <iframe
                title="GreenFarm - Cần Thơ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.283182759711!2d105.76583947454679!3d10.051042972694316!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0882d3a5c5b05%3A0x8c8d2b3c2ccaa5b2!2zMTYwIMSQxrDhu51uZyAzMC80LCBQaMaw4budbmcgSMO5bmcgTOG7j2ksIFF14buRYyBOaW5oIEvGsMahdSwgQ8OibiBUaMahLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1696891234567!5m2!1svi!2s"
                width="100%"
                height="180"
                style={{ border: 0, display: "block" }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Khu+v%E1%BB%B1c+Th%E1%BA%A1nh+Th%E1%BA%AFng%2C+ph%C6%B0%E1%BB%9Dng+Ph%C3%BA+Th%E1%BB%A9%2C+qu%E1%BA%ADn+C%C3%A1i+R%C4%83ng%2C+TP.+C%E1%BA%A7n+Th%C6%A1"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "0.5rem",
                backgroundColor: "transparent",
                border: "1px solid #198754",
                color: "#198754",
                borderRadius: "6px",
                textAlign: "center",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: "500",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#198754";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#198754";
              }}
            >
              Chỉ đường
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "1rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <p style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>
              © 2025 <span style={{ color: "#198754", fontWeight: "600" }}>GreenFarm.vn</span> – Nông sản sạch cho mọi nhà 🌿
            </p>
            <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>
              Thiết kế bởi GreenFarm Team với 💚
            </p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .footer-link {
          color: #aaa;
          text-decoration: none;
          display: inline-block;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .footer-link::after {
          content: "";
          position: absolute;
          width: 0;
          height: 2px;
          background-color: #198754;
          bottom: -2px;
          left: 0;
          transition: width 0.3s ease;
        }
        
        .footer-link:hover {
          color: #198754 !important;
          transform: translateX(3px);
        }
        
        .footer-link:hover::after {
          width: 100%;
        }

        .social-icon:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        @media (max-width: 768px) {
          footer > div:first-child > div:first-child {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}