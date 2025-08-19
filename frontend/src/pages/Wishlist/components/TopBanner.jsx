import React from "react";
import { Link } from "react-router-dom";

const TopBanner = () => (
  <div
    style={{
      width: "100%",
      background: "#f1f8e9",
      color: "#388e3c",
      fontSize: 14,
      overflow: "hidden",
      borderBottom: "1px solid #e0e0e0",
      fontWeight: 500,
      letterSpacing: 0.2,
      zIndex: 100,
      position: "relative",
      height: 32,
      display: "flex",
      alignItems: "center"
    }}
  >
    <div style={{
      display: "inline-block",
      whiteSpace: "nowrap",
      animation: "marquee 22s linear infinite"
    }}>
      <span style={{ marginRight: 40 }}>
        Giới thiệu: Sự Chỉnh Sửa Mùa Thu{' '}
        <Link to="/Hàng mới về" style={{ color: "#1976d2", textDecoration: "none", fontWeight: 600, marginLeft: 4 }}>
          Cửa Hàng mới về &rarr;
        </Link>
      </span>
      <span style={{ marginRight: 40 }}>
        Giảm giá lên đến 50% cho sản phẩm ngoài trời{' '}
        <Link to="/bán hàng ngoài trời" style={{ color: "#d84315", textDecoration: "none", fontWeight: 600, marginLeft: 4 }}>
          MUA NGAY &rarr;
        </Link>
      </span>
      <span style={{ marginRight: 40 }}>
        Giảm giá lên đến 50%{' '}
        <Link to="/Khuyến Mãi Tất Cả" style={{ color: "#c62828", textDecoration: "none", fontWeight: 600, marginLeft: 4 }}>
          MUA TẤT CẢ KHUYẾN MÃI &rarr;
        </Link>
      </span>
    </div>
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
    `}</style>
  </div>
);

export default TopBanner;