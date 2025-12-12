import React from "react";
import { Phone, Mail } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaInstagramSquare,
  FaInstalod,
  FaPhone,
  FaTiktok,
} from "react-icons/fa";
import { PiInstagramLogoFill } from "react-icons/pi";
import { IoIosHelpCircle } from "react-icons/io";

export default function TopBar() {
  return (
    <div className="text-white small ">
      <div
        className="container d-flex justify-content-between align-items-center px-4"
        style={{ minHeight: "30px" }}
      >
        {/* Left: Hotline */}
        <div
          className="d-flex align-items-center"
          style={{ whiteSpace: "nowrap", fontSize: 13, fontWeight: 400 }}
        >
          <span>
            Tải ứng dụng | <FaFacebook /> <FaTiktok /> 
          </span>
        </div>

        {/* Right: Email */}
        <div
          className="d-flex align-items-center d-none d-md-flex"
          style={{ whiteSpace: "nowrap", fontSize: 16 }}
        >
          <span className="p-1 fw-light" style={{fontSize: "15px", paddingTop: 5}}>
            <FaPhone size="12" /> Liên hệ
          </span>
           <span className="p-1 fw-light" style={{fontSize: "15px"}}>
            <IoIosHelpCircle size="18" /> Hỗ trợ
          </span>
        </div>
      </div>
    </div>
  );
}
