// components/flashsale/FlashSaleForm.jsx
import React from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Row,
  Col,
  message,
} from "antd";
import moment from "moment";
import { getProducts } from "../../services/flashsaleApi";

const { Option } = Select;
const { RangePicker } = DatePicker;

const FlashSaleForm = ({ form, isEdit = false }) => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      message.error("Không tải được danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" name="flashsale_form">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="product"
            label="Sản phẩm"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm!" }]}
          >
            <Select
              placeholder="Chọn sản phẩm"
              loading={loading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} - {p.price.toLocaleString()}đ
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="flash_price"
            label="Giá Flash Sale"
            rules={[
              { required: true, message: "Vui lòng nhập giá!" },
              {
                type: "number",
                min: 1,
                transform: (value) => (value ? Number(value) : null), // ✅ chuyển string → number
                message: "Giá phải lớn hơn 0",
              },
            ]}
          >
            <Input type="number" addonAfter="đ" placeholder="Nhập giá flash" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="stock"
            label="Số lượng"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng!" },
              {
                type: "number",
                min: 1,
                transform: (value) => (value ? Number(value) : null),
                message: "Số lượng tối thiểu là 1",
              },
            ]}
          >
            <Input type="number" placeholder="Nhập số lượng giới hạn" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="time_range"
        label="Thời gian Flash Sale"
        rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
      >
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          placeholder={["Bắt đầu", "Kết thúc"]}
        />
      </Form.Item>
    </Form>
  );
};

export default FlashSaleForm;
