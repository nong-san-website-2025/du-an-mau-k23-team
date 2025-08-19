
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../services/CartContext';
import { createOrder } from '../services/orderApi';
import { toast } from 'react-toastify';
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
  
  // States for user profile and addresses
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [autoFillStatus, setAutoFillStatus] = useState('');

  // Kiểm tra authentication và load thông tin user khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/login');
      return;
    }
    
    // Load user profile and addresses
    loadUserData();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      setLoadingProfile(true);
      
      // Load user profile
      const profileRes = await API.get('users/me/');
      setUserProfile(profileRes.data);
      
      // Load user addresses
      const addressRes = await API.get('users/addresses/');
      setAddresses(addressRes.data);
      
      // Auto-fill with default address if available
      const defaultAddress = addressRes.data.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setCustomerName(defaultAddress.recipient_name);
        setCustomerPhone(defaultAddress.phone);
        setAddress(defaultAddress.location);
        setAutoFillStatus('Đã tự động điền thông tin từ địa chỉ mặc định');
        setTimeout(() => setAutoFillStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Không thể tải thông tin người dùng');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle address selection
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    if (addressId === '') {
      // Manual input
      setCustomerName('');
      setCustomerPhone('');
      setAddress('');
    } else {
      const selectedAddr = addresses.find(addr => addr.id === parseInt(addressId));
      if (selectedAddr) {
        setCustomerName(selectedAddr.recipient_name);
        setCustomerPhone(selectedAddr.phone);
        setAddress(selectedAddr.location);
      }
    }
  };





  const total = cartItems.reduce((sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0), 0);

  const handleOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
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

  if (loadingProfile) {
    return (
      <div className="checkout-container">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="loading-text">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Thanh toán đơn hàng</h2>
      
      {/* Auto-fill Status Notification */}
      {autoFillStatus && (
        <div style={{
          marginBottom: 20,
          padding: 12,
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
          border: '1px solid #28a745',
          borderRadius: 8,
          color: '#155724',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'slideIn 0.3s ease'
        }}>
          <span>✅</span>
          <span style={{ fontWeight: 500 }}>{autoFillStatus}</span>
        </div>
      )}
      
      {/* Address Selection Section */}
      <div className="delivery-info-section">
        <h5 className="delivery-info-title">Thông tin giao hàng</h5>
        
        {/* Address Selection Dropdown */}
        {addresses.length > 0 ? (
          <div className="address-selection-container">
            <label className="address-selection-label">
              Chọn địa chỉ giao hàng:
            </label>
            <select
              value={selectedAddressId}
              onChange={(e) => handleAddressSelect(e.target.value)}
              className="address-select"
            >
              <option value="">✏️ Nhập thủ công</option>
              {addresses.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {addr.recipient_name} - {addr.phone} - {addr.location}
                  {addr.is_default ? ' (Mặc định)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="no-address-warning">
            <p>
              Bạn chưa có địa chỉ giao hàng nào. 
              <button
                type="button"
                onClick={() => navigate('/profile?tab=address')}
                className="no-address-link"
              >
                Thêm địa chỉ ngay
              </button>
            </p>
          </div>
        )}


      </div>

      {/* Customer Information Form */}
      <div className="customer-form-section">
        <input
          type="text"
          placeholder="👤 Họ và tên người nhận"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          className="form-input"
          disabled={selectedAddressId !== '' && selectedAddressId !== undefined}
        />
        <input
          type="tel"
          placeholder="📞 Số điện thoại"
          value={customerPhone}
          onChange={e => setCustomerPhone(e.target.value)}
          className="form-input"
          disabled={selectedAddressId !== '' && selectedAddressId !== undefined}
        />
        <input
          type="text"
          placeholder="🏠 Địa chỉ nhận hàng"
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="form-input"
          disabled={selectedAddressId !== '' && selectedAddressId !== undefined}
        />
        <input
          type="text"
          placeholder="📝 Ghi chú cho shop (tuỳ chọn)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="form-input"
        />
        
        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            type="button"
            onClick={() => navigate('/profile?tab=address')}
            className="quick-action-btn manage-address-btn"
          >
            <span>⚙️</span>
            Quản lý địa chỉ
          </button>
          {selectedAddressId && (
            <button
              type="button"
              onClick={() => handleAddressSelect('')}
              className="quick-action-btn manual-input-btn"
            >
              <span>✏️</span>
              Nhập thủ công
            </button>
          )}
        </div>
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