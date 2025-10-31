// src/features/admin/promotions/components/PromotionModal.jsx
import React from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col } from "antd";
const { RangePicker } = DatePicker;

export default function PromotionModal({
  open,
  onCancel,
  onSave,
  detail,
  categories,
}) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSave(values);
  };

  return (
    <Modal
      title={detail ? "Cập nhật Voucher" : "Tạo Voucher"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      width={700}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" initialValues={detail || {}}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="code" label="Mã voucher" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="title" label="Tên voucher">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="categories" label="Áp dụng cho danh mục">
          <Select mode="multiple" allowClear placeholder="Chọn danh mục">
            {categories.map((cat) => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="voucherType" label="Loại voucher" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="normal">Thường</Select.Option>
                <Select.Option value="freeship">Miễn ship</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="discountType" label="Loại giảm">
              <Select>
                <Select.Option value="percent">%</Select.Option>
                <Select.Option value="amount">Số tiền</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="discountValue" label="Giá trị giảm">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="minOrderValue" label="Giá trị đơn tối thiểu">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="dateRange" label="Thời gian áp dụng">
          <RangePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
