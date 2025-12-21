// src/features/admin/pages/Setting/ShippingSettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Select, message, Space } from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;
const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function ShippingSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/shipping/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      form.setFieldsValue(res.data);
    } catch (err) {
      message.error("Không tải được cài đặt vận chuyển.");
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/settings/shipping/`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success("Lưu cài đặt vận chuyển thành công ✅");
    } catch (err) {
      message.error("Lưu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Cấu hình vận chuyển thông minh"
      style={{ maxWidth: 800, margin: "0 auto" }}
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Đối tác vận chuyển" name="provider">
          <Select placeholder="Chọn đối tác">
            <Option value="ghn">Giao Hàng Nhanh</Option>
            <Option value="ghtk">Giao Hàng Tiết Kiệm</Option>
            <Option value="viettelpost">Viettel Post</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Quy tắc phí ship" name="fee_rule">
          <Input.TextArea
            rows={3}
            placeholder="Ví dụ: miễn phí > 500k, tính theo km/trọng lượng..."
          />
        </Form.Item>

        <Form.Item label="Thời gian giao hàng dự kiến" name="delivery_time">
          <Input placeholder="Ví dụ: 2-3 ngày" />
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
