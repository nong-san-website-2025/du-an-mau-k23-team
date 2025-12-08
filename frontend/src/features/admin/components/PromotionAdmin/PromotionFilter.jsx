// src/features/admin/promotions/components/PromotionFilter.jsx
import React from "react";
import { Form, Input, Select, Button, Row, Col, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined, FilterOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function PromotionFilter({ onFilterChange, onClear }) {
  const [form] = Form.useForm();

  // Hàm xử lý chung để gửi dữ liệu lọc ra ngoài
  const triggerFilter = () => {
    const values = form.getFieldsValue();
    const params = {};
    
    // Chỉ lấy các giá trị có dữ liệu (bỏ undefined/null/empty string)
    if (values.search?.trim()) params.search = values.search.trim();
    if (values.voucherType) params.voucher_type = values.voucherType;
    
    // Mapping value frontend -> backend
    if (values.status !== undefined) {
      params.active = values.status === 'active';
    }

    onFilterChange(params);
  };

  // UX: Dropdown thay đổi là gọi filter ngay (Tiết kiệm click)
  const handleSelectChange = () => {
    triggerFilter();
  };

  const handleReset = () => {
    form.resetFields();
    onClear();
  };

  return (
    <Form 
      form={form} 
      layout="vertical" // Dùng vertical label trên mobile, row trên desktop nhờ Col
      className="promotion-filter-form"
    >
      <Row gutter={[16, 16]} align="bottom">
        {/* 1. Tìm kiếm - Quan trọng nhất nên để đầu và rộng hơn */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="search" label="Từ khóa" style={{ marginBottom: 0 }}>
            <Input 
              placeholder="Tìm theo mã, tên voucher..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              onPressEnter={triggerFilter} // Enter là tìm ngay
            />
          </Form.Item>
        </Col>

        {/* 2. Loại Voucher */}
        <Col xs={12} sm={6} md={5} lg={4}>
          <Form.Item name="voucherType" label="Loại hình" style={{ marginBottom: 0 }}>
            <Select 
              placeholder="Tất cả" 
              allowClear 
              onChange={handleSelectChange}
            >
              <Option value="normal">Giảm giá</Option>
              <Option value="freeship">Freeship</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* 3. Trạng thái */}
        <Col xs={12} sm={6} md={5} lg={4}>
          <Form.Item name="status" label="Trạng thái" style={{ marginBottom: 0 }}>
            <Select 
              placeholder="Tất cả" 
              allowClear 
              onChange={handleSelectChange}
            >
              <Option value="active">Đang chạy</Option>
              <Option value="inactive">Đang tắt</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* 4. Action Buttons */}
        <Col xs={24} sm={24} md={6} lg={6} style={{ display: 'flex', gap: '8px' }}>
          <Button type="primary" icon={<SearchOutlined />} onClick={triggerFilter}>
            Tìm
          </Button>
          <Tooltip title="Đặt lại bộ lọc">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Xóa lọc
            </Button>
          </Tooltip>
        </Col>
      </Row>
    </Form>
  );
}