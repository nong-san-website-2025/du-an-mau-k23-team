// components/UserAdmin/UserEditForm.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Card, message } from "antd";
import axios from "axios";
import { roleLabel } from "./roleUtils";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const { Option } = Select;

export default function UserEditForm({ editUser, onCancel, onSave }) {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  // Load roles once on mount (so Select always has full list)
  useEffect(() => {
    const token = getToken();

    const tryLoadRoles = async () => {
      const endpoints = [
        `${API_BASE_URL}/users/roles/list/`,
        `${API_BASE_URL}/users/roles/`,
        `${API_BASE_URL}/roles/list/`,
        `${API_BASE_URL}/roles/`,
      ];

      for (const url of endpoints) {
        try {
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res && res.status >= 200 && res.status < 300) {
            // Normalize possible wrapper (results/data)
            let data = res.data;
            if (data && data.results) data = data.results;
            if (data && data.data) data = data.data;
            setRoles(Array.isArray(data) ? data : []);
            return;
          }
        } catch (err) {
          // continue to next endpoint on 404 or other errors
          // but log only if it's the last endpoint
          console.warn(
            `Tried roles endpoint ${url}:`,
            err?.response?.status || err.message
          );
          continue;
        }
      }

      console.error(
        "❌ Không tải được danh sách roles từ server (404/Not found)"
      );
    };

    tryLoadRoles();
  }, []);

  // Fill form whenever editUser changes
  useEffect(() => {
    if (!editUser) return;
    // Set all fields except role_id — we set role_id only after roles list is loaded
    form.setFieldsValue({
      username: editUser.username || "",
      email: editUser.email || "",
      full_name: editUser.full_name || "",
      phone: editUser.phone || "",
      is_active: editUser.is_active,
    });
  }, [editUser, form]);

  // When roles are available, set the role_id so Select can match an Option
  useEffect(() => {
    if (!editUser) return;
    if (!roles || roles.length === 0) return;
    const roleId = editUser.role ? String(editUser.role.id) : "";
    form.setFieldsValue({ role_id: roleId });
  }, [roles, editUser, form]);

  const handleSubmit = async (values) => {
    if (!editUser?.id) return;

    setLoading(true);
    try {
      const payload = {
        // include username so backend that requires it won't error
        username: values.username || editUser.username,
        full_name: values.full_name,
        phone: values.phone,
        role_id: values.role_id ? Number(values.role_id) : null,
        // prefer form value if present, otherwise keep current
        is_active: typeof values.is_active !== "undefined" ? values.is_active : editUser.is_active,
      };

      // Use admin management endpoint (registered as 'management')
      const response = await axios.patch(
        `${API_BASE_URL}/users/management/${editUser.id}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      // Refetch full user from management endpoint to ensure nested `role` is present
      let updatedUser = response.data;
      try {
        const full = await axios.get(
          `${API_BASE_URL}/users/management/${editUser.id}/`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        if (full && full.data) updatedUser = full.data;
      } catch (e) {
        console.warn(
          "Không thể fetch user sau khi cập nhật:",
          e?.response?.status || e.message
        );
      }

      message.success("Cập nhật thông tin thành công");
      if (onSave) onSave(updatedUser);
    } catch (err) {
      console.error("Cập nhật user thất bại:", err.response?.data || err);
      message.error("Lưu thay đổi thất bại");
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
        padding: 12,
      }}
    >
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
        <Form.Item label="Họ và tên" name="full_name">
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="phone">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role_id"
          rules={[{ required: true, message: "Vui lòng chọn quyền" }]}
        >
          <Select placeholder="Chọn quyền">
            {roles.map((r) => (
              <Option key={r.id} value={String(r.id)}>
                {roleLabel(r.name)}
              </Option>
            ))}
          </Select>
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
