// src/features/cart/components/PaymentButton.jsx
import React from "react";
import { Button } from "antd";
import { toast } from "react-toastify";
import { CreditCardOutlined } from "@ant-design/icons";
import API from "../../login_register/services/api";

const PaymentButton = ({ amount, orderData, disabled = false }) => {
  const handlePayment = async () => {
    try {
      const res = await API.post("payments/vnpay/", {
        amount,
        order_data: orderData || {},
      });
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url; // Chuyển hướng đến VNPAY
      } else {
        toast.error("Không tạo được link thanh toán!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối đến server!");
    }
  };

  return (
    <Button
      type="primary"
      size="large"
      onClick={handlePayment}
      disabled={disabled}
      style={{
        backgroundColor: "#4caf50", // Màu xanh thương mại điện tử
        
        width: "100%",
        height: "48px",
        fontSize: "16px",
        fontWeight: "500",
        borderRadius: "8px",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      Thanh toán
    </Button>
  );
};

export default PaymentButton;
