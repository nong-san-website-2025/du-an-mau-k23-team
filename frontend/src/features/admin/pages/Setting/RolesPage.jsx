import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Checkbox,
  Row,
  Col,
  Tag,
} from "antd";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Cấu hình chức năng (modules và actions)
const PERMISSION_MODULES = ["User", "Role", "Product", "Order"];
const ACTIONS = ["view", "add", "edit", "delete"];

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
      message.error("Lỗi khi tải danh sách quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      if (editingRole) {
        await axios.put(`${API_BASE_URL}/roles/${editingRole.id}/`, values);
        message.success("Cập nhật vai trò thành công!");
      } else {
        await axios.post(`${API_BASE_URL}/roles/`, values);
        message.success("Tạo vai trò mới thành công!");
      }
      fetchRoles();
      setModalVisible(false);
      setEditingRole(null);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Thao tác thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/roles/${role.id}/`);
      message.success("Xóa vai trò thành công!");
      fetchRoles();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Tên vai trò", dataIndex: "name", key: "name" },
    {
      title: "Số người dùng",
      dataIndex: "user_count",
      key: "user_count",
      render: (count) => <Tag color="blue">{count} người</Tag>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => {
              setEditingRole(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  // Tạo danh sách checkbox quyền theo module
  const renderPermissionCheckboxes = () => {
    return PERMISSION_MODULES.map((module) => (
      <div key={module} style={{ marginBottom: 10 }}>
        <strong>{module}</strong>
        <Row gutter={16} style={{ marginTop: 4 }}>
          {ACTIONS.map((action) => {
            const value = `${module.toLowerCase()}.${action}`;
            return (
              <Col key={value}>
                <Form.Item name="permissions" noStyle>
                  <Checkbox value={value}>{action}</Checkbox>
                </Form.Item>
              </Col>
            );
          })}
        </Row>
      </div>
    ));
  };

  return (
    <Card
      title="Quản lý vai trò & phân quyền"
      extra={<Button onClick={() => setModalVisible(true)}>Thêm vai trò</Button>}
    >
      <Table
        dataSource={roles}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editingRole ? "Cập nhật vai trò" : "Thêm vai trò mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRole(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Tên vai trò"
            name="name"
            rules={[{ required: true, message: "Nhập tên vai trò!" }]}
          >
            <Input placeholder="Admin, Editor, Viewer..." />
          </Form.Item>

          <Form.Item
            label="Quyền chức năng"
            name="permissions"
            valuePropName="checked"
            initialValue={[]}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              {renderPermissionCheckboxes()}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
