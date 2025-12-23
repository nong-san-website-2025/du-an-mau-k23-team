import React from "react";
import { Form, Input, Select, Button, Row, Col, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function PromotionFilter({ onFilterChange, onClear }) {
  const [form] = Form.useForm();
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;

  // Hàm kích hoạt bộ lọc
  const triggerFilter = () => {
    const values = form.getFieldsValue();
    const params = {};
    
    // 1. Từ khóa tìm kiếm
    if (values.search?.trim()) {
        params.search = values.search.trim();
    }
    
    // 2. [QUAN TRỌNG] Loại Voucher (Freeship / Normal)
    // Phải khớp với request.query_params.get("voucherType") trong views.py
    if (values.voucherType) {
        params.voucherType = values.voucherType; 
    }
    
    // 3. Trạng thái hoạt động
    if (values.status !== undefined) {
      params.active = values.status === 'active';
    }

    // Gửi params ra ngoài cho PromotionsPage gọi API
    onFilterChange(params);
  };

  // UX: Chọn dropdown là lọc ngay
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
      layout="vertical" 
      className="promotion-filter-form"
    >
      <Row gutter={[12, 12]} align="bottom">
        {/* Cột 1: Tìm kiếm */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item name="search" label="Từ khóa" style={{ marginBottom: 0 }}>
            <Input 
              placeholder="Mã hoặc tên voucher..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              size={isMobile ? 'small' : 'middle'}
              onPressEnter={triggerFilter} 
            />
          </Form.Item>
        </Col>

        {/* Cột 2: Loại Voucher - [CHỖ NÀY QUAN TRỌNG] */}
        <Col xs={12} sm={6} md={5} lg={4}>
          <Form.Item name="voucherType" label="Loại hình" style={{ marginBottom: 0 }}>
            <Select 
              placeholder="Tất cả" 
              allowClear 
              size={isMobile ? 'small' : 'middle'}
              onChange={handleSelectChange}
            >
              <Option value="normal">Voucher thường</Option>
              <Option value="freeship">Miễn phí vận chuyển</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Cột 3: Trạng thái */}
        <Col xs={12} sm={6} md={5} lg={4}>
          <Form.Item name="status" label="Trạng thái" style={{ marginBottom: 0 }}>
            <Select 
              placeholder="Tất cả" 
              allowClear 
              size={isMobile ? 'small' : 'middle'}
              onChange={handleSelectChange}
            >
              <Option value="active">Đang chạy</Option>
              <Option value="inactive">Đang tắt</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Cột 4: Nút bấm */}
        <Col xs={24} sm={24} md={6} lg={6} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button type="primary" icon={<SearchOutlined />} onClick={triggerFilter} size={isMobile ? 'small' : 'middle'} style={{ whiteSpace: 'nowrap' }}>
            Tìm
          </Button>
          <Tooltip title="Xóa bộ lọc">
            <Button icon={<ReloadOutlined />} onClick={handleReset} size={isMobile ? 'small' : 'middle'} style={{ whiteSpace: 'nowrap' }}>
              Xóa lọc
            </Button>
          </Tooltip>
        </Col>
      </Row>
    </Form>
  );
}