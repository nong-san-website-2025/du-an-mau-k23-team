import React, { useEffect, useState } from "react";
import {
  Button,
  message,
  Modal,
  Form,
  Input,
  Col,
  Row,
  Select,
  Upload,
} from "antd";
import axios from "axios";
import ProductTable from "../../seller_center/components/ProductSeller/ProductTable";
import { UploadOutlined } from "@ant-design/icons";

const { Search } = Input;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form] = Form.useForm();

  // state cho search & filter
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = async (status = "", keyword = "") => {
    setLoading(true);
    try {
      const res = await api.get("/sellers/productseller/", {
        headers: getAuthHeaders(),
        params: {
          status: status || undefined,
          search: keyword || undefined, // backend hỗ trợ query ?search=
        },
      });
      setProducts(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải sản phẩm");
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/products/categories/", {
        headers: getAuthHeaders(),
      });
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh mục");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openModal = (product = null) => {
    setEditingProduct(product);

    if (product) {
      // tìm category chứa subcategory
      const category = categories.find((cat) =>
        cat.subcategories.some((sub) => sub.id === product.subcategory)
      );

      if (category) {
        setSubcategories(category.subcategories);
        form.setFieldsValue({
          ...product,
          category: category.id,
        });
      } else {
        form.setFieldsValue(product);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ stock: 0 });
      setSubcategories([]);
    }

    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();

      // Append các trường cần thiết
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === "image" && Array.isArray(values[key])) {
            formData.append("image", values[key][0].originFileObj);
          }
          // bỏ qua seller & category
          else if (key !== "seller" && key !== "category") {
            formData.append(key, values[key]);
          }
        }
      });

      // nếu thêm mới thì set status = pending
      if (!editingProduct) {
        formData.append("status", "pending");
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}/`, formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Cập nhật sản phẩm thành công");
      } else {
        await api.post("/products/", formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Thêm sản phẩm thành công (chờ duyệt)");
      }

      setModalVisible(false);
      fetchProducts(statusFilter, searchTerm);
    } catch (err) {
      console.error(err.response?.data || err);
      message.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sellers/products/${id}/`, {
        headers: getAuthHeaders(),
      });
      message.success("Xóa sản phẩm thành công");
      fetchProducts(statusFilter, searchTerm);
    } catch (err) {
      console.error(err);
      message.error("Không thể xóa sản phẩm");
    }
  };

  return (
    <div style={{ padding: 20, background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: 16 }}>Quản lý sản phẩm</h2>

      {/* Thanh công cụ: Thêm sản phẩm + Tìm kiếm + Lọc */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Button type="primary" onClick={() => openModal()}>
          Thêm sản phẩm
        </Button>

        {/* Search bar */}
        <Search
          placeholder="Tìm sản phẩm theo tên hoặc mã"
          allowClear
          onSearch={(value) => {
            setSearchTerm(value);
            fetchProducts(statusFilter, value);
          }}
          style={{ width: 300 }}
        />

        {/* Lọc trạng thái */}
        <Select
          placeholder="Lọc trạng thái"
          style={{ width: 150 }}
          value={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value);
            fetchProducts(value, searchTerm);
          }}
        >
          <Select.Option value="">Tất cả</Select.Option>
          <Select.Option value="pending">Chờ duyệt</Select.Option>
          <Select.Option value="approved">Đã duyệt</Select.Option>
          <Select.Option value="rejected">Bị từ chối</Select.Option>
        </Select>
      </div>

      <ProductTable
        data={products}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      <Modal
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        style={{ top: 40 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ stock: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá"
                rules={[{ required: true, message: "Nhập giá sản phẩm" }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: "Chọn danh mục" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  onChange={(categoryId) => {
                    const selected = categories.find(
                      (c) => c.id === categoryId
                    );
                    setSubcategories(selected ? selected.subcategories : []);
                    form.setFieldsValue({ subcategory: undefined });
                  }}
                >
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="subcategory"
                label="Danh mục con"
                rules={[{ required: true, message: "Chọn danh mục con" }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn danh mục con"
                  optionFilterProp="children"
                  disabled={!subcategories.length}
                  filterOption={(input, option) =>
                    option?.children
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {subcategories.map((sub) => (
                    <Select.Option key={sub.id} value={sub.id}>
                      {sub.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="Số lượng"
                rules={[{ required: true, message: "Nhập số lượng" }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="image"
                label="Ảnh sản phẩm"
                valuePropName="fileList"
                getValueFromEvent={(e) => e.fileList}
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} placeholder="Nhập mô tả sản phẩm" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {editingProduct ? "Cập nhật" : "Thêm mới"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
