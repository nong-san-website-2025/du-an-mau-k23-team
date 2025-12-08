import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../features/login_register/services/api';

const VnpayReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const calledRef = useRef(false);

  useEffect(() => {
    const handleVnpayReturn = async () => {
      if (calledRef.current) return; // prevent double-call (StrictMode/dev)
      calledRef.current = true;
      try {
        // Lấy tất cả query parameters từ VNPAY
        const vnpParams = {};
        for (const [key, value] of searchParams.entries()) {
          vnpParams[key] = value;
        }


        // Gọi backend để xử lý VNPAY return
        const response = await API.post('payments/vnpay/return-api/', vnpParams);
        
        if (response.data.success) {
          try {
            // Thông báo cho CartContext xoá giỏ hàng cả server và guest
            window.dispatchEvent(new Event('clear-cart'));
          } catch {}
          toast.success('Thanh toán thành công!');
          navigate('/orders?tab=pending');
        } else {
          toast.error('Thanh toán thất bại!');
          navigate('/orders?status=fail');
        }
      } catch (error) {
        console.error('VNPAY Return Error:', error);
        toast.error('Có lỗi xảy ra khi xử lý thanh toán!');
        navigate('/orders?status=error');
      }
    };

    handleVnpayReturn();
  }, [navigate, searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>
      Đang xử lý thanh toán...
    </div>
  );
};

export default VnpayReturn;
