import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, Divider, Switch, Card, Tooltip } from "antd";
import dayjs from "dayjs";

import { ThunderboltOutlined } from "@ant-design/icons";
import { generateVoucherCode } from "../../../../utils/stringUtils"; // Import hàm vừa viết

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

export default function PromotionModal({ open, onCancel, onSave, detail, categories, loading }) {
  const [form] = Form.useForm();

  // UX: Lắng nghe sự thay đổi của form để render dynamic fields
  const voucherType = Form.useWatch("voucherType", form);
  const discountType = Form.useWatch("discountType", form);


  // Reset form hoặc fill data khi mở modal
  useEffect(() => {
    if (open) {
      if (detail) {
        // Transform API data -> Form data
        form.setFieldsValue({
          ...detail,
          dateRange: [
            detail.start_at ? dayjs(detail.start_at) : null,
            detail.end_at ? dayjs(detail.end_at) : null
          ],
          // Logic mapping ngược để hiển thị đúng loại giảm giá
          discountType: detail.discount_percent > 0 ? 'percent' : 'amount',
          discountValue: detail.discount_percent > 0
            ? detail.discount_percent
            : (detail.discount_amount || detail.freeship_amount),
          categories: detail.categories || [],
        });
      } else {
        form.resetFields();
        // Default values tốt cho UX
        form.setFieldsValue({
          voucherType: 'normal',
          discountType: 'amount',
          active: true
        });
      }
    }
  }, [open, detail, form]);


  const handleGenerateCode = () => {
    const randomCode = generateVoucherCode(6); // Tạo 6 ký tự
    form.setFieldValue('code', randomCode); // Fill vào form
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  return (
    <Modal
      title={detail ? "Cập nhật chương trình khuyến mãi" : "Tạo mới chương trình khuyến mãi"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={720}
      maskClosable={false}
      okText={detail ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy bỏ"
    >
      <Form form={form} layout="vertical">
        {/* Khối 1: Thông tin chung */}
        <Card size="small" title="Thông tin cơ bản" bordered={false} className="bg-gray-50 mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã Voucher"
                rules={[{ required: true, message: "Vui lòng nhập mã" }]}
                help="Mã viết liền không dấu, viết hoa (VD: SALE2025)"
              >
                <Input
                  placeholder="Nhập mã hoặc tạo tự động"
                  style={{ textTransform: 'uppercase' }}
                  maxLength={20}
                  // UI PRO: Thêm nút tạo mã ngay trong ô input
                  addonAfter={
                    <Tooltip title="Tạo mã ngẫu nhiên">
                      <ThunderboltOutlined
                        style={{ cursor: 'pointer', color: '#1677ff' }}
                        onClick={handleGenerateCode}
                      />
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tên chương trình"
                rules={[{ required: true, message: "Nhập tên để dễ quản lý" }]}
              >
                <Input placeholder="VD: Khuyến mãi mùa hè" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="categories" label="Áp dụng cho danh mục">
                <Select mode="multiple" allowClear placeholder="Chọn danh mục áp dụng (Để trống nếu áp dụng tất cả)">
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Khối 2: Cấu hình giảm giá - DYNAMIC UX */}
        <Card size="small" title="Cấu hình giảm giá" bordered={false} className="bg-gray-50 mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="voucherType" label="Loại Voucher">
                <Select>
                  <Option value="normal">Giảm giá sản phẩm</Option>
                  <Option value="freeship">Miễn phí vận chuyển</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Nếu là Freeship thì không cần chọn loại giảm (percent/amount) phức tạp */}
            {voucherType !== 'freeship' && (
              <Col span={8}>
                <Form.Item name="discountType" label="Hình thức giảm">
                  <Select>
                    <Option value="amount">Số tiền (VND)</Option>
                    <Option value="percent">Phần trăm (%)</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col span={8}>
              <Form.Item
                name="discountValue"
                label={voucherType === 'freeship' ? "Giá trị Freeship tối đa" : "Giá trị giảm"}
                rules={[{ required: true, message: "Nhập giá trị" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter={discountType === 'percent' && voucherType !== 'freeship' ? '%' : 'đ'}
                  max={discountType === 'percent' && voucherType !== 'freeship' ? 100 : undefined}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="minOrderValue" label="Đơn hàng tối thiểu">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Khối 3: Thời gian & Mô tả */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="dateRange"
              label="Thời gian hiệu lực"
              rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian" }]}
            >
              <RangePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder={['Bắt đầu', 'Kết thúc']}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Mô tả / Ghi chú nội bộ">
              <TextArea rows={2} placeholder="Ghi chú chi tiết về chiến dịch..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}