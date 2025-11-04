// components/UserAdmin/UserEditForm.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Card, message } from "antd";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";
const { Option } = Select;

export default function UserEditForm({ editUser, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  // ✅ Load roles + fill data
  useEffect(() => {
    if (!editUser) return;
    const token = getToken();

    axios
      .get(`${API_BASE_URL}/users/roles/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRoles(res.data || []))
      .catch((err) => console.error("❌ Lỗi load roles:", err));

    // Đổ dữ liệu ban đầu vào form
    form.setFieldsValue({
      username: editUser.username || "",
      email: editUser.email || "",
      full_name: editUser.full_name || "",
      phone: editUser.phone || "",
      role_id: editUser.role ? String(editUser.role.id) : "",
      is_active: editUser.is_active,
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

      const response = await axios.patch(
        `${API_BASE_URL}/users/${editUser.id}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      message.success("✅ Cập nhật thông tin thành công");
      if (onSave) onSave(response.data);
    } catch (err) {
      console.error("❌ Cập nhật user thất bại:", err.response?.data || err);
      message.error("❌ Lưu thay đổi thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!editUser)
    return <p style={{ textAlign: "center" }}>⏳ Đang tải dữ liệu...</p>;

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
        ✏️ Đang chỉnh sửa tài khoản:{" "}
        <b style={{ color: "#1890ff" }}>{editUser.username}</b>
      </h3>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Username + Email (read only) */}
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
          label="Quyền (Role)"
          name="role_id"
          rules={[{ required: true, message: "Vui lòng chọn quyền" }]}
        >
          <Select placeholder="Chọn quyền">
            {roles.map((r) => (
              <Option key={r.id} value={String(r.id)}>
                {r.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Trạng thái tài khoản">
          <Input
            value={editUser.is_active ? "Đang hoạt động" : "Bị khóa"}
            disabled
          />
        </Form.Item>

        {/* Nút hành động */}
        <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              borderRadius: 6,
              boxShadow: "0 2px 6px rgba(24,144,255,0.2)",
            }}
          >
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
