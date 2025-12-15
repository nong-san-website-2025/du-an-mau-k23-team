import React from "react";
import { Radio, Space, Typography, Row, Col } from "antd";
import { DollarOutlined, WalletOutlined } from "@ant-design/icons";

// ----------------------------------------------------------------------
// ✅ 1. CHỖ ĐỂ IMPORT ẢNH (Thay đường dẫn ảnh thật của bạn vào đây)
// ----------------------------------------------------------------------
// Ví dụ: import vnpayLogo from "../assets/images/vnpay-logo.png";
const VNPAY_LOGO_URL = "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png"; 
// Nếu chưa có ảnh, để null nó sẽ hiện Icon backup

const PaymentMethod = ({ payment, setPayment }) => {
  
  // Custom style cho từng ô chọn
  const getOptionStyle = (value) => {
    const isSelected = payment === value;
    return {
      border: isSelected ? "2px solid #00b96b" : "1px solid #d9d9d9", // Màu xanh GreenFarm
      background: isSelected ? "#f6ffed" : "#fff",
      borderRadius: "8px",
      padding: "16px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      marginBottom: "12px", // Khoảng cách giữa các ô
    };
  };

  return (
    <div className="checkout-card">
      <div className="card-header" style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        <DollarOutlined style={{ marginRight: 8, color: '#00b96b' }} /> 
        Phương thức thanh toán
      </div>

      <Radio.Group
        value={payment}
        onChange={(e) => setPayment(e.target.value)}
        style={{ width: "100%" }}
      >
        {/* --- OPTION 1: COD --- */}
        <div 
            style={getOptionStyle("Thanh toán khi nhận hàng")}
            onClick={() => setPayment("Thanh toán khi nhận hàng")}
        >
          <Radio value="Thanh toán khi nhận hàng" style={{ marginRight: 16 }}>
            {/* Ẩn label mặc định của Radio để tự custom layout bên cạnh */}
          </Radio>
          
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Icon COD */}
            <div style={{ 
                width: 48, height: 48, 
                background: '#fff7e6', 
                borderRadius: 8, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 16,
                border: '1px solid #ffe7ba'
            }}>
                <WalletOutlined style={{ fontSize: 24, color: "#faad14" }} />
            </div>

            {/* Text Info */}
            <div>
              <Typography.Text strong style={{ fontSize: 15, display: 'block' }}>
                Thanh toán khi nhận hàng (COD)
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Thanh toán bằng tiền mặt khi shipper giao đến
              </Typography.Text>
            </div>
          </div>
        </div>

        {/* --- OPTION 2: VÍ ĐIỆN TỬ / VNPAY (Đã chừa chỗ ảnh) --- */}
        <div 
            style={getOptionStyle("Ví điện tử")}
            onClick={() => setPayment("Ví điện tử")}
        >
          <Radio value="Ví điện tử" style={{ marginRight: 16 }}></Radio>
          
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* ✅ 2. KHU VỰC HIỂN THỊ LOGO / ẢNH */}
            <div style={{ 
                width: 48, height: 48, 
                background: '#fff', 
                borderRadius: 8, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 16,
                border: '1px solid #f0f0f0',
                overflow: 'hidden',
                padding: 4 // Padding nhỏ để ảnh không dính sát viền
            }}>
                {VNPAY_LOGO_URL ? (
                    <img 
                        src={VNPAY_LOGO_URL} 
                        alt="VNPAY" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                ) : (
                    // Fallback icon nếu ảnh lỗi hoặc chưa import
                    <DollarOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                )}
            </div>

            {/* Text Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography.Text strong style={{ fontSize: 15 }}>
                    Thanh toán qua VNPAY
                  </Typography.Text>
                  
                  {/* Badge nhỏ "Khuyên dùng" hoặc icon thẻ nhỏ (Optional) */}
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/196/196578.png" // Icon Visa demo
                    alt="cards"
                    style={{ height: 20, opacity: 0.6 }} 
                  />
              </div>
              
              <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                Quét mã QR, Thẻ ATM nội địa, Visa/Mastercard
              </Typography.Text>
            </div>
          </div>
        </div>

      </Radio.Group>
    </div>
  );
};

export default PaymentMethod;