import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook, Instagram, Twitter, Youtube, Mail, Phone, Clock, MapPin
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-top mt-5 pt-5 pb-3">
      <div className="container">
        <div className="row gy-4">
          {/* Logo & mô tả */}
          <div className="col-md-4">
            <div className="d-flex align-items-center mb-2">
              <div
                className="d-flex align-items-center justify-content-center rounded text-white fw-bold fs-4 me-2"
                style={{ width: 40, height: 40, backgroundColor: "#16a34a" }}
              >N</div>
              <div>
                <div className="fw-bold fs-5" style={{ color: "#16a34a" }}>NôngSản.vn</div>
                <div className="text-muted small">Fresh &amp; Organic</div>
              </div>
            </div>
            <div className="text-muted mb-3" style={{fontSize: 15}}>
              Nền tảng thương mại điện tử hàng đầu chuyên cung cấp nông sản tươi sống, an toàn và chất lượng cao trực tiếp từ nông dân đến người tiêu dùng.
            </div>
            <div className="d-flex gap-2">
              <a href="#" className="btn btn-outline-secondary rounded-circle p-2" aria-label="Facebook"><Facebook size={20} /></a>
            </div>
          </div>
          {/* Liên kết nhanh */}
          <div className="col-md-2">
            <div className="fw-bold mb-2">Liên kết nhanh</div>
            <ul className="list-unstyled mb-0">
              <li><Link to="/about" className="text-decoration-none text-dark">Về chúng tôi</Link></li>
              <li><Link to="/featured" className="text-decoration-none text-dark">Sản phẩm</Link></li>
              <li><Link to="/promotions" className="text-decoration-none text-dark">Khuyến mãi</Link></li>
              <li><Link to="/contact" className="text-decoration-none text-dark">Liên hệ</Link></li>
              <li><a href="#" className="text-decoration-none text-dark">Blog</a></li>
            </ul>
          </div>
          {/* Hỗ trợ khách hàng */}
          <div className="col-md-3">
            <div className="fw-bold mb-2">Hỗ trợ khách hàng</div>
            <ul className="list-unstyled mb-0 text-dark">
              <li className="mb-1"><Phone size={16} className="me-2" style={{color: "#16a34a"}} /> <b>Hotline</b> <br />1900-1234</li>
              <li className="mb-1"><Mail size={16} className="me-2" style={{color: "#16a34a"}} /> <b>Email</b> <br />support@nongsan.vn</li>
              <li className="mb-1"><Clock size={16} className="me-2" style={{color: "#16a34a"}} /> <b>Giờ làm việc</b> <br />8:00 - 22:00 hằng ngày</li>
              <li><MapPin size={16} className="me-2" style={{color: "#16a34a"}} /> <b>Địa chỉ</b> <br />123 Đường ABC, Q.1, TP.HCM</li>
            </ul>
          </div>
          {/* Đăng ký nhận tin */}
          <div className="col-md-3">
            <div className="fw-bold mb-2">Đăng ký nhận tin</div>
            <div className="text-muted mb-2" style={{fontSize: 15}}>
              Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt
            </div>
            <form>
              <div className="input-group mb-2">
                <input type="email" className="form-control" placeholder="Nhập email của bạn" />
              </div>
              <button type="submit" className="btn btn-dark w-100">Đăng ký</button>
            </form>
          </div>
        </div>
        <hr className="my-4" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-muted">
          <div>
            © 2024 NôngSản.vn
          </div>
          <div className="mt-2 mt-md-0">
          </div>
        </div>
      </div>
    </footer>
  );
}
