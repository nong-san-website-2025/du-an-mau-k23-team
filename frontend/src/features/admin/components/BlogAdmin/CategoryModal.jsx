import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  List,
  Space,
  message,
  Divider,
  Row,
  Col,
  Popconfirm,
  Tag,
  Empty,
  Spin,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
} from "../../../blog/api/blogApi";

const CategoryModal = ({
  visible,
  onClose,
  categories,
  onCategoriesUpdate,
  loading,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleAddCategory = async (values) => {
    setSubmitting(true);
    try {
      await createCategory(values);
      message.success("Danh mục đã được thêm");
      form.resetFields();
      const { data } = await fetchCategories();
      onCategoriesUpdate(data);
    } catch {
      message.error("Không thể thêm danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setDeleting(id);
    try {
      await deleteCategory(id);
      message.success("Danh mục đã được xóa");
      const { data } = await fetchCategories();
      onCategoriesUpdate(data);
    } catch {
      message.error("Không thể xóa danh mục");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Modal
      title="Quản lý Danh mục"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <Row gutter={[24, 24]}>
        {/* Danh sách danh mục hiện tại */}
        <Col xs={24} sm={24} md={12}>
          <h3 style={{ marginBottom: 16 }}>Danh mục hiện tại</h3>
          <Spin spinning={loading}>
            {categories && categories.length > 0 ? (
              <List
                bordered
                dataSource={categories}
                renderItem={(category) => (
                  <List.Item
                    style={{ padding: "12px 16px" }}
                    key={category.id}
                    actions={[
                      <Popconfirm
                        title="Xóa danh mục"
                        description="Bạn có chắc muốn xóa danh mục này?"
                        onConfirm={() => handleDeleteCategory(category.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          loading={deleting === category.id}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag color="cyan" style={{ margin: 0 }}>
                        {category.name}
                      </Tag>
                      {category.description && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#999",
                            marginLeft: 8,
                          }}
                        >
                          {category.description}
                        </span>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Chưa có danh mục nào"
                style={{ marginTop: 40, marginBottom: 40 }}
              />
            )}
          </Spin>
        </Col>

        <Divider type="vertical" style={{ height: "auto", minHeight: 300 }} />

        {/* Form thêm danh mục mới */}
        <Col xs={24} sm={24} md={11}>
          <h3 style={{ marginBottom: 16 }}>Thêm danh mục mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddCategory}
            autoComplete="off"
          >
            <Form.Item
              label="Tên danh mục"
              name="name"
              rules={[
                { required: true, message: "Vui lòng nhập tên danh mục" },
              ]}
            >
              <Input placeholder="Nhập tên danh mục" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea
                placeholder="Nhập mô tả danh mục (tùy chọn)"
                rows={3}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
                icon={<PlusOutlined />}
              >
                Thêm danh mục
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
};

export default CategoryModal;
