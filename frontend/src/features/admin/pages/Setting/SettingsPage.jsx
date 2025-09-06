// src/features/admin/pages/Setting/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, Form, Input, Button, message, Switch, Select, Table } from "antd";
import axios from "axios";

const { TabPane } = Tabs;
const API_BASE_URL = "http://localhost:8000/api";

export default function SettingsPage() {
  const [userInfoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load user info khi mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/user/me/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => userInfoForm.setFieldsValue(res.data))
      .catch(err => console.error("Load user info error:", err));
  }, [userInfoForm]);

  // Load logs
  useEffect(() => {
    setLoadingLogs(true);
    axios.get(`${API_BASE_URL}/admin/logs/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => setLogs(res.data || []))
      .catch(err => console.error("Load logs error:", err))
      .finally(() => setLoadingLogs(false));
  }, []);

  const handleUpdateUserInfo = (values) => {
    axios.put(`${API_BASE_URL}/user/me/`, values, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => message.success("Cập nhật thông tin thành công!"))
      .catch(err => message.error("Cập nhật thất bại, xem console."));
  };

  const handleChangePassword = (values) => {
    if(values.new_password !== values.confirm_password){
      return message.error("Mật khẩu mới và xác nhận không khớp.");
    }
    axios.post(`${API_BASE_URL}/user/change-password/`, values, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => {
        message.success("Đổi mật khẩu thành công!");
        passwordForm.resetFields();
      })
      .catch(err => message.error("Đổi mật khẩu thất bại."));
  };

  const handleUpdateConfig = (values) => {
    axios.put(`${API_BASE_URL}/admin/config/`, values, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => message.success("Cập nhật cấu hình thành công!"))
      .catch(err => message.error("Cập nhật cấu hình thất bại."));
  };

  const logColumns = [
    { title: "Thời gian", dataIndex: "timestamp", key: "timestamp" },
    { title: "Hành động", dataIndex: "action", key: "action" },
    { title: "Người thực hiện", dataIndex: "user", key: "user" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
  ];

  return (
    <div className="p-4">
      <h2>Trang cài đặt</h2>
      <Tabs defaultActiveKey="1">
        {/* Thông tin cá nhân */}
        <TabPane tab="Thông tin cá nhân" key="1">
          <Form form={userInfoForm} layout="vertical" onFinish={handleUpdateUserInfo} style={{ maxWidth: 600 }}>
            <Form.Item label="Tên hiển thị" name="full_name">
              <Input placeholder="Nhập tên hiển thị" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Cập nhật thông tin</Button>
            </Form.Item>
          </Form>
        </TabPane>

        {/* Đổi mật khẩu */}
        <TabPane tab="Đổi mật khẩu" key="2">
          <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} style={{ maxWidth: 600 }}>
            <Form.Item label="Mật khẩu hiện tại" name="old_password" rules={[{ required: true }]}>
              <Input.Password placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>
            <Form.Item label="Mật khẩu mới" name="new_password" rules={[{ required: true }]}>
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>
            <Form.Item label="Xác nhận mật khẩu mới" name="confirm_password" rules={[{ required: true }]}>
              <Input.Password placeholder="Xác nhận mật khẩu mới" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Đổi mật khẩu</Button>
            </Form.Item>
          </Form>
        </TabPane>

        {/* Cấu hình hệ thống */}
        <TabPane tab="Cấu hình hệ thống" key="3">
          <Form form={configForm} layout="vertical" onFinish={handleUpdateConfig} style={{ maxWidth: 600 }}>
            <Form.Item label="Ngôn ngữ mặc định" name="default_language" initialValue="vi">
              <Select>
                <Select.Option value="vi">Tiếng Việt</Select.Option>
                <Select.Option value="en">English</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Bật thông báo email" name="email_notification" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Cập nhật cấu hình</Button>
            </Form.Item>
          </Form>
        </TabPane>

        {/* Lịch sử hoạt động */}
        <TabPane tab="Lịch sử hoạt động" key="4">
          <Table columns={logColumns} dataSource={logs} loading={loadingLogs} rowKey="id" />
        </TabPane>
      </Tabs>
    </div>
  );
}
