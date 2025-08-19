import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { createOrder } from "../services/orderApi";
import { toast } from "react-toastify";
import "../styles/CartCheckout.css";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  const items = location.state?.items || [];

  const total = items.reduce(
    (sum, item) =>
      sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const handleOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin", {position: "bottom-right"});
      return;
    }

    if (items.length === 0) {
      toast.error("Chưa có sản phẩm nào để thanh toán", {position: "bottom-right"});
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        total_price: total,
        status: "completed",
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address: address.trim(),
        note: note.trim(),
        payment_method: payment,
        items: items.map((item) => ({
          product: item.product?.id,
          quantity: Number(item.quantity),
          price: Number(item.product?.price),
        })),
      };
      await createOrder(orderData);
      await clearCart();
      toast.success("Đặt hàng thành công!", {position: "bottom-right"});
      navigate("/orders?tab=completed");
    } catch (error) {
      toast.error("Đặt hàng thất bại!", {position: "bottom-right"});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-card">
      <h2>Thanh toán đơn hàng</h2>
      <div className="checkout-inputs">
        <input
          type="text"
          className="checkout-input"
          placeholder="Họ và tên người nhận"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <input
          type="tel"
          className="checkout-input"
          placeholder="Số điện thoại"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />
        <input
          type="text"
          className="checkout-input"
          placeholder="Địa chỉ nhận hàng"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          className="checkout-input"
          placeholder="Ghi chú cho shop (tùy chọn)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="checkout-payment">
        <label>Phương thức thanh toán:</label>
        <select value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option>Thanh toán khi nhận hàng</option>
          <option>Chuyển khoản ngân hàng</option>
          <option>Ví điện tử</option>
        </select>
      </div>
      <div className="checkout-items">
        <h4>Danh sách sản phẩm</h4>
        {items.map((item) => (
          <div key={item.id} className="checkout-item">
            <img
              src={`http://localhost:8000/media/${item.product?.image}`}
              alt={item.product?.name || "No Image"}
              className="checkout-item-img"
            />

            <div className="item-name">{item.product?.name}</div>
            <div className="item-price">
              {Number(item.product?.price).toLocaleString()}₫
            </div>
            <div className="item-quantity">x {item.quantity}</div>
            <div className="item-total">
              {(
                Number(item.product?.price) * Number(item.quantity)
              ).toLocaleString()}
              ₫
            </div>
          </div>
        ))}
      </div>
      <div className="checkout-total">
        Tổng thanh toán: <span>{total.toLocaleString()}₫</span>
      </div>
      <button
        className="checkout-btn"
        onClick={handleOrder}
        disabled={isLoading}
      >
        {isLoading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </div>
  );
};

export default CheckoutPage;
