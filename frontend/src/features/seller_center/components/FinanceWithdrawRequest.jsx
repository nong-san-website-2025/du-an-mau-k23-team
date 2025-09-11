import React, { useState } from "react";
import { Card, Button, InputNumber, Form, message } from "antd";

export default function FinanceWithdrawRequest({ onWithdraw, loading }) {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    if (onWithdraw) onWithdraw(values.amount, form.resetFields);
  };

  return (
    <Card bordered={false} style={{ marginBottom: 16 }} title="Yêu cầu rút tiền">
      <Form layout="inline" form={form} onFinish={handleFinish}>
        <Form.Item
          name="amount"
          rules={[{ required: true, message: "Nhập số tiền muốn rút" }]}
        >
          <InputNumber
            min={10000}
            step={10000}
            style={{ width: 200 }}
            placeholder="Số tiền (VNĐ)"
            formatter={val => val && Number(val).toLocaleString("vi-VN")}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Gửi yêu cầu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
