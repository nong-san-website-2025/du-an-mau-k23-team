// src/features/admin/pages/Setting/SystemConfigPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, message, Switch } from "antd";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function SystemConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/system-config/`, {
        headers: {
          Authorization: `Bearer ${token}`, // hoặc đổi thành Token nếu bạn dùng DRF TokenAuth
        },
      });
      setConfig(res.data);
      form.setFieldsValue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/system-config/`, values);
      message.success("Cập nhật cấu hình thành công!");
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Cấu hình hệ thống" style={{ maxWidth: 600, margin: "0 auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Tên website" name="site_name">
          <Input />
        </Form.Item>
        <Form.Item label="Email hỗ trợ" name="support_email">
          <Input />
        </Form.Item>
        <Form.Item
          label="Bật chế độ bảo trì"
          name="maintenance_mode"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
