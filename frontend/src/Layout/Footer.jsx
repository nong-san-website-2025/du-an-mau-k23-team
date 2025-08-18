import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook, Instagram, Twitter, Youtube, Mail, Phone, Clock, MapPin
} from "lucide-react";
import logo from "../assets/logo/imagelogo.png"; // Adjust the path as necessary
export default function Footer() {
  return (
    <footer className="bg-white border-top mt-5 pt-5 pb-3">
      <div className="container-fluid px-5">
        <div className="row gy-4">
          {/* Logo & mô tả */}
          <div className="col-md-5">
            <div className="d-flex align-items-center mb-2">
              <img
                src={logo}
                alt="Logo Nông Sản"
                style={{ width: 40, height: 40 }}
                className="me-2 rounded"
              />
              <div>
                <div className="fw-bold fs-5" style={{ color: "#16a34a" }}>NôngSản.vn</div>
                <div className="text-muted small">Fresh &amp; Organic</div>
              </div>
            </div>
            <div className="text-muted mb-3" style={{ fontSize: 15, textAlign: "justify" }}>
              Nền tảng thương mại điện tử hàng đầu chuyên cung cấp nông sản tươi sống, an toàn và chất lượng cao trực tiếp từ nông dân đến người tiêu dùng.
            </div>
            <div className="d-flex gap-2">
              <a href="#" className="btn btn-outline-secondary rounded-circle p-2" aria-label="Facebook"><Facebook size={20} /></a>
              <a href="#" className="btn btn-outline-secondary rounded-circle p-2" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" className="btn btn-outline-secondary rounded-circle p-2" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" className="btn btn-outline-secondary rounded-circle p-2" aria-label="Youtube"><Youtube size={20} /></a>
            </div>
          </div>

          {/* Liên kết nhanh */}
          <div className="col-md-3">
            <div className="fw-bold mb-3">Liên kết nhanh</div>
            <ul className="list-unstyled mb-0">
              <li><Link to="/abouts" className="text-decoration-none text-dark">Về chúng tôi</Link></li>
              <li><Link to="/featured" className="text-decoration-none text-dark">Sản phẩm</Link></li>
              <li><a href="/blog" className="text-decoration-none text-dark">Blog</a></li>
            </ul>
          </div>

          {/* Hỗ trợ khách hàng */}
          <div className="col-md-4">
            <div className="fw-bold mb-3">Hỗ trợ khách hàng</div>
            <ul className="list-unstyled mb-0 text-dark">
              <li className="mb-2"><Phone size={16} className="me-2" style={{ color: "#16a34a" }} /> <b>Hotline</b><br />1900-1234</li>
              <li className="mb-2"><Mail size={16} className="me-2" style={{ color: "#16a34a" }} /> <b>Email</b><br />support@nongsan.vn</li>
              <li className="mb-2"><Clock size={16} className="me-2" style={{ color: "#16a34a" }} /> <b>Giờ làm việc</b><br />8:00 - 22:00 hằng ngày</li>
              <li><MapPin size={16} className="me-2" style={{ color: "#16a34a" }} /> <b>Địa chỉ</b><br />123 Đường ABC, Q.1, TP.HCM</li>
            </ul>
          </div>
        </div>

        <hr className="my-4" />

        {/* Dòng cuối */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-muted">
          <div className="text-center text-md-start">
            © 2024 NôngSản.vn. Tất cả quyền được bảo lưu.
            <span className="mx-2">|</span>
            <a href="#" className="text-muted text-decoration-none">Chính sách bảo mật</a>
            <span className="mx-2">|</span>
            <a href="#" className="text-muted text-decoration-none">Điều khoản sử dụng</a>
            <span className="mx-2">|</span>
            <a href="#" className="text-muted text-decoration-none">Chính sách vận chuyển</a>
          </div>
          <div className="mt-2 mt-md-0 text-center text-md-end">
            Phương thức thanh toán:
            <span className="badge bg-primary ms-2">VISA</span>
            <span className="badge bg-danger ms-1">MC</span>
            <span className="badge ms-1" style={{ backgroundColor: "#ff69b4" }}>MM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
