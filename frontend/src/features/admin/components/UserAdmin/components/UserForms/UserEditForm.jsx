import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Card, message, Spin } from "antd";
import { updateUser, fetchRoles } from "../../api/userApi";
import { roleLabel } from "../../roleUtils";
import axios from "axios";

const { Option } = Select;

export default function UserEditForm({
  editUser,
  onCancel,
  onSave,
  roles: propRoles = [],
  rolesLoading: propRolesLoading = false,
}) {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState(propRoles || []);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;

  // 0. Load current user info
  useEffect(() => {
    let mounted = true;
    const loadCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        // SỬ DỤNG ENV Ở ĐÂY
        const response = await axios.get(`${API_URL}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mounted) setCurrentUser(response.data);
      } catch (error) {
        console.error("Lỗi load current user:", error);
      }
    };
    loadCurrentUser();
    return () => (mounted = false);
  }, [API_URL]); // Thêm API_URL vào dependency array

  // 1. Load Roles: prefer roles passed via props, otherwise fetch once on mount
  useEffect(() => {
    let mounted = true;
    const loadRolesIfNeeded = async () => {
      // If parent already provided roles, use them
      if (Array.isArray(propRoles) && propRoles.length > 0) {
        setRoles(propRoles);
        return;
      }

      try {
        const data = await fetchRoles();
        if (mounted) setRoles(data || []);
      } catch (error) {
        console.error("Lỗi load roles:", error);
      }
    };
    loadRolesIfNeeded();
    return () => (mounted = false);
  }, [propRoles]); // re-run if parent supplies roles later

  // 2. Điền dữ liệu vào form khi có editUser
  useEffect(() => {
    if (editUser) {
      // Logic xử lý role an toàn hơn: Kiểm tra xem role là object hay id
      let roleId = "";
      if (editUser.role) {
        // Nếu role là object (có id) hoặc role chính là ID
        roleId =
          typeof editUser.role === "object"
            ? String(editUser.role.id)
            : String(editUser.role);
      } else if (editUser.role_id) {
        // Fallback trường hợp API trả về field role_id riêng
        roleId = String(editUser.role_id);
      }

      form.setFieldsValue({
        username: editUser.username || "",
        email: editUser.email || "",
        full_name: editUser.full_name || "",
        phone: editUser.phone || "",
        role_id: roleId, // Sử dụng roleId đã xử lý
        is_active: editUser.is_active ? "Đang hoạt động" : "Bị khóa",
      });
    }
  }, [editUser, form]);

  const handleSubmit = async (values) => {
    if (!editUser?.id) return;

    setLoading(true);
    try {
      const payload = {
        username: editUser.username, // Thêm username vào payload
        full_name: values.full_name,
        phone: values.phone,
        role_id: values.role_id ? Number(values.role_id) : null,
        is_active: editUser.is_active,
      };

      const response = await updateUser(editUser.id, payload);
      message.success("Cập nhật thành công!");
      if (onSave) onSave(response);
    } catch (error) {
      message.error("Cập nhật thất bại!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!editUser) return <Spin />;

  return (
    <Card bordered={false} style={{ padding: 24, borderRadius: 12 }}>
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Read-only fields */}
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
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          {/* Thêm prop loading để user biết roles đang tải */}
          <Select
            placeholder="Chọn vai trò"
            loading={propRolesLoading || roles.length === 0}
            disabled={
              currentUser &&
              editUser &&
              currentUser.id === editUser.id &&
              editUser.role?.name === "admin"
            }
          >
            {roles.map((role) => (
              <Option key={role.id} value={String(role.id)}>
                {roleLabel(role.name)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {currentUser &&
          editUser &&
          currentUser.id === editUser.id &&
          editUser.role?.name === "admin" && (
            <div style={{
              padding: "8px 12px",
              backgroundColor: "#fff7e6",
              borderRadius: "4px",
              borderLeft: "4px solid #faad14",
              marginTop: "-8px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#666"
            }}>
              ℹ️ Admin không thể tự thay đổi vai trò của bản thân
            </div>
          )}

        <Form.Item label="Trạng thái" name="is_active">
          <Input disabled />
        </Form.Item>

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