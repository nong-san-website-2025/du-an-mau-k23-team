import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import API from "../../login_register/services/api";
import "../styles/CheckoutPage.css";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, selectAllItems, toggleItem } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("Thanh toán khi nhận hàng");
  const [isLoading, setIsLoading] = useState(false);

  const [showQR, setShowQR] = useState(false);
  const [qrScanned, setQrScanned] = useState(false); // Người dùng đã quét QR chưa
  const [voucher, setVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    selectAllItems();
  }, [selectAllItems]);

  // Danh sách mã giảm giá mẫu
  const voucherList = [
    { code: "SALE10", type: "percent", value: 10, desc: "Giảm 10% tổng đơn" },
    { code: "FREESHIP", type: "fixed", value: 20000, desc: "Giảm 20.000đ" },
    {
      code: "GREENFARM50",
      type: "fixed",
      value: 50000,
      desc: "Giảm 50.000đ cho đơn từ 500k",
      minOrder: 500000,
    },
  ];

  const total = cartItems
    .filter((item) => item.selected) // chỉ tính item đã tick
    .reduce(
      (sum, item) =>
        sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
      0
    );

  // Áp dụng mã giảm giá
  const handleApplyVoucher = () => {
    setVoucherError("");
    setDiscount(0);
    if (!voucher.trim()) return;
    const found = voucherList.find(
      (v) => v.code === voucher.trim().toUpperCase()
    );
    if (!found) {
      setVoucherError("Mã giảm giá không hợp lệ!");
      return;
    }
    if (found.minOrder && total < found.minOrder) {
      setVoucherError(
        `Đơn tối thiểu ${found.minOrder.toLocaleString()}đ mới dùng mã này!"`
      );
      return;
    }
    if (found.type === "percent") {
      setDiscount(Math.floor((total * found.value) / 100));
    } else if (found.type === "fixed") {
      setDiscount(found.value);
    }
    toast.success(`Áp dụng mã ${found.code} thành công!`);
  };

  const totalAfterDiscount = Math.max(total - discount, 0);

  // Khi nhấn Xác nhận đặt hàng
  const handleOrder = () => {
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống");
      return;
    }

    if (payment === "Ví điện tử") {
      // Hiện QR code
      setShowQR(true);
      setQrScanned(false);
      return;
    }

    // COD hoặc chuyển khoản
    completeOrder();
  };

  // Khi người dùng nhấn “quét QR”
  const handleQrScan = () => {
    setQrScanned(true);
  };

  // Khi người dùng nhấn Xác nhận thanh toán sau khi quét QR
  const handleQRConfirm = async () => {
    await completeOrder();
  };

  const completeOrder = async () => {
    setIsLoading(true);
    try {
      // Gửi đơn hàng thật tới backend
      const orderData = {
        total_price: total,
        status: "pending", // chờ xác nhận
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address: address.trim(),
        note: note.trim(),
        payment_method: payment,
        items: cartItems.map((item) => ({
          product: item.product?.id || item.product, // gửi ID sản phẩm
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.product?.price) || 0,
        })),
      };

      const res = await API.post("orders/", orderData);

      await clearCart();
      toast.success("Đặt hàng thành công!");
      // Điều hướng sang trang đơn hàng - tab chờ xác nhận
      navigate("/orders?tab=pending");
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.error || "Đặt hàng thất bại! Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setShowQR(false);
      setQrScanned(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Thanh toán đơn hàng</h2>

      <input
        type="text"
        placeholder="Họ và tên"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />
      <input
        type="tel"
        placeholder="Số điện thoại"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
      />
      <input
        type="text"
        placeholder="Địa chỉ nhận hàng"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <input
        type="text"
        placeholder="Ghi chú (tùy chọn)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Voucher section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <input
          type="text"
          placeholder="Nhập mã giảm giá/vocher"
          value={voucher}
          onChange={(e) => setVoucher(e.target.value)}
          style={{
            flex: 1,
            padding: 6,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleApplyVoucher}
          style={{
            padding: "7px 16px",
            borderRadius: 4,
            background: "#f39c12",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Áp dụng
        </button>
      </div>
      {voucherError && (
        <div style={{ color: "red", marginBottom: 8 }}>{voucherError}</div>
      )}
      {discount > 0 && (
        <div style={{ color: "#27ae60", marginBottom: 8 }}>
          Đã giảm: -{discount.toLocaleString()}đ
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <strong>Tổng thanh toán:</strong> {totalAfterDiscount.toLocaleString()}đ
      </div>

      {/* QR code Section */}
      {showQR && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p>
            Quét QR để thanh toán số tiền:{" "}
            <strong>{totalAfterDiscount.toLocaleString()}đ</strong>
          </p>
          <QRCodeSVG
            value={`mock_payment_amount:${totalAfterDiscount}`}
            size={180}
          />
          {!qrScanned ? (
            <button
              onClick={handleQrScan}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#3498db",
                color: "#fff",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              Tôi đã quét QR
            </button>
          ) : (
            <button
              onClick={handleQRConfirm}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#27ae60",
                color: "#fff",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              Xác nhận thanh toán
            </button>
          )}
        </div>
      )}

      {/* Nút xác nhận cho COD/Chuyển khoản */}
      {!showQR && (
        <button
          style={{
            width: "100%",
            padding: 12,
            background: isLoading ? "#95a5a6" : "#27ae60",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: 8,
            fontSize: 18,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
          onClick={handleOrder}
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
        </button>
      )}
    </div>
  );
};

export default CheckoutPage;
