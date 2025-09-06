import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, message, Divider } from "antd";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function AccountPage() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/user/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      form.setFieldsValue(res.data);
    } catch (err) {
      console.error(err);
      message.error("Không thể load thông tin người dùng.");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/user/me/`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/user/change-password/`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Đổi mật khẩu thành công!");
      passwordForm.resetFields();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.old_password?.[0] || "Đổi mật khẩu thất bại.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "20px auto" }}>
      <Card title="Thông tin tài khoản" bordered>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Họ và tên" name="full_name">
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card title="Đổi mật khẩu" bordered>
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item label="Mật khẩu cũ" name="old_password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Mật khẩu mới" name="new_password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
