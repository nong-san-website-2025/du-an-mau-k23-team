// src/features/cart/components/CustomerForm.jsx
import React from "react";
import { Input, Form } from "antd";

const CustomerForm = ({
  manualEntry,
  customerName,
  customerPhone,
  addressText,
  note,
  setCustomerName,
  setCustomerPhone,
  setAddressText,
  setNote,
}) => {
  return (
    <Form layout="vertical">
      <Form.Item label="Họ và tên người nhận">
        <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          disabled={!manualEntry}
        />
      </Form.Item>

      <Form.Item label="Số điện thoại">
        <Input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          disabled={!manualEntry}
        />
      </Form.Item>

      <Form.Item label="Địa chỉ nhận hàng">
        <Input
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          disabled={!manualEntry}
        />
      </Form.Item>

      <Form.Item label="Ghi chú (tùy chọn)">
        <Input.TextArea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;
