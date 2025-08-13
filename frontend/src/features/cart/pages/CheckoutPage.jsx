
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../services/CartContext';
import { createOrder } from '../services/orderApi';
import { toast } from 'react-toastify';
import { useAuth } from '../../login_register/services/AuthContext';


const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState('Thanh toán khi nhận hàng');
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra authentication khi component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/login');
      return;
    }
  }, [navigate, isAuthenticated]);



  const total = cartItems.reduce((sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0), 0);

  const handleOrder = async () => {
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/login');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống');
      return;
    }

    setIsLoading(true);
    try {
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        total_price: total,
        status: 'completed', // Đặt trạng thái là "đã thanh toán" khi xác nhận đơn hàng
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address: address.trim(),
        note: note.trim(),
        payment_method: payment,
        items: cartItems.map(item => {
          console.log('Processing cart item:', item);
          return {
            product: item.product?.id || item.product,
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.product?.price) || 0,
          };
        }),
      };

      // Debug logging
      console.log('Cart items:', cartItems);
      console.log('Cart items structure:', cartItems.map(item => ({
        id: item.id,
        product: item.product,
        product_id: item.product?.id,
        quantity: item.quantity,
        price: item.product?.price
      })));
      console.log('Order data:', orderData);
      
      // Tạo đơn hàng
      const newOrder = await createOrder(orderData);
      
      // Xóa giỏ hàng sau khi đặt hàng thành công
      await clearCart();
      
      // Thông báo thành công
      toast.success('Đặt hàng thành công! Đơn hàng đã được chuyển vào danh sách "Đã thanh toán"');
      
      // Chuyển hướng đến trang orders với tab completed
      navigate('/orders?tab=completed');
    } catch (error) {
      console.error('Order creation failed:', error);
      if (error.response?.data) {
        // Hiển thị lỗi chi tiết từ server nếu có
        const errorMessage = error.response.data.message || error.response.data.detail || 'Đặt hàng thất bại! Vui lòng thử lại.';
        toast.error(errorMessage);
      } else {
        toast.error('Đặt hàng thất bại! Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 12 }}>
      <h2>Thanh toán đơn hàng</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Họ và tên người nhận"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="tel"
          placeholder="Số điện thoại"
          value={customerPhone}
          onChange={e => setCustomerPhone(e.target.value)}
          style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Địa chỉ nhận hàng"
          value={address}
          onChange={e => setAddress(e.target.value)}
          style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Ghi chú cho shop (tuỳ chọn)"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Phương thức thanh toán:</strong>
        <select value={payment} onChange={e => setPayment(e.target.value)} style={{ marginLeft: 8 }}>
          <option>Thanh toán khi nhận hàng</option>
          <option>Chuyển khoản ngân hàng</option>
          <option>Ví điện tử</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Danh sách sản phẩm:</strong>
        {cartItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <img src={item.product?.image} alt={item.product?.name} style={{ width: 48, height: 48, borderRadius: 6, marginRight: 12 }} />
            <div style={{ flex: 2 }}>{item.product?.name}</div>
            <div style={{ minWidth: 80 }}>{Number(item.product?.price).toLocaleString()}đ</div>
            <div style={{ minWidth: 60 }}>x {item.quantity}</div>
            <div style={{ minWidth: 100, fontWeight: 'bold', color: '#27ae60', textAlign: 'right' }}>{(Number(item.product?.price) * Number(item.quantity)).toLocaleString()}đ</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>
        Tổng thanh toán: <span style={{ color: '#e67e22' }}>{total.toLocaleString()}đ</span>
      </div>
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
    </div>
  );
};

export default CheckoutPage;
