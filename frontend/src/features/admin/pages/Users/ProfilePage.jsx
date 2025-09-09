// src/features/admin/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, message, Tabs, Upload, Avatar } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formProfile] = Form.useForm();
  const [formPassword] = Form.useForm();

  const token = localStorage.getItem("token") || "";

  // Load user info
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingProfile(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        formProfile.setFieldsValue(res.data);
      } catch (err) {
        console.error(err);
        message.error("Không thể load thông tin user.");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUser();
  }, [token, formProfile]);

  const handleProfileUpdate = async (values) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/me/`, values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      message.success("Cập nhật thành công!");
      setUser(response.data);
    } catch (error) {
      console.error(error.response?.data);
      message.error("Cập nhật thất bại!");
    }
  };

  // Change password
  const handleChangePassword = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error("Mật khẩu mới và xác nhận không khớp!");
      return;
    }
    setLoadingPassword(true);
    try {
      await axios.post(
        `${API_BASE_URL}/change-password/`,
        {
          old_password: values.old_password,
          new_password: values.new_password,
          confirm_password: values.confirm_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đổi mật khẩu thành công!");
      formPassword.resetFields();
    } catch (err) {
      console.error(err.response?.data || err.message);
      message.error("Đổi mật khẩu thất bại, xem console để biết chi tiết.");
    } finally {
      setLoadingPassword(false);
    }
  };

  // Upload avatar (customRequest)
  const handleCustomUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/user/upload-avatar/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
      message.success("Cập nhật avatar thành công!");
      onSuccess(res.data);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      message.error("Upload avatar thất bại.");
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      title="Thông tin cá nhân"
      style={{ maxWidth: 800, margin: "20px auto" }}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Thông tin cá nhân" key="1">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar
              size={120}
              src={user?.avatar}
              icon={!user?.avatar && <UserOutlined />}
            />
            <div style={{ marginTop: 10 }}>
              <Upload
                showUploadList={false}
                customRequest={handleCustomUpload}
                disabled={uploading}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Đổi ảnh đại diện
                </Button>
              </Upload>
            </div>
          </div>

          <Form
            form={formProfile}
            layout="vertical"
            onFinish={handleProfileUpdate}
            initialValues={user}
          >
            <Form.Item label="Tên đăng nhập" name="username">
              <Input disabled />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Họ và tên" name="full_name">
              <Input />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phone">
              <Input />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Button type="primary" htmlType="submit" loading={loadingProfile}>
                Cập nhật thông tin
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Đổi mật khẩu" key="2">
          <Form
            form={formPassword}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              label="Mật khẩu cũ"
              name="old_password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="new_password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirm_password"
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadingPassword}
              >
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
}
