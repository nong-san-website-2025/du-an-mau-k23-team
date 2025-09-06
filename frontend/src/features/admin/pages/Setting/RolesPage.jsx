// src/features/admin/pages/Setting/RolesPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/roles/list/`);
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      if (editingRole) {
        await axios.put(`${API_BASE_URL}/roles/${editingRole.id}/`, values);
        message.success("Cập nhật quyền thành công!");
      } else {
        await axios.post(`${API_BASE_URL}/roles/`, values);
        message.success("Tạo quyền mới thành công!");
      }
      setModalVisible(false);
      setEditingRole(null);
      form.resetFields();
      fetchRoles();
    } catch (err) {
      console.error(err);
      message.error("Thao tác thất bại!");
    } finally { setLoading(false); }
  };

  const handleDelete = async (role) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/roles/${role.id}/`);
      message.success("Xóa quyền thành công!");
      fetchRoles();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại!");
    } finally { setLoading(false); }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Tên quyền", dataIndex: "name", key: "name" },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => { setEditingRole(record); setModalVisible(true); }}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <Card title="Quản lý quyền" extra={<Button onClick={() => setModalVisible(true)}>Thêm quyền</Button>}>
      <Table dataSource={roles} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingRole ? "Sửa quyền" : "Thêm quyền"}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingRole(null); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={editingRole || { name: "" }}>
          <Form.Item label="Tên quyền" name="name" rules={[{ required: true, message: "Nhập tên quyền!" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
