import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Drawer,
  Form,
  message,
  Tag,
  Space,
  Popconfirm,
  Typography,
  Divider,
  Modal,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  HistoryOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;
const { Title } = Typography;

const API_BASE_URL = "http://localhost:8000/api";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filter, setFilter] = useState({ search: "", role: "", status: "" });
  const [form] = Form.useForm();

  const token = localStorage.getItem("token");

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter,
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const openDrawer = (record = null) => {
    setEditingUser(record);
    setIsDrawerOpen(true);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Xoá người dùng thành công!");
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error("Xoá thất bại!");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/users/${id}/`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Cập nhật trạng thái thành công!");
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  const handleResetPassword = async (id) => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/users/${id}/reset-password/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Reset mật khẩu thành công!");
    } catch (err) {
      console.error(err);
      message.error("Reset mật khẩu thất bại.");
    }
  };

  const handleViewLoginHistory = (userId) => {
    Modal.info({
      title: "Lịch sử đăng nhập",
      content: (
        <ul>
          <li>IP: 192.168.1.10</li>
          <li>Thời gian: 2023-09-15 20:31</li>
          <li>Thiết bị: Chrome / Windows</li>
        </ul>
      ),
    });
  };

  const onFinish = async (values) => {
    try {
      if (editingUser) {
        await axios.put(`${API_BASE_URL}/admin/users/${editingUser.id}/`, values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success("Cập nhật người dùng thành công!");
      } else {
        await axios.post(`${API_BASE_URL}/admin/users/`, values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success("Tạo người dùng mới thành công!");
      }
      fetchUsers();
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
      message.error("Lưu người dùng thất bại.");
    }
  };

  const columns = [
    { title: "Họ tên", dataIndex: "full_name", key: "full_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role) => (
        <Tag color={role === "admin" ? "blue" : "geekblue"}>{role}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      render: (active) => (
        <Tag color={active ? "green" : "volcano"}>
          {active ? "Đang hoạt động" : "Bị khoá"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openDrawer(record)} />
          <Popconfirm title="Bạn chắc chắn xoá?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
          <Button
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record.id, record.is_active)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => handleResetPassword(record.id)} />
          <Button icon={<HistoryOutlined />} onClick={() => handleViewLoginHistory(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Quản lý người dùng</Title>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input
          placeholder="Tìm theo tên/email"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        <Select
          placeholder="Vai trò"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilter({ ...filter, role: value })}
        >
          <Option value="admin">Admin</Option>
          <Option value="user">User</Option>
        </Select>
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilter({ ...filter, status: value })}
        >
          <Option value="active">Đang hoạt động</Option>
          <Option value="inactive">Bị khoá</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
          Thêm người dùng
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />

      <Drawer
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={400}
        destroyOnClose
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={() => setIsDrawerOpen(false)} style={{ marginRight: 8 }}>
              Huỷ
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              Lưu
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="full_name"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Chọn vai trò" }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="admin">Admin</Option>
              <Option value="user">User</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
