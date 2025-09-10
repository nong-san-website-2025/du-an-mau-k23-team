// src/features/admin/pages/Setting/ChangePasswordPage.jsx
import React, { useState } from "react";
import { Card, Form, Input, Button, message } from "antd";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/users";

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("token") || "";

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/user/change-password/`, values, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      message.success("Đổi mật khẩu thành công!");
      form.resetFields();
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        message.error(`Lỗi: ${JSON.stringify(err.response.data)}`);
      } else {
        message.error("Không thể đổi mật khẩu, xem console để biết chi tiết.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Đổi mật khẩu" style={{ maxWidth: 500, margin: "auto" }}>
      <Form form={form} layout="vertical" onFinish={handleChangePassword}>
        <Form.Item
          label="Mật khẩu cũ"
          name="old_password"
          rules={[{ required: true, message: "Nhập mật khẩu cũ!" }]}
        >
          <Input.Password placeholder="Nhập mật khẩu cũ" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="new_password"
          rules={[{ required: true, message: "Nhập mật khẩu mới!" }]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirm_password"
          dependencies={['new_password']}
          rules={[
            { required: true, message: "Xác nhận mật khẩu mới!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject("Mật khẩu xác nhận không khớp!");
              },
            }),
          ]}
        >
          <Input.Password placeholder="Nhập lại mật khẩu mới" />
        </Form.Item>

        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
