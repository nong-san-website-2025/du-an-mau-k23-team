// src/features/admin/pages/Setting/LoyaltySettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Select, message, Space } from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;
const API_BASE_URL = "http://localhost:8000/api";

export default function LoyaltySettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/loyalty/`);
      form.setFieldsValue(res.data);
    } catch (err) {
      message.error("Không tải được cài đặt điểm thưởng.");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/settings/loyalty/`, values);
      message.success("Lưu cài đặt điểm thưởng thành công ✅");
    } catch (err) {
      message.error("Lưu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Điểm thưởng & hạng khách hàng" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Quy tắc tích điểm" name="point_rule">
          <Input placeholder="Ví dụ: 1000đ = 1 điểm" />
        </Form.Item>

        <Form.Item label="Quy đổi điểm" name="point_exchange">
          <Input placeholder="Ví dụ: 100 điểm = 10.000đ" />
        </Form.Item>

        <Form.Item label="Cấp hạng khách hàng" name="ranks">
          <Select mode="tags" placeholder="Thêm cấp hạng (Thường, VIP, Vàng...)">
            <Option value="normal">Thường</Option>
            <Option value="vip">VIP</Option>
            <Option value="gold">Vàng</Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ textAlign: "right" }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchSettings}>Tải lại</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Lưu cài đặt
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
