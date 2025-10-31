import React, { useEffect, useState } from "react";
import { message, Modal, Descriptions, Image, Tag, Row, Col, Card, Spin } from "antd";
import axios from "axios";
import ProductBaseLayout from "../../seller_center/components/ProductSeller/ProductBaseLayout";
import ProductTable from "../../seller_center/components/ProductSeller/ProductTable";
import ProductForm from "../../seller_center/components/ProductSeller/ProductForm";
import "../../seller_center/styles/OrderPage.css";

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal chi tiết
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  // Helper: Map status
  const getStatusConfig = (status) => {
    const configs = {
      pending: { text: "Chờ duyệt", color: "gold" },
      approved: { text: "Đã duyệt", color: "green" },
      rejected: { text: "Bị từ chối", color: "red" },
      self_rejected: { text: "Tự từ chối", color: "volcano" },
    };
    return configs[status] || { text: status, color: "default" };
  };

  // Helper: Map availability
  const getAvailabilityConfig = (availability) => {
    const configs = {
      available: { text: "Có sẵn", color: "blue" },
      coming_soon: { text: "Sắp có", color: "purple" },
    };
    return configs[availability] || { text: availability, color: "default" };
  };

  // Fetch categories
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

  // Fetch products with mapping
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

      // Sort newest first
      const sortedProducts = mappedProducts.sort((a, b) => b.id - a.id);
      setProducts(sortedProducts);
      setFiltered(sortedProducts);
    } catch (err) {
      console.error("fetchProducts error:", err?.response?.data || err);
      message.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Search handler
  const handleSearch = (value) => {
    setSearchTerm(value);
    const lower = value.toLowerCase();
    let filtered = products;

    // Apply search filter
    if (value) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) || String(p.id).includes(lower)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFiltered(filtered);
  };

  // Status filter handler
  const handleFilterStatus = (status) => {
    setStatusFilter(status);
    let filtered = products;

    // Apply status filter
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) || String(p.id).includes(lower)
      );
    }

    setFiltered(filtered);
  };

  // Show product detail
  const showProductDetail = (product) => {
    setSelectedProduct(product);
    setIsDetailModalVisible(true);
  };

  // Open edit modal
  const openModal = (product = null) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  // Submit form
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

  // Delete product
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

  // Toggle hide
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

  // Self reject
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
    <>
      <ProductBaseLayout
        title="QUẢN LÝ SẢN PHẨM"
        loading={loading}
        data={filtered}
        columns={[]}
        onSearch={handleSearch}
        onFilterStatus={handleFilterStatus}
        onAddNew={() => openModal()}
        onRow={(record) => ({
          className: "order-item-row-hover",
          onClick: () => showProductDetail(record),
        })}
        customTable={
          <ProductTable
            data={filtered}
            onEdit={openModal}
            onDelete={handleDelete}
            onToggleHide={handleToggleHide}
            onSelfReject={handleSelfReject}
            onRow={(record) => ({
              // 👈 Thêm onRow vào đây
              className: "order-item-row-hover",
              onClick: () => showProductDetail(record),
            })}
          />
        }
      />

      {/* Modal chi tiết sản phẩm */}
      <Modal
        open={isDetailModalVisible}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: "#1d39c4" }}>
              #{selectedProduct?.id}
            </span>
            <Tag color="blue">Chi tiết sản phẩm</Tag>
          </div>
        }
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={900}
        centered
        bodyStyle={{ padding: "24px" }}
      >
        {selectedProduct ? (
          <div style={{ display: "flex", gap: 24, flexDirection: "row" }}>
            {/* Ảnh sản phẩm — lớn hơn, nổi bật */}
            <div style={{ flex: "0 0 320px" }}>
              {selectedProduct.image ? (
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  style={{
                    width: "100%",
                    height: 360,
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid #f0f0f0",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  preview={false}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 360,
                    backgroundColor: "#fafafa",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 64,
                    color: "#d9d9d9",
                    border: "1px dashed #e8e8e8",
                  }}
                >
                  📦
                </div>
              )}
            </div>

            {/* Thông tin chính — bố cục theo cột, dễ đọc */}
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#1f1f1f",
                }}
              >
                {selectedProduct.name}
              </h2>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{ fontSize: 20, fontWeight: 700, color: "#ff4d4f" }}
                  >
                    {Number(selectedProduct.price).toLocaleString()} ₫
                  </span>
                  {selectedProduct.stock === 0 && (
                    <Tag color="red" style={{ fontSize: 12, fontWeight: 500 }}>
                      Hết hàng
                    </Tag>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <Tag color="geekblue" style={{ fontWeight: 500 }}>
                    Danh mục: {selectedProduct.category_name || "—"}
                  </Tag>
                  <Tag color="purple" style={{ fontWeight: 500 }}>
                    Nhóm: {selectedProduct.subcategory_name || "—"}
                  </Tag>
                </div>
              </div>

              {/* Trạng thái & hành động */}
              <Card
                size="small"
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  border: "1px solid #f0f0f0",
                }}
              >
                <Descriptions column={1} size="small" bordered={false}>
                  <Descriptions.Item label="Trạng thái duyệt">
                    <Tag
                      color={getStatusConfig(selectedProduct.status).color}
                      style={{ fontWeight: 500 }}
                    >
                      {getStatusConfig(selectedProduct.status).text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tình trạng hàng">
                    <Tag
                      color={
                        getAvailabilityConfig(
                          selectedProduct.availability_status
                        ).color
                      }
                      style={{ fontWeight: 500 }}
                    >
                      {
                        getAvailabilityConfig(
                          selectedProduct.availability_status
                        ).text
                      }
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tồn kho">
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          selectedProduct.stock === 0 ? "#ff4d4f" : "#52c41a",
                      }}
                    >
                      {selectedProduct.stock} sản phẩm
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Mùa vụ (nếu có) */}
              {selectedProduct.availability_status === "coming_soon" && (
                <Card
                  title={
                    <span style={{ fontWeight: 600, color: "#722ed1" }}>
                      🌱 Thông tin mùa vụ
                    </span>
                  }
                  size="small"
                  style={{ marginBottom: 16, borderRadius: 12 }}
                >
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Bắt đầu">
                      {selectedProduct.season_start
                        ? new Date(
                            selectedProduct.season_start
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Kết thúc">
                      {selectedProduct.season_end
                        ? new Date(
                            selectedProduct.season_end
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Dự kiến">
                      {selectedProduct.estimated_quantity?.toLocaleString() ||
                        "0"}{" "}
                      sp
                    </Descriptions.Item>
                    <Descriptions.Item label="Đã đặt">
                      {selectedProduct.ordered_quantity?.toLocaleString() ||
                        "0"}{" "}
                      sp
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              {/* Mô tả */}
              {selectedProduct.description && (
                <Card
                  title={
                    <span style={{ fontWeight: 600 }}>📝 Mô tả sản phẩm</span>
                  }
                  size="small"
                  style={{ borderRadius: 12 }}
                >
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      color: "#434343",
                      maxHeight: 150,
                      overflowY: "auto",
                    }}
                  >
                    {selectedProduct.description}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin />
          </div>
        )}
      </Modal>

      {/* Modal thêm/sửa sản phẩm */}
      <ProductForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingProduct}
      />
    </>
  );
}
