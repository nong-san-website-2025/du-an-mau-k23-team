// components/UserForms/UserAddModal.jsx
// Thêm user mới - Form trong Modal
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { createUser, fetchRoles } from "../../api/userApi";
import { roleLabel } from "../../roleUtils";

const { Option } = Select;

export default function UserAddModal({ visible, onClose, onUserAdded }) {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load roles khi mở modal
  useEffect(() => {
    if (!visible) return;
    const loadRoles = async () => {
      try {
        const data = await fetchRoles();
        setRoles(data || []);
      } catch (error) {
        message.error("Không thể tải danh sách vai trò");
      }
    };
    loadRoles();
  }, [visible]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        username: values.username,
        email: values.email,
        full_name: values.full_name || "",
        phone: values.phone || "",
        password: values.password?.trim() || "123456",
        role_id: values.role_id ? Number(values.role_id) : null,
      };

      const res = await createUser(payload);
      message.success("✅ Thêm người dùng thành công!");
      form.resetFields();
      onClose();
      onUserAdded?.(res);
    } catch (error) {
      message.error("❌ Thêm người dùng thất bại!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="➕ Thêm người dùng mới"
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
          rules={[
            { required: true, message: "Vui lòng nhập tên đăng nhập!" },
            { min: 3, message: "Tên đăng nhập phải ít nhất 3 ký tự" },
          ]}
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
          <Input placeholder="Nhập email" type="email" />
        </Form.Item>

        <Form.Item label="Họ và tên" name="full_name">
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            {
              pattern: /^[0-9]{9,11}$/,
              message: "Số điện thoại không hợp lệ (9-11 số)",
            },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role_id"
          rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
        >
          <Select placeholder="Chọn vai trò">
            {roles.map((role) => (
              <Option key={role.id} value={String(role.id)}>
                {roleLabel(role.name)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Mật khẩu (tùy chọn)" name="password">
          <Input.Password placeholder="Để trống: Mật khẩu mặc định là 123456" />
        </Form.Item>

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
