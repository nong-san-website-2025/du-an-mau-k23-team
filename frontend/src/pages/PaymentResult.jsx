// PaymentResult.jsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PaymentResult() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const responseCode = params.get("vnp_ResponseCode");
    if (responseCode === "00") {
      alert("Thanh toán thành công!");
    } else {
      alert("Thanh toán thất bại!");
    }
  }, [location]);

  return <div>Kết quả thanh toán đang được xử lý...</div>;
}
