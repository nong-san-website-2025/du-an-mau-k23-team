import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, Row, Col } from "antd";
import dayjs from "dayjs";
import axios from "axios";

const { Option } = Select;

const PromotionPopup = ({ visible, mode, promotion, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Khi mở popup, set giá trị vào form
  useEffect(() => {
    if (visible && promotion) {
      form.setFieldsValue({
        name: promotion.name || "",
        code: promotion.code || "",
        type: promotion.type || "",
        condition: promotion.condition || "",
        start: promotion.start ? dayjs(promotion.start) : null,
        end: promotion.end ? dayjs(promotion.end) : null,
        used: promotion.used || 0,
        total: promotion.total || 0,
        products: promotion.products || 0,
      });
    } else {
      form.resetFields();
    }
  }, [visible, promotion, form]);

  const handleSubmit = async (values) => {
    // sửa: thêm async
    setLoading(true);
    const payload = {
      ...values,
      start: values.start ? values.start.format("YYYY-MM-DD") : null,
      end: values.end ? values.end.format("YYYY-MM-DD") : null,
      id: promotion?.id,
    };
    await onSave(payload); // sửa: thêm await
    setLoading(false);
  };

  return (
    <Modal
      title={
        mode === "add" ? "Thêm khuyến mãi" : mode === "edit" ? "Sửa khuyến mãi" : "Xem chi tiết"
      }
      open={visible}
      onCancel={onClose}
      forceRender={true}
      width={720}
      bodyStyle={{ padding: 16 }}
      footer={
        mode === "view"
          ? [
              <Button key="close" onClick={onClose}>
                Đóng
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                Hủy
              </Button>,
              <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                Lưu
              </Button>,
            ]
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ gap: 8 }}>
        <Row gutter={[12, 8]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tên khuyến mãi"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên khuyến mãi" }]}
            >
              <Input placeholder="Tên khuyến mãi" disabled={mode === "view"} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Code"
              name="code"
              rules={[{ required: true, message: "Vui lòng nhập code" }]}
            >
              <Input placeholder="Mã khuyến mãi" disabled={mode === "view"} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Loại"
              name="type"
              rules={[{ required: true, message: "Vui lòng chọn loại khuyến mãi" }]}
            >
              <Select placeholder="Chọn loại" disabled={mode === "view"}>
                <Option value="Promotion">Giảm tiền</Option>
                <Option value="Flash Sale">Giảm %</Option>
                <Option value="Voucher">Freeship</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Điều kiện" name="condition">
              <Input placeholder="Điều kiện áp dụng" disabled={mode === "view"} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Ngày bắt đầu" name="start">
              <DatePicker style={{ width: "100%" }} disabled={mode === "view"} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Ngày kết thúc" name="end">
              <DatePicker style={{ width: "100%" }} disabled={mode === "view"} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Đã sử dụng" name="used">
              <InputNumber min={0} style={{ width: "100%" }} disabled={mode === "view"} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Tổng số" name="total">
              <InputNumber min={0} style={{ width: "100%" }} disabled={mode === "view"} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Số sản phẩm" name="products">
              <InputNumber min={0} style={{ width: "100%" }} disabled={mode === "view"} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default PromotionPopup;