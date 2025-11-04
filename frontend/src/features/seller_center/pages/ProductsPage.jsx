import React, { useEffect, useMemo, useState } from "react";
import { message, Modal, Spin, Upload, Typography } from "antd";

import { debounce } from "lodash";
import { productApi } from "../services/api/productApi";
import ProductBaseLayout from "../../seller_center/components/ProductSeller/ProductBaseLayout";
import ProductTable from "../../seller_center/components/ProductSeller/ProductTable";
import ProductForm from "../../seller_center/components/ProductSeller/ProductForm";
import ProductDetailModal from "../../seller_center/components/ProductSeller/ProductDetailModal";
import "../../seller_center/styles/OrderPage.css";
import { UploadOutlined } from "@ant-design/icons";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [galleryFileList, setGalleryFileList] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // 👉 Hàm map màu và text trạng thái
  const getStatusConfig = (status) =>
    ({
      pending: { text: "Chờ duyệt", color: "gold" },
      approved: { text: "Đã duyệt", color: "green" },
      rejected: { text: "Bị từ chối", color: "red" },
      self_rejected: { text: "Tự từ chối", color: "volcano" },
    })[status] || { text: status, color: "default" };

  const getAvailabilityConfig = (availability) =>
    ({
      available: { text: "Có sẵn", color: "blue" },
      coming_soon: { text: "Sắp có", color: "purple" },
    })[availability] || { text: availability, color: "default" };

  // 🔹 Fetch dữ liệu sản phẩm & danh mục
  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getSellerProducts({
          status: statusFilter || undefined,
          search: searchTerm || undefined,
        }),
      ]);

      const categoriesData = catRes.data.results || catRes.data;
      const productsData = prodRes.data.results || prodRes.data;

      const mapped = productsData.map((p) => {
        const cat = categoriesData.find((c) =>
          c.subcategories.some((s) => s.id === p.subcategory)
        );
        const sub = cat?.subcategories.find((s) => s.id === p.subcategory);
        return {
          ...p,
          category_name: cat?.name || "",
          subcategory_name: sub?.name || "",
        };
      });

      setCategories(categoriesData);
      setProducts(mapped.sort((a, b) => b.id - a.id));
      setFiltered(mapped);
    } catch (err) {
      message.error("Không thể tải dữ liệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchTerm]);

  // 🔎 Lọc theo từ khóa + trạng thái
  const applyFilters = (products, keyword, status) =>
    products.filter((p) => {
      const matchesKeyword = keyword
        ? p.name?.toLowerCase().includes(keyword.toLowerCase()) ||
          String(p.id).includes(keyword)
        : true;
      const matchesStatus = status ? p.status === status : true;
      return matchesKeyword && matchesStatus;
    });

  const handleSearch = (value) => {
    setSearchTerm(value);
    setFiltered(applyFilters(products, value, statusFilter));
  };

  const handleFilterStatus = (status) => {
    setStatusFilter(status);
    setFiltered(applyFilters(products, searchTerm, status));
  };

  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 400),
    [products, statusFilter]
  );

  // 🟩 Mở form thêm / sửa
  const openModal = (product = null) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  // 🟦 Submit form
  const handleSubmit = async (formData) => {
    try {
      if (!editingProduct) {
        // 🟢 Tạo mới: đảm bảo có ảnh
        formData.append("status", "pending");
        await productApi.createProduct(formData);
        message.success("Thêm sản phẩm thành công (chờ duyệt)");
      } else {
        // 🔵 Cập nhật: kiểm tra xem có ảnh mới không
        const hasNewImages = Array.from(formData.entries()).some(
          ([key]) => key === "images"
        );

        if (!hasNewImages) {
          // ❗ Không có ảnh mới → gửi JSON thay vì FormData (nếu backend hỗ trợ)
          // Nhưng nếu backend bắt buộc multipart, thì vẫn gửi FormData không có images
          const plainData = {};
          for (let [key, value] of formData.entries()) {
            if (key !== "images" && key !== "primary_image_index") {
              plainData[key] = value;
            }
          }

          // 👇 Gửi JSON nếu API hỗ trợ PATCH/PUT với JSON
          await productApi.updateProduct(editingProduct.id, plainData, {
            headers: {
              "Content-Type": "application/json",
            },
          });
        } else {
          // Có ảnh mới → gửi FormData như bình thường
          await productApi.updateProduct(editingProduct.id, formData);
        }

        message.success("Cập nhật thành công");
      }

      setModalVisible(false);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi lưu sản phẩm");
    }
  };

  const handleDelete = async (id) => {
    try {
      await productApi.deleteProduct(id);
      message.success("Xóa sản phẩm thành công");
      fetchData();
    } catch {
      message.error("Không thể xóa sản phẩm");
    }
  };

  const handleToggleHide = async (p) => {
    try {
      await productApi.toggleHide(p.id);
      message.success(p.is_hidden ? "Đã hiện sản phẩm" : "Đã ẩn sản phẩm");
      fetchData();
    } catch {
      message.error("Không thể thay đổi trạng thái ẩn/hiện");
    }
  };

  const handleSelfReject = async (p) => {
    try {
      await productApi.selfReject(p.id);
      message.success("Đã chuyển sang trạng thái tự từ chối");
      fetchData();
    } catch {
      message.error("Không thể tự từ chối sản phẩm");
    }
  };

  const openGallery = (product) => {
    setGalleryProduct(product);
    const existing =
      product.images?.map((img) => ({
        uid: String(img.id),
        name: `Ảnh ${img.id}`,
        status: "done",
        url: img.image,
        is_primary: img.is_primary,
      })) || [];
    setGalleryFileList(existing);
    setGalleryVisible(true);
  };

  const handleGalleryUpload = async () => {
    const newFiles = galleryFileList.filter((f) => f.originFileObj);
    if (newFiles.length === 0) {
      message.warning("Không có ảnh mới để tải lên");
      return;
    }

    const formData = new FormData();
    newFiles.forEach((file) => {
      formData.append("images", file.originFileObj);
    });

    setGalleryLoading(true);
    try {
      await productApi.uploadProductImages(galleryProduct.id, formData);
      message.success("Tải ảnh thành công");
      setGalleryVisible(false);
      fetchData(); // refresh để thấy ảnh mới
    } catch (err) {
      console.error(err);
      message.error("Tải ảnh thất bại");
    } finally {
      setGalleryLoading(false);
    }
  };

  return (
    <>
      <ProductBaseLayout
        title="QUẢN LÝ SẢN PHẨM"
        loading={loading}
        data={filtered}
        onSearch={debouncedSearch}
        onFilterStatus={handleFilterStatus}
        onAddNew={() => openModal()}
        customTable={
          <ProductTable
            data={filtered}
            onEdit={openModal}
            onDelete={handleDelete}
            onToggleHide={handleToggleHide}
            onSelfReject={handleSelfReject}
            onManageImages={openGallery}
            onRow={(record) => ({
              className: "order-item-row-hover",
              onClick: () => {
                setSelectedProduct(record);
                setIsDetailModalVisible(true);
              },
            })}
          />
        }
      />

      {/* Chi tiết sản phẩm */}
      <ProductDetailModal
        visible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        product={selectedProduct}
        getStatusConfig={getStatusConfig}
        getAvailabilityConfig={getAvailabilityConfig}
      />

      {/* Form thêm/sửa sản phẩm */}
      <ProductForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingProduct}
        categories={categories}
      />

      {/* Modal quản lý gallery */}
      <Modal
        open={galleryVisible}
        title="Quản lý ảnh sản phẩm"
        onCancel={() => setGalleryVisible(false)}
        onOk={handleGalleryUpload}
        confirmLoading={galleryLoading}
        okText="Tải lên ảnh mới"
        width={800}
      >
        <Upload
          listType="picture-card"
          fileList={galleryFileList}
          beforeUpload={() => false}
          onChange={({ fileList }) => {
            if (fileList.length <= 6) {
              setGalleryFileList(fileList);
            } else {
              message.warning("Tối đa 6 ảnh");
            }
          }}
          multiple
        >
          {galleryFileList.length < 6 && (
            <div>
              <UploadOutlined style={{ fontSize: 20 }} />
              <div style={{ marginTop: 8 }}>Tải ảnh</div>
            </div>
          )}
        </Upload>
        <Typography.Text
          type="secondary"
          style={{ display: "block", marginTop: 12 }}
        >
          • Ảnh cũ sẽ được giữ nguyên.
          <br />• Chỉ ảnh mới (có dấu +) sẽ được tải lên.
        </Typography.Text>
      </Modal>
    </>
  );
}
