// src/features/admin/pages/Setting/ReturnPolicyPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Select, message, Space } from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;
const API_BASE_URL = "http://localhost:8000/api";

export default function ReturnPolicyPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 🧩 Lấy token từ localStorage
  const token = localStorage.getItem("token");

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/return-policy/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      form.setFieldsValue(res.data);
    } catch (err) {
      message.error("Không tải được chính sách đổi trả.");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/settings/return-policy/`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success("Lưu chính sách thành công ✅");
    } catch (err) {
      message.error("Lưu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Chính sách đổi trả & khiếu nại"
      style={{ maxWidth: 800, margin: "0 auto" }}
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Thời hạn đổi trả (ngày)" name="return_days">
          <Input type="number" placeholder="Ví dụ: 7" />
        </Form.Item>

        <Form.Item label="Sản phẩm áp dụng" name="return_products">
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="Nhập tên sản phẩm áp dụng..."
          />
        </Form.Item>

        <Form.Item label="Mẫu quy trình khiếu nại" name="complaint_process">
          <Input.TextArea rows={3} placeholder="Nhập quy trình xử lý khiếu nại" />
        </Form.Item>

        <Form.Item style={{ textAlign: "right" }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchSettings}>
              Tải lại
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Lưu cài đặt
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
