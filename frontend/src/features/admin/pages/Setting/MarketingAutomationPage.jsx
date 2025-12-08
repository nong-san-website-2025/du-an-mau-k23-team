// src/features/admin/pages/Setting/MarketingAutomationPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Switch, message, Space } from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function MarketingAutomationPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token"); // ✅ Lấy token đăng nhập

  // Cấu hình axios có sẵn header Authorization
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/marketing/`, axiosConfig);
      form.setFieldsValue(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 404) {
        message.warning("Chưa có dữ liệu cài đặt. Sẽ được tạo mới khi lưu.");
      } else {
        message.error("Không tải được cài đặt marketing.");
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/settings/marketing/`, values, axiosConfig);
      message.success("💾 Lưu cài đặt marketing thành công!");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        message.error("Bạn chưa đăng nhập hoặc token đã hết hạn!");
      } else {
        message.error("Lưu thất bại, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="⚙️ Tự động hóa Marketing"
      style={{
        maxWidth: 800,
        margin: "40px auto",
        borderRadius: 12,
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Gửi email khuyến mãi định kỳ"
          name="enable_email"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item
          label="Gửi SMS khuyến mãi định kỳ"
          name="enable_sms"
          valuePropName="checked"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>

        <Form.Item label="Chiến dịch theo mùa" name="season_campaign">
          <Input placeholder="Ví dụ: Trái cây Tết, gạo mùa vụ..." />
        </Form.Item>

        <Form.Item label="Lịch thông báo giảm giá" name="discount_schedule">
          <Input placeholder="Ví dụ: Mỗi cuối tháng" />
        </Form.Item>

        <Form.Item style={{ textAlign: "right" }}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSettings}
              disabled={loading}
            >
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
