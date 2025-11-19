// components/UserForms/UserEditForm.jsx
// Sửa thông tin user
import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Card, message, Spin } from "antd";
import { updateUser, fetchRoles } from "../../api/userApi";

const { Option } = Select;

export default function UserEditForm({ editUser, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editUser) return;

    // Load roles
    const loadRoles = async () => {
      try {
        const data = await fetchRoles();
        setRoles(data || []);
      } catch (error) {
        console.error("Lỗi load roles:", error);
      }
    };

    loadRoles();

    // Fill form with current data
    form.setFieldsValue({
      username: editUser.username || "",
      email: editUser.email || "",
      full_name: editUser.full_name || "",
      phone: editUser.phone || "",
      role_id: editUser.role ? String(editUser.role.id) : "",
      is_active: editUser.is_active ? "Đang hoạt động" : "Bị khóa",
    });
  }, [editUser, form]);

  const handleSubmit = async (values) => {
    if (!editUser?.id) return;

    setLoading(true);
    try {
      const payload = {
        full_name: values.full_name,
        phone: values.phone,
        role_id: values.role_id ? Number(values.role_id) : null,
        is_active: editUser.is_active,
      };

      const response = await updateUser(editUser.id, payload);
      message.success("✅ Cập nhật thành công!");
      if (onSave) onSave(response);
    } catch (error) {
      message.error("❌ Cập nhật thất bại!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!editUser) return <Spin />;

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        padding: 24,
      }}
    >
      <h3 style={{ marginBottom: 20 }}>
        ✏️ Chỉnh sửa:{" "}
        <span style={{ color: "#1890ff", fontWeight: "bold" }}>
          {editUser.username}
        </span>
      </h3>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Read-only fields */}
        <Form.Item label="Tên đăng nhập" name="username">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input type="email" disabled />
        </Form.Item>

        {/* Editable fields */}
        <Form.Item
          label="Họ và tên"
          name="full_name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            {
              pattern: /^[0-9]{9,11}$/,
              message: "Số điện thoại không hợp lệ",
            },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role_id"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select placeholder="Chọn vai trò">
            {roles.map((role) => (
              <Option key={role.id} value={String(role.id)}>
                {role.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Trạng thái" name="is_active">
          <Input disabled />
        </Form.Item>

        {/* Buttons */}
        <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
