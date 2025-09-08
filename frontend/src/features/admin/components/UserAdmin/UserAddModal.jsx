// src/features/admin/components/UserAdmin/UserAddModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import axios from "axios";

const { Option } = Select;
const API_BASE_URL = process.env.REACT_APP_API_URL 

export default function UserAddModal({ visible, onClose, onUserAdded }) {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () =>
    localStorage.getItem("token")

  // Load roles từ backend
  useEffect(() => {
    const token = getToken();
    axios
      .get(`${API_BASE_URL}/users/roles/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Roles response (add):", res.data);
        setRoles(res.data || []);
      })
      .catch((err) => console.error("❌ Lỗi load roles:", err));
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        username: values.username,
        email: values.email,
        full_name: values.full_name || "",
        phone: values.phone || "",
        password: values.password?.trim() || "123456", // luôn gửi password
        role_id: values.role_id ? Number(values.role_id) : null,
      };

      const res = await axios.post(
        `${API_BASE_URL}/user-management/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      message.success("Thêm người dùng thành công!");
      form.resetFields();
      onClose();
      onUserAdded?.(res.data);
    } catch (err) {
      console.error("❌ Lỗi thêm user:", err.response?.data || err.message);
      if (err.response?.data) {
        message.error(
          `Không thể thêm user: ${JSON.stringify(err.response.data)}`
        );
      } else {
        message.error("Không thể thêm user, xem console để biết chi tiết.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thêm người dùng"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role_id: "", password: "" }}
      >
        <Form.Item
          label="Tên đăng nhập"
          name="username"
          rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
        >
          <Input placeholder="Nhập tên đăng nhập" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>

        <Form.Item label="Họ và tên" name="full_name">
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="phone">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Mật khẩu (tùy chọn)" name="password">
          <Input.Password placeholder="Để trống nếu muốn tạo mặc định" />
        </Form.Item>

        {roles.length >= 0 && (
          <Form.Item
            label="Vai trò"
            name="role_id"
            rules={[{ required: true, message: "Vui lòng chọn quyền!" }]}
          >
            <Select
              placeholder="-- Chọn quyền --"
              loading={roles.length === 0}
              notFoundContent="Không có role nào"
            >
              {roles.map((r) => (
                <Option key={r.id} value={String(r.id)}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item style={{ textAlign: "right", marginTop: 20 }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Thêm người dùng
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}