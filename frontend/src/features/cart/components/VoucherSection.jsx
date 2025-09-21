// src/features/cart/components/VoucherSection.jsx
import React, { useState } from "react";
import { Input, Button, Typography, Space, message } from "antd";

const { Text } = Typography;

const VoucherSection = ({ total, onApply }) => {
  const [voucher, setVoucher] = useState("");

  const handleApply = () => {
    if (!voucher.trim()) {
      message.warning("Vui lòng nhập mã giảm giá!");
      return;
    }
    onApply(voucher.trim().toUpperCase());
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="Nhập mã giảm giá/voucher"
          value={voucher}
          onChange={(e) => setVoucher(e.target.value)}
        />
        <Button type="primary" onClick={handleApply}>
          Áp dụng
        </Button>
      </Space.Compact>
      <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
        Mã giảm giá có thể áp dụng cho đơn hàng của bạn
      </Text>
    </div>
  );
};

export default VoucherSection;
