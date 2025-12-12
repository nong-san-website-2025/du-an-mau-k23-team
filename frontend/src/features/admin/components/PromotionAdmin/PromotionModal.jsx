import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, Switch, Card, Tooltip, Radio, Divider } from "antd";
import dayjs from "dayjs";
import { ThunderboltOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

// --- [FIX 1] ĐƯA HÀM TẠO MÃ VÀO ĐÂY ĐỂ TRÁNH LỖI IMPORT/CIRCULAR ---
const generateVoucherCode = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function PromotionModal({ open, onCancel, onSave, detail, categories, loading }) {
  const [form] = Form.useForm();

  // Watch fields để xử lý logic hiển thị
  const voucherType = Form.useWatch("voucherType", form);
  const discountType = Form.useWatch("discountType", form);
  const applyType = Form.useWatch("applyType", form);

  useEffect(() => {
    if (open) {
      if (detail) {
        // --- [FIX 2] XỬ LÝ DATE RANGE AN TOÀN ---
        // Chỉ convert sang dayjs nếu có giá trị string hợp lệ
        const startDate = detail.start_at ? dayjs(detail.start_at) : null;
        const endDate = detail.end_at ? dayjs(detail.end_at) : null;

        form.setFieldsValue({
          ...detail,
          dateRange: (startDate && endDate) ? [startDate, endDate] : [],
          
          discountType: detail.discount_percent > 0 ? 'percent' : 'amount',
          discountValue: detail.discount_percent > 0 ? detail.discount_percent : (detail.discount_amount || detail.freeship_amount),
          
          // Logic mapping scope
          applyType: (detail.categories && detail.categories.length > 0) ? 'category' : 'all',
          categories: detail.categories || [],
          
          // Map loại voucher để hiển thị đúng dropdown
          voucherType: (detail.freeship_amount > 0 || detail.voucher_type === 'freeship') ? 'freeship' : 'normal',
          
          // Map số lượng (DB dùng total_quantity, Form dùng limit_usage)
          limit_usage: detail.total_quantity,
          limit_per_user: detail.per_user_quantity
        });
      } else {
        form.resetFields();
        // Default values chuẩn sàn TMĐT
        form.setFieldsValue({
          voucherType: 'normal',
          discountType: 'amount',
          applyType: 'all',
          active: true,
          limit_usage: 100, 
          limit_per_user: 1, 
          is_public: true, 
        });
      }
    }
  }, [open, detail, form]);

  // Handler tạo mã ngẫu nhiên
  const handleGenerateCode = () => {
    const randomCode = generateVoucherCode(10); // Tạo mã 10 ký tự
    form.setFieldValue('code', randomCode);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // [FIX 3] CHUẨN HÓA DỮ LIỆU TRƯỚC KHI GỬI RA NGOÀI (Cực quan trọng cho Freeship)
      const payload = {
          ...values,
          // Đảm bảo luôn có distribution_type là 'claim' để user nhận được
          distribution_type: 'claim', 
          
          // Đảm bảo số lượng luôn có giá trị (Map từ limit_usage -> total_quantity)
          total_quantity: values.limit_usage, 
          per_user_quantity: values.limit_per_user,
      };

      // Nếu là Freeship thì reset các trường không liên quan
      if (payload.voucherType === 'freeship') {
          payload.max_discount_amount = 0;
          payload.discountType = null; 
      }

      onSave(payload);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  return (
    <Modal
      title={detail ? "Cập nhật Voucher" : "Tạo Voucher mới"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={1000}
      maskClosable={false}
      okText="Lưu chương trình"
      cancelText="Hủy"
      bodyStyle={{ height: 600, overflowY: 'auto' }}
    >
      <Form form={form} layout="vertical">
        
        {/* KHỐI 1: THIẾT LẬP CƠ BẢN */}
        <Card size="small" title="1. Thông tin cơ bản" className="bg-gray-50 mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tên chương trình"
                rules={[{ required: true, message: "Bắt buộc nhập" }]}
              >
                <Input placeholder="VD: Sale 12.12 - Giảm giá sốc" maxLength={100} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã Voucher"
                rules={[
                    { required: true, message: "Bắt buộc nhập" },
                    { pattern: /^[A-Z0-9]+$/, message: "Chỉ chấp nhận chữ hoa và số (A-Z, 0-9)" }
                ]}
                normalize={(v) => v?.toUpperCase()}
              >
                <Input
                  placeholder="Nhập mã (tối đa 20 ký tự)"
                  maxLength={20}
                  addonAfter={
                    <Tooltip title="Tạo mã ngẫu nhiên">
                      <ThunderboltOutlined onClick={handleGenerateCode} style={{ cursor: 'pointer', color: '#1677ff' }} />
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Col>
            <Col span={24}>
               <Form.Item 
                  name="dateRange" 
                  label="Thời gian sử dụng mã" 
                  rules={[{ required: true, message: "Chọn thời gian hiệu lực" }]}
                >
                <RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* KHỐI 2: THIẾT LẬP GIẢM GIÁ */}
        <Card size="small" title="2. Thiết lập mức giảm" className="bg-gray-50 mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="voucherType" label="Loại Voucher">
                <Select>
                  <Option value="normal">Voucher thường</Option>
                  <Option value="freeship">Miễn phí vận chuyển</Option>
                </Select>
              </Form.Item>
            </Col>

            {voucherType !== 'freeship' && (
               <Col span={8}>
                <Form.Item name="discountType" label="Loại giảm giá">
                  <Select>
                    <Option value="amount">Theo số tiền (đ)</Option>
                    <Option value="percent">Theo phần trăm (%)</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col span={8}>
              <Form.Item
                name="discountValue"
                label={
                    voucherType === 'freeship' 
                    ? "Giá trị FreeShip tối đa" 
                    : (discountType === 'percent' ? "Mức giảm (%)" : "Số tiền giảm (đ)")
                }
                rules={[{ required: true, message: "Nhập giá trị" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  min={1}
                  max={discountType === 'percent' && voucherType !== 'freeship' ? 100 : undefined}
                  addonAfter={discountType === 'percent' && voucherType !== 'freeship' ? "%" : "đ"}
                />
              </Form.Item>
            </Col>

            {discountType === 'percent' && voucherType !== 'freeship' && (
              <Col span={12}>
                <Form.Item
                  name="max_discount_amount"
                  label="Mức giảm tối đa (Bắt buộc)"
                  rules={[{ required: true, message: "Hãy nhập trần giảm giá" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    addonAfter="đ"
                    placeholder="VD: 50,000"
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={discountType === 'percent' && voucherType !== 'freeship' ? 12 : 16}>
              <Form.Item name="minOrderValue" label="Giá trị đơn hàng tối thiểu">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                  placeholder="0 (Không yêu cầu)"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* KHỐI 3: GIỚI HẠN SỬ DỤNG (QUAN TRỌNG CHO VIỆC NHẬN VOUCHER) */}
        <Card size="small" title="3. Giới hạn sử dụng" className="bg-gray-50 mb-4">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item 
                        name="limit_usage" 
                        label="Tổng lượt sử dụng tối đa"
                        help="Tổng số lượng voucher phát hành (Ví dụ: 100)"
                        rules={[{ required: true, message: "Nhập tổng số lượng" }]}
                    >
                        <InputNumber style={{ width: "100%" }} min={1} placeholder="VD: 100" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item 
                        name="limit_per_user" 
                        label="Lượt dùng tối đa / Người mua"
                        rules={[{ required: true, message: "Nhập giới hạn user" }]}
                    >
                        <InputNumber style={{ width: "100%" }} min={1} placeholder="VD: 1" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>

        {/* KHỐI 4: PHẠM VI & HIỂN THỊ */}
        <Card size="small" title="4. Phạm vi áp dụng" className="bg-white">
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item name="applyType" label="Sản phẩm áp dụng">
                        <Radio.Group>
                            <Radio value="all">Toàn Shop</Radio>
                            <Radio value="category">Chọn Danh Mục</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>
                
                {applyType === 'category' && (
                    <Col span={24}>
                        <Form.Item 
                            name="categories" 
                            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                        >
                            <Select mode="multiple" placeholder="Chọn các danh mục được áp dụng">
                                {categories.map((cat) => (
                                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                )}

                <Divider dashed />
                
                <Col span={12}>
                     <Form.Item name="is_public" label="Hiển thị công khai" valuePropName="checked" help="Nếu tắt, User phải nhập mã mới thấy">
                        <Switch checkedChildren="Có" unCheckedChildren="Không (Ẩn)" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
                    </Form.Item>
                </Col>
                
                 <Col span={24}>
                    <Form.Item name="description" label="Mô tả chi tiết">
                        <TextArea rows={2} placeholder="Mô tả điều kiện sử dụng (hiển thị cho user)..." />
                    </Form.Item>
                </Col>
            </Row>
        </Card>

      </Form>
    </Modal>
  );
}