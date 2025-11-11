// src/components/MarketingAdmin/AdSlotManager.jsx
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import API from "../../../login_register/services/api";

const AdSlotManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await API.get("/marketing/slots/");
      setSlots(res.data);
    } catch {
      message.error("Không thể tải danh sách slot");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (editingSlot) {
        await API.put(`/marketing/slots/${editingSlot.id}/`, values);
        message.success("Cập nhật slot thành công!");
      } else {
        await API.post("/marketing/slots/", values);
        message.success("Tạo slot mới thành công!");
      }
      setShowForm(false);
      setEditingSlot(null);
      fetchSlots();
    } catch {
      message.error("Không thể lưu slot");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/marketing/slots/${id}/`);
      message.success("Xóa slot thành công!");
      fetchSlots();
    } catch {
      message.error("Không thể xóa slot");
    }
  };

  const columns = [
    {
      title: "Tên vị trí",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Mã code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Số banner tối đa",
      dataIndex: "max_banners",
      key: "max_banners",
      align: "center",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => {
              setEditingSlot(record);
              form.setFieldsValue(record);
              setShowForm(true);
            }}
          />
          <Popconfirm
            title="Xóa vị trí này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => {
          form.resetFields();
          setEditingSlot(null);
          setShowForm(true);
        }}
      >
        Thêm Slot Mới
      </Button>

      <Table
        columns={columns}
        dataSource={slots}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title={editingSlot ? "Chỉnh sửa Slot" : "Tạo Slot Mới"}
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            label="Tên hiển thị"
            name="name"
            rules={[{ required: true, message: "Nhập tên hiển thị" }]}
          >
            <Input placeholder="VD: Banner giữa danh mục" />
          </Form.Item>

          <Form.Item
            label="Mã code"
            name="code"
            rules={[{ required: true, message: "Nhập mã định danh" }]}
          >
            <Input placeholder="VD: homepage_between_categories" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả khu vực hiển thị" />
          </Form.Item>

          <Form.Item
            label="Số lượng banner tối đa"
            name="max_banners"
            initialValue={1}
          >
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            {editingSlot ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default AdSlotManager;
