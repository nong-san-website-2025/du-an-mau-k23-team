import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../services/CartContext';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import API from '../../login_register/services/api';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState('Thanh toán khi nhận hàng');
  const [isLoading, setIsLoading] = useState(false);

  const [showQR, setShowQR] = useState(false);
  const [qrScanned, setQrScanned] = useState(false); // Người dùng đã quét QR chưa

  const total = cartItems.reduce((sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0), 0);

  // Khi nhấn Xác nhận đặt hàng
  const handleOrder = () => {
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống');
      return;
    }

    if (payment === 'Ví điện tử') {
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
        status: 'pending', // chờ xác nhận
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address: address.trim(),
        note: note.trim(),
        payment_method: payment,
        items: cartItems.map(item => ({
          product: item.product?.id || item.product, // gửi ID sản phẩm
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.product?.price) || 0,
        })),
      };

      const res = await API.post('orders/', orderData);

      await clearCart();
      toast.success('Đặt hàng thành công!');
      // Điều hướng sang trang đơn hàng - tab chờ xác nhận
      navigate('/orders?tab=pending');
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.error || 'Đặt hàng thất bại! Vui lòng thử lại.';
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

      <input type="text" placeholder="Họ và tên" value={customerName} onChange={e => setCustomerName(e.target.value)} />
      <input type="tel" placeholder="Số điện thoại" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
      <input type="text" placeholder="Địa chỉ nhận hàng" value={address} onChange={e => setAddress(e.target.value)} />
      <input type="text" placeholder="Ghi chú (tùy chọn)" value={note} onChange={e => setNote(e.target.value)} />

      <div style={{ marginBottom: 16 }}>
        <strong>Phương thức thanh toán:</strong>
        <select
          value={payment}
          onChange={e => { setPayment(e.target.value); setShowQR(false); setQrScanned(false); }}
          style={{ marginLeft: 8 }}
        >
          <option>Thanh toán khi nhận hàng</option>
          <option>Chuyển khoản ngân hàng</option>
          <option>Ví điện tử</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Tổng thanh toán:</strong> {total.toLocaleString()}đ
      </div>

      {/* QR code Section */}
      {showQR && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p>Quét QR để thanh toán số tiền: <strong>{total.toLocaleString()}đ</strong></p>
          <QRCodeSVG value={`mock_payment_amount:${total}`} size={180} />
          {!qrScanned ? (
            <button
              onClick={handleQrScan}
              style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: '#3498db', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Tôi đã quét QR
            </button>
          ) : (
            <button
              onClick={handleQRConfirm}
              style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: '#27ae60', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
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
            width: '100%',
            padding: 12,
            background: isLoading ? '#95a5a6' : '#27ae60',
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: 8,
            fontSize: 18,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
          onClick={handleOrder}
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
        </button>
      )}
    </div>
  );
};

export default CheckoutPage;
