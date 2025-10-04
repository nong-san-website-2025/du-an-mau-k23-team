// components/flashsale/FlashSaleForm.jsx
import React from "react";
import {
  Form,
  Input,
  DatePicker,
  Switch,
  Row,
  Col,
  message,
  Card,
  Select,
  Divider,
  Spin,
  Empty,
  Pagination,
} from "antd";
import moment from "moment";
import { getProducts } from "../../services/products";
import { CheckOutlined } from "@ant-design/icons";
import { intcomma } from "./../../../../utils/format";

const { Option } = Select;
const { RangePicker } = DatePicker;

const ProductGrid = ({ products, selectedIds, onToggle }) => {
  if (products.length === 0) {
    return <Empty description="Không có sản phẩm nào" />;
  }

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}
    >
      {products.map((product) => (
        <Card
          key={product.id}
          hoverable
          style={{
            width: 200,
            cursor: "pointer",
            borderColor: selectedIds.includes(product.id)
              ? "#1890ff"
              : "#f0f0f0",
            position: "relative",
          }}
          onClick={() => onToggle(product.id)}
          cover={
            product.image ? (
              <img
                alt={product.name}
                src={
                  product.image && product.image.startsWith("/")
                    ? `http://localhost:8000${product.image}`
                    : product.image?.startsWith("http")
                      ? product.image
                      : "https://via.placeholder.com/400x300?text=No+Image"
                }
                style={{ height: 160, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  height: 140,
                  backgroundColor: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Không có ảnh
              </div>
            )
          }
        >
          <div style={{ minHeight: 60 }}>
            <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 4 }}>
              {product.name.length > 30
                ? product.name.slice(0, 30) + "..."
                : product.name}
            </div>
            <div style={{ color: "#ff4d4f", fontWeight: "bold" }}>
              {intcomma(product.price)}đ
            </div>
            <div style={{ color: "#0008fbff", fontWeight: "normal" }}>
              SL: {product.stock.toLocaleString()}
            </div>
          </div>
          {selectedIds.includes(product.id) && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#1890ff",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckOutlined style={{ color: "white", fontSize: 14 }} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

const FlashSaleForm = ({ form, isEdit = false }) => {
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const selectedProductIds = Form.useWatch("products", form) || [];

  // Lọc theo danh mục
  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category?.id === selectedCategory);
  }, [products, selectedCategory]);

  // Phân trang
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  // Tổng số trang
  const total = filteredProducts.length;

  // Trích xuất danh mục
  React.useEffect(() => {
    if (products.length > 0) {
      const catMap = new Map();
      products.forEach((p) => {
        if (p.category && p.category.id) {
          catMap.set(p.category.id, p.category.name);
        }
      });
      const cats = Array.from(catMap, ([id, name]) => ({ id, name }));
      setCategories(cats);
    }
  }, [products]);

  React.useEffect(() => {
    loadProducts();
  }, []);

  // Khi thay đổi danh mục, reset về trang 1
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      let productList = [];
      if (Array.isArray(data)) {
        productList = data;
      } else if (Array.isArray(data.results)) {
        productList = data.results;
      } else {
        message.error("Dữ liệu sản phẩm không hợp lệ");
      }
      setProducts(productList);
    } catch (err) {
      message.error("Không tải được danh sách sản phẩm");
      console.error("Lỗi API:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (id) => {
    const newSelected = [...selectedProductIds];
    const index = newSelected.indexOf(id);
    if (index >= 0) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(id);
    }
    form.setFieldsValue({ products: newSelected });
  };

  return (
    <Form form={form} layout="vertical" name="flashsale_form">
      {/* Bộ lọc danh mục */}
      <Form.Item label="Danh mục">
        <Select
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(1); // Reset trang khi đổi danh mục
          }}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả</Option>
          {categories.map((cat) => (
            <Option key={cat.id} value={cat.id}>
              {cat.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Ẩn input form */}
      <Form.Item
        name="products"
        style={{ display: "none" }}
        rules={[
          { required: true, message: "Vui lòng chọn ít nhất 1 sản phẩm!" },
        ]}
      >
        <Input />
      </Form.Item>

      {/* Danh sách sản phẩm */}
      <Spin spinning={loading}>
        <ProductGrid
          products={paginatedProducts}
          selectedIds={selectedProductIds}
          onToggle={toggleProduct}
        />
        {total > pageSize && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </Spin>

      <Divider />

      {/* Các form item cho sản phẩm đã chọn */}
      {selectedProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean)
        .map((product) => (
          <Card
            key={product.id}
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{product.name}</span>
                <div style={{ color: "#0008fbff", fontWeight: "normal" }}>
                  SL: {product.stock.toLocaleString()}
                </div>
                <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                  <span style={{ fontWeight: 400, color: "#000" }}>
                    Giá gốc:
                  </span>{" "}
                  {intcomma(product.price)}đ
                </span>
              </div>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={["flash_items", product.id, "flash_price"]}
                  label="Giá Flash Sale"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập giá Flash Sale!",
                    },
                    {
                      type: "number",
                      min: 1,
                      transform: (value) => (value ? Number(value) : null),
                      message: "Giá phải lớn hơn 0",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    addonAfter="đ"
                    placeholder="Nhập giá flash"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={["flash_items", product.id, "stock"]}
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
            </Row>
          </Card>
        ))}

      <Row gutter={16}>
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
