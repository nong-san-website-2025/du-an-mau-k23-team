import React from "react";
import { Phone, Mail } from "lucide-react";

export default function TopBar() {
  const greenStyle = { backgroundColor: "#22C55E" };

  return (
    <div style={greenStyle} className="text-white small py-0">
      <div
        className="container d-flex justify-content-between align-items-center px-2"
        style={{ minHeight: "36px" }}
      >
        {/* Left: Hotline */}
        <div
          className="d-flex align-items-center"
          style={{ whiteSpace: "nowrap", fontSize: 16, fontWeight: 600 }}
        >
          <Phone size={16} className="me-1" />
          <span>
            Hotline: <b style={{ letterSpacing: 1 }}>0328002213</b>
          </span>
        </div>

        {/* Right: Email */}
        <div
          className="d-flex align-items-center d-none d-md-flex"
          style={{ whiteSpace: "nowrap", fontSize: 16, fontWeight: 600 }}
        >
          <Mail size={16} className="me-1" />
          <span>
            Email: <b style={{ letterSpacing: 1 }}>greenfarmorganicvietnam@gmail.com</b>
          </span>
        </div>
      </div>
    </div>
  );
}