import React from "react";
import { Radio, Space, Typography } from "antd";
import { CreditCardOutlined, WalletOutlined, DollarOutlined } from "@ant-design/icons";

const PaymentMethod = ({ payment, setPayment }) => {
  return (
    <div className="checkout-card">
      <div className="card-header">
        <DollarOutlined /> Phương thức thanh toán
      </div>
      <Radio.Group 
        value={payment} 
        onChange={(e) => setPayment(e.target.value)} 
        className="payment-radio-group"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Radio.Button value="Thanh toán khi nhận hàng" style={{ height: "auto", padding: "12px", borderRadius: 8 }}>
            <div className="payment-option-card">
              <WalletOutlined style={{ fontSize: 24, color: "#faad14" }} />
              <div>
                <Typography.Text strong>Thanh toán khi nhận hàng (COD)</Typography.Text>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Thanh toán tiền mặt khi shipper giao hàng</div>
              </div>
            </div>
          </Radio.Button>

          <Radio.Button value="Ví điện tử" style={{ height: "auto", padding: "12px", borderRadius: 8, marginTop: 10 }}>
            <div className="payment-option-card">
              <CreditCardOutlined style={{ fontSize: 24, color: "#1890ff" }} />
              <div>
                <Typography.Text strong>Thanh toán qua VNPAY / Ví điện tử</Typography.Text>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Quét mã QR, Thẻ ATM nội địa, Visa/Mastercard</div>
              </div>
            </div>
          </Radio.Button>
        </Space>
      </Radio.Group>
    </div>
  );
};
export default PaymentMethod;