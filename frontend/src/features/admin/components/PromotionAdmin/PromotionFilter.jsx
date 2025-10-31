// src/features/admin/promotions/components/PromotionFilter.jsx
import React from "react";
import { Form, Input, Select, Button, Row, Col, Space } from "antd";

export default function PromotionFilter({ onFilterChange, onClear }) {
  const [form] = Form.useForm();

  const handleFilter = () => {
    const values = form.getFieldsValue();
    const params = {};
    if (values.search) params.search = values.search;
    if (values.voucherType) params.voucher_type = values.voucherType;
    if (values.status)
      params.active = values.status === "active" ? true : false;
    onFilterChange(params);
  };

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
      <Row gutter={16} align="middle" style={{ width: "100%" }}>
        <Col>
          <Form.Item name="search" label="Tìm kiếm">
            <Input.Search
              placeholder="Tìm theo tên voucher"
              onSearch={handleFilter}
              style={{ width: 220 }}
            />
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="voucherType" label="Loại voucher">
            <Select placeholder="Chọn loại" style={{ width: 160 }}>
              <Select.Option value="normal">Voucher thường</Select.Option>
              <Select.Option value="freeship">Voucher miễn ship</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col>
          <Form.Item name="status" label="Trạng thái">
            <Select placeholder="Chọn" style={{ width: 140 }}>
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Tắt</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col>
          <Space>
            <Button type="primary" onClick={handleFilter}>
              Lọc
            </Button>
            <Button onClick={handleClear}>Xóa lọc</Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
}
