import React from "react";
import { Radio, Typography } from "antd";
import {
  CreditCardOutlined,
  WalletOutlined,
  DollarOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import "../styles/PaymentMethod.css"; // Giả sử bạn lưu CSS ở file này

const { Text, Title } = Typography;

// 1. Tách dữ liệu để dễ quản lý (Clean Code)
const PAYMENT_OPTIONS = [
  {
    value: "cod",
    label: "Thanh toán khi nhận hàng (COD)",
    icon: <WalletOutlined style={{ fontSize: 28, color: "#faad14" }} />,
  },
  {
    value: "e-wallet",
    label: "Thanh toán qua VNPAY",
    icon: <CreditCardOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
  },
];

const PaymentMethod = ({ payment, setPayment }) => {
  return (
    <div className="checkout-card">
      <div className="card-header mb-3 d-flex align-items-center">
        <DollarOutlined className="header-icon mb-2" />
        <Title level={4} className="">
          Phương thức thanh toán
        </Title>
      </div>

      <Radio.Group
        value={payment}
        onChange={(e) => setPayment(e.target.value)}
        className="payment-radio-group"
      >
        {PAYMENT_OPTIONS.map((option) => (
          // Sử dụng label của Radio để bọc toàn bộ nội dung -> tăng diện tích click
          <label
            key={option.value}
            className={`payment-option-item ${
              payment === option.value ? "active" : ""
            }`}
          >
            <Radio value={option.value} style={{ display: "none" }} />
            
            <div className="option-layout">
              {/* Icon Section */}
              <div className="option-icon">{option.icon}</div>

              {/* Text Section */}
              <div className="option-info">
                <Text strong className="option-title">
                  {option.label}
                </Text>
                <Text type="secondary" className="option-desc">
                  {option.description}
                </Text>
              </div>

              {/* Active Indicator (UX: Dấu tích xanh khi chọn) */}
              {payment === option.value && (
                <div className="option-check">
                  <CheckCircleFilled />
                </div>
              )}
            </div>
          </label>
        ))}
      </Radio.Group>
    </div>
  );
};

export default PaymentMethod;