import React, { useState, useEffect } from "react";
import {
  Form, Input, DatePicker, Radio, Select, InputNumber, Row, Col, Button, Switch, message
} from "antd";
import moment from "moment";
import { getMyProductsForVoucher } from "../../../admin/services/promotionServices";

const { Option } = Select;

export default function PromotionForm({ onSubmit, onCancel, initialData, disabled = false }) {
  const [form] = Form.useForm();
  const [productScope, setProductScope] = useState(initialData?.product_scope || "ALL");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (productScope === "SPECIFIC") {
      setLoadingProducts(true);
      getMyProductsForVoucher()
        .then(setProducts)
        .catch(() => message.error("Lỗi khi tải danh sách sản phẩm!"))
        .finally(() => setLoadingProducts(false));
    }
  }, [productScope]);

  const onFinish = (values) => {
    const payload = {
      ...values,
      start_at: values.dateRange[0].toISOString(),
      end_at: values.dateRange[1].toISOString(),
      applicable_products: values.product_scope === "ALL" ? [] : values.applicable_products,
    };
    delete payload.dateRange;
    onSubmit(payload);
  };

  const initialValues = {
    active: true,
    ...initialData,
    dateRange: initialData ? [moment(initialData.start_at), moment(initialData.end_at)] : undefined,
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues}
      disabled={disabled}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="title" label="Tên chương trình" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="code" label="Mã khuyến mãi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="discount_amount" label="Số tiền giảm (VND)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="min_order_value" label="Giá trị đơn hàng tối thiểu (VND)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="dateRange" label="Thời gian hiệu lực" rules={[{ required: true }]}>
        <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="product_scope" label="Phạm vi áp dụng">
            <Radio.Group onChange={(e) => setProductScope(e.target.value)}>
              <Radio value="ALL">Tất cả sản phẩm</Radio>
              <Radio value="SPECIFIC">Sản phẩm tùy chọn</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="active" label="Trạng thái hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      {productScope === "SPECIFIC" && (
        <Form.Item name="applicable_products" label="Sản phẩm áp dụng">
          <Select mode="multiple" allowClear loading={loadingProducts} placeholder="Tìm và chọn sản phẩm">
            {products.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {!disabled && (
        <Form.Item>
          <Button type="primary" htmlType="submit" >
            Lưu
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={onCancel}>
            Hủy
          </Button>
        </Form.Item>
      )}
    </Form>
  );
}