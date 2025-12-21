// src/features/admin/pages/Setting/ThemeSettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Select, Upload, message, Space } from "antd";
import { SaveOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;
const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function ThemeSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/theme/`);
      form.setFieldsValue(res.data);
    } catch (err) {
      message.error("Không tải được cài đặt giao diện.");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);

    const formData = new FormData();
    if (logoFile) formData.append("logo", logoFile);
    if (bannerFile) formData.append("banner", bannerFile);
    formData.append("brand_color", values.brand_color || "#ffffff");
    formData.append("theme_event", values.theme_event || "default");

    try {
      await axios.put(`${API_BASE_URL}/settings/theme/`, formData, axiosConfig);
      message.success("Lưu cài đặt giao diện thành công ✅");
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Tùy biến giao diện" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item label="Logo" name="logo">
          <Upload
            beforeUpload={(file) => {
              setLogoFile(file);
              return false;
            }}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Tải logo lên</Button>
          </Upload>
        </Form.Item>

        <Form.Item label="Banner" name="banner">
          <Upload
            beforeUpload={(file) => {
              setBannerFile(file);
              return false;
            }}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Tải banner lên</Button>
          </Upload>
        </Form.Item>

        <Form.Item label="Màu thương hiệu" name="brand_color">
          <Input type="color" style={{ width: 100 }} />
        </Form.Item>

        <Form.Item label="Giao diện sự kiện" name="theme_event">
          <Select placeholder="Chọn sự kiện">
            <Option value="default">Mặc định</Option>
            <Option value="tet">Tết</Option>
            <Option value="noel">Noel</Option>
            <Option value="summer">Mùa hè</Option>
          </Select>
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
