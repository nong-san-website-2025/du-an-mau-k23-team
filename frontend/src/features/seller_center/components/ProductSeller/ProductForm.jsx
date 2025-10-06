import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";

const { Option } = Select;

const ProductForm = ({ visible, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [availability, setAvailability] = useState("available");

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setAvailability(initialValues.availability_status || "available");
    } else {
      form.resetFields();
      setAvailability("available");
    }
  }, [initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit(values);
        form.resetFields();
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Modal
      open={visible}
      title={initialValues ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      okText={initialValues ? "Cập nhật" : "Thêm"}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={handleOk}
    >
      <Form form={form} layout="vertical" name="productForm">
        {/* Tên sản phẩm */}
        <Form.Item
          label="Tên sản phẩm"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
        >
          <Input placeholder="Nhập tên sản phẩm" />
        </Form.Item>

        {/* Giá */}
        <Form.Item
          label="Giá (VNĐ)"
          name="price"
          rules={[{ required: true, message: "Vui lòng nhập giá" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Nhập giá"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        </Form.Item>

        {/* Tồn kho */}
        <Form.Item
          label="Tồn kho"
          name="stock"
          rules={[{ required: true, message: "Vui lòng nhập tồn kho" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Số lượng tồn"
          />
        </Form.Item>

        {/* Trạng thái hàng hóa */}
        <Form.Item
          label="Trạng thái hàng hóa"
          name="availability_status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          initialValue="available"
        >
          <Select onChange={(value) => setAvailability(value)}>
            <Option value="available">Có sẵn</Option>
            <Option value="coming_soon">Sắp có</Option>
          </Select>
        </Form.Item>

        {/* Nếu là "Sắp có" thì hiện mùa vụ */}
        {availability === "coming_soon" && (
          <>
            <Form.Item
              label="Thời gian bắt đầu mùa vụ"
              name="season_start"
              rules={[
                { required: true, message: "Vui lòng chọn ngày bắt đầu" },
              ]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Thời gian kết thúc mùa vụ"
              name="season_end"
              rules={[
                { required: true, message: "Vui lòng chọn ngày kết thúc" },
              ]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Sản lượng dự kiến"
              name="expected_quantity"
              rules={[
                { required: true, message: "Vui lòng nhập sản lượng dự kiến" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Nhập số lượng dự kiến"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ProductForm;
