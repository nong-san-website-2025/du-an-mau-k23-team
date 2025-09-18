import React from "react";
import API from "../../login_register/services/api";
import { toast } from "react-toastify";

// Nhận thêm orderData để backend tạo OrderItem khi callback
const PaymentButton = ({ amount, orderData, disabled = false }) => {
  const handlePayment = async () => {
    try {
      const res = await API.post("payments/vnpay/", {
        amount,
        order_data: orderData || {},
      });
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url; // chuyển hướng tới VNPAY
      } else {
        toast.error("Không tạo được link thanh toán!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối đến server!");
    }
  };

  return (
    <button 
      className="order-button" 
      onClick={handlePayment}
      disabled={disabled}
      style={{ 
        opacity: disabled ? 0.6 : 1, 
        cursor: disabled ? 'not-allowed' : 'pointer' 
      }}
    >
      Thanh toán qua VNPAY
    </button>
  );
};

export default PaymentButton;
