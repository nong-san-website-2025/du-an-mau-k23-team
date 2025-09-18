// src/features/admin/pages/Setting/SystemConfigPage.jsx
import React, { useEffect, useState } from "react";
import {
  Card, Form, Input, Button, message, Switch, Select, Upload, Divider
} from "antd";
import axios from "axios";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";

const { Option } = Select;
const API_BASE_URL = "http://localhost:8000/api";

export default function SystemConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/system-config/`);
      setConfig(res.data);
      form.setFieldsValue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

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

  const handleBackup = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/backup/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "backup.zip");
      document.body.appendChild(link);
      link.click();
      message.success("Tải backup thành công");
    } catch (err) {
      message.error("Không thể tải backup");
    }
  };

  const handleRestore = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API_BASE_URL}/restore/`, formData);
      message.success("Khôi phục thành công!");
    } catch (err) {
      message.error("Khôi phục thất bại!");
    }
  };

  return (
    <Card title="Cấu hình hệ thống" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>

        {/* 1. Cấu hình thông tin trang web */}
        <Divider orientation="left">Thông tin trang web</Divider>
        <Form.Item label="Tên website" name="site_name"><Input /></Form.Item>
        <Form.Item label="Email hỗ trợ" name="support_email"><Input /></Form.Item>
        <Form.Item label="Số điện thoại" name="phone"><Input /></Form.Item>
        <Form.Item label="Địa chỉ" name="address"><Input /></Form.Item>
        <Form.Item label="Logo URL" name="logo_url"><Input /></Form.Item>
        <Form.Item label="Favicon URL" name="favicon_url"><Input /></Form.Item>
        <Form.Item label="Mô tả ngắn" name="short_description"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item label="Bật chế độ bảo trì" name="maintenance_mode" valuePropName="checked"><Switch /></Form.Item>

        {/* 2. Cấu hình email (SMTP) */}
        <Divider orientation="left">Cấu hình Email (SMTP)</Divider>
        <Form.Item label="SMTP Host" name="smtp_host"><Input /></Form.Item>
        <Form.Item label="SMTP Port" name="smtp_port"><Input /></Form.Item>
        <Form.Item label="Email gửi" name="smtp_email"><Input /></Form.Item>
        <Form.Item label="Mật khẩu Email" name="smtp_password"><Input.Password /></Form.Item>
        <Form.Item label="Bảo mật" name="smtp_security">
          <Select>
            <Option value="ssl">SSL</Option>
            <Option value="tls">TLS</Option>
          </Select>
        </Form.Item>

        {/* 3. Tích hợp vận chuyển */}
        <Divider orientation="left">Tích hợp đơn vị vận chuyển</Divider>
        <Form.Item label="Dịch vụ vận chuyển" name="shipping_provider">
          <Select>
            <Option value="ghn">Giao Hàng Nhanh</Option>
            <Option value="viettel">Viettel Post</Option>
          </Select>
        </Form.Item>
        <Form.Item label="API Key" name="shipping_api_key"><Input /></Form.Item>
        <Form.Item label="Endpoint" name="shipping_endpoint"><Input /></Form.Item>
        <Form.Item label="Phí vận chuyển theo khu vực" name="shipping_fee_rule"><Input.TextArea rows={2} /></Form.Item>

        {/* 4. Phương thức thanh toán */}
        <Divider orientation="left">Phương thức thanh toán</Divider>
        <Form.Item label="COD" name="payment_cod" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item label="MoMo" name="payment_momo" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item label="MoMo API Key" name="momo_api_key"><Input /></Form.Item>
        <Form.Item label="MoMo Secret" name="momo_secret"><Input /></Form.Item>

        <Form.Item label="VNPay" name="payment_vnpay" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item label="VNPay API Key" name="vnpay_api_key"><Input /></Form.Item>
        <Form.Item label="VNPay Secret" name="vnpay_secret"><Input /></Form.Item>

        {/* 5. Sao lưu / Khôi phục */}
        <Divider orientation="left">Sao lưu và khôi phục</Divider>
        <Form.Item>
          <Button icon={<DownloadOutlined />} onClick={handleBackup} style={{ marginRight: 8 }}>
            Tải backup
          </Button>
          <Upload
            accept=".zip"
            beforeUpload={(file) => {
              handleRestore(file);
              return false;
            }}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Khôi phục từ file</Button>
          </Upload>
        </Form.Item>

        {/* Nút lưu */}
        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>Lưu thay đổi</Button>
        </Form.Item>

      </Form>
    </Card>
  );
}
