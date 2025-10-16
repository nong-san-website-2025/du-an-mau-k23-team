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

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

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
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  // Lấy danh mục + sub
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

  // Lấy danh sách sản phẩm + map category/subcategory name
  const fetchProducts = async (status = "", keyword = "") => {
    setLoading(true);
    try {
      const res = await api.get("/sellers/productseller/", {
        headers: getAuthHeaders(),
        params: { status: status || undefined, search: keyword || undefined },
      });
      const productsData = res.data.results || res.data;

      // Map category_name / subcategory_name
      const mappedProducts = productsData.map((p) => {
        let categoryName = "";
        let subcategoryName = "";
        const cat = categories.find((c) =>
          c.subcategories.some((s) => s.id === p.subcategory)
        );
        if (cat) {
          categoryName = cat.name;
          const sub = cat.subcategories.find((s) => s.id === p.subcategory);
          subcategoryName = sub ? sub.name : "";
        }
        return {
          ...p,
          category_name: categoryName,
          subcategory_name: subcategoryName,
        };
      });

      setProducts(mappedProducts);
    } catch (err) {
      console.error("fetchProducts error:", err?.response?.data || err);
      message.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Đảm bảo fetch categories trước khi fetch products
    const init = async () => {
      await fetchCategories();
    };
    init();
  }, []);

  useEffect(() => {
    if (categories.length) {
      fetchProducts(statusFilter, searchTerm);
    }
  }, [categories]);

  const openModal = (product = null) => {
    setEditingProduct(product);

    if (product) {
      const category = categories.find((cat) =>
        cat.subcategories.some((sub) => sub.id === product.subcategory)
      );

      let imageList = [];
      if (product.image) {
        imageList = [
          { uid: "-1", name: "image.png", status: "done", url: product.image },
        ];
      }

      if (category) {
        setSubcategories(category.subcategories);
        form.setFieldsValue({
          ...product,
          category: category.id,
          image: imageList,
        });
      } else {
        form.setFieldsValue({ ...product, image: imageList });
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        stock: 0,
        availability_status: "available",
        image: [],
      });
      setSubcategories([]);
    }

    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      [
        "availability_status",
        "season_start",
        "season_end",
        "estimated_quantity",
      ].forEach((key) => {
        if (values[key] !== undefined && values[key] !== null)
          formData.append(key, values[key]);
      });
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (
            key === "image" &&
            Array.isArray(values[key]) &&
            values[key][0]?.originFileObj
          ) {
            formData.append("image", values[key][0].originFileObj);
          } else if (key !== "seller" && key !== "category") {
            formData.append(key, values[key]);
          }
        }
      });
      if (!editingProduct) formData.append("status", "pending");

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
      message.error("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}/`, { headers: getAuthHeaders() });
      message.success("Xóa sản phẩm thành công");
      fetchProducts(statusFilter, searchTerm);
    } catch (err) {
      console.error("delete product error:", err?.response?.data || err);
      message.error("Không thể xóa sản phẩm");
    }
  };

  const handleToggleHide = async (product) => {
    try {
      await api.post(
        `/products/${product.id}/toggle-hide/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(
        product.is_hidden ? "Đã hiện sản phẩm" : "Đã ẩn sản phẩm"
      );
      fetchProducts(statusFilter, searchTerm);
    } catch (err) {
      console.error("toggle hide error:", err?.response?.data || err);
      message.error("Không thể thay đổi trạng thái ẩn/hiện");
    }
  };

  const handleSelfReject = async (product) => {
    try {
      await api.post(
        `/products/${product.id}/self-reject/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success("Đã chuyển sản phẩm sang trạng thái tự từ chối");
      fetchProducts(statusFilter, searchTerm);
    } catch (err) {
      console.error("self reject error:", err?.response?.data || err);
      message.error("Không thể tự từ chối sản phẩm");
    }
  };

  return (
    <div style={{ padding: 20, background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: 16 }}>Quản lý sản phẩm</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Button type="primary" onClick={() => openModal()}>
          Thêm sản phẩm
        </Button>

        <Search
          placeholder="Tìm sản phẩm theo tên hoặc mã"
          allowClear
          onSearch={(value) => {
            setSearchTerm(value);
            fetchProducts(statusFilter, value);
          }}
          style={{ width: 300 }}
        />

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
        onToggleHide={handleToggleHide}
        onSelfReject={handleSelfReject}
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
          initialValues={{ stock: 0, availability_status: "available" }}
        >
          {/* Form fields như tên, giá, danh mục, danh mục con, stock, image */}
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
                  placeholder="Chọn danh mục con"
                  disabled={!subcategories.length}
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
                getValueFromEvent={(e) => {
                  if (!e) return [];
                  if (Array.isArray(e)) return e;
                  return e.fileList || [];
                }}
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

          {/* Trạng thái hàng hóa */}
          <Form.Item
            name="availability_status"
            label="Trạng thái hàng hóa"
            rules={[{ required: true, message: "Chọn trạng thái" }]}
          >
            <Select
              onChange={(value) => {
                if (value === "available") {
                  form.setFieldsValue({
                    season_start: null,
                    season_end: null,
                    estimated_quantity: null,
                  });
                }
              }}
            >
              <Select.Option value="available">Có sẵn</Select.Option>
              <Select.Option value="coming_soon">Sắp có</Select.Option>
            </Select>
          </Form.Item>

          {/* ✅ Dùng shouldUpdate để form tự re-render khi availability_status đổi */}
          <Form.Item
            shouldUpdate={(prev, cur) =>
              prev.availability_status !== cur.availability_status
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("availability_status") === "coming_soon" && (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="season_start"
                        label="Ngày bắt đầu mùa vụ"
                        rules={[
                          { required: true, message: "Chọn ngày bắt đầu" },
                        ]}
                      >
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="season_end"
                        label="Ngày kết thúc mùa vụ"
                        rules={[
                          { required: true, message: "Chọn ngày kết thúc" },
                        ]}
                      >
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="estimated_quantity"
                    label="Ước lượng sản lượng"
                    rules={[
                      { required: true, message: "Nhập sản lượng dự kiến" },
                    ]}
                  >
                    <Input type="number" min={0} />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

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
