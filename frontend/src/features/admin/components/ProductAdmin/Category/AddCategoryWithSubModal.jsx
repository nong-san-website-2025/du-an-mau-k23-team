import { Modal, Form, Input, Select, Button, Space, message } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const CategoryWithSubModal = ({ visible, onClose, onSuccess, category }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      // Edit: set category và subcategories vào form
      form.setFieldsValue({
        name: category.name,
        key: category.key,
        status: category.status,
        subcategories: category.subcategories || [],
      });
    } else {
      form.resetFields();
    }
  }, [category]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (category) {
        // Chỉnh sửa category
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/products/categories/${category.id}/`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success("Cập nhật danh mục thành công");
      } else {
        // Tạo mới
        await axios.post(
          `${process.env.REACT_APP_API_URL}/products/categories/`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success("Thêm danh mục và subcategory thành công");
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={category ? "Chỉnh sửa danh mục" : "Thêm danh mục và danh mục con"}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Tên danh mục"
          name="name"
          rules={[{ required: true, message: "Nhập tên danh mục" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Key"
          name="key"
          rules={[{ required: true, message: "Nhập key duy nhất" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" initialValue="active">
          <Select>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Ngưng</Option>
          </Select>
        </Form.Item>

        {/* Dynamic subcategories */}
        <Form.List name="subcategories">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "name"]}
                    rules={[{ required: true, message: "Nhập tên subcategory" }]}
                  >
                    <Input placeholder="Tên danh mục con" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "status"]}
                    initialValue="active"
                  >
                    <Select style={{ width: 120 }}>
                      <Option value="active">Hoạt động</Option>
                      <Option value="inactive">Ngưng</Option>
                    </Select>
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm danh mục con
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default CategoryWithSubModal;
