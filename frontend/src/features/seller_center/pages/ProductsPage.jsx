import React, { useEffect, useMemo, useState } from "react";
import {
  message, Modal, Upload, Typography, Card,
  Input, Tabs, Button, Divider, Select
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DropboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  StarOutlined,
  DeleteOutlined,
  StarFilled,
  ImportOutlined,
  FileExcelOutlined
} from "@ant-design/icons";

import { productApi } from "../services/api/productApi";

// Import Components
import ProductTable from "../components/ProductSeller/ProductTable";
import ProductForm from "../components/ProductSeller/ProductForm";
import ProductDetailModal from "../components/ProductSeller/ProductDetailModal";
import ImportProductModal from "../components/ProductSeller/ImportProductModal";
// import StatsSection from "../../admin/components/common/StatsSection"; // (Tạm comment nếu chưa dùng)

import "../styles/OrderPage.css";

const { Title, Text } = Typography;

export default function ProductsPage() {
  // ==================== 1. STATE MANAGEMENT ====================

  const [rawProducts, setRawProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // -- Modal Visibilities --
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // -- Filter & Search --
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [importRequestProducts, setImportRequestProducts] = useState([]);

  // -- Detail & Gallery --
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [galleryFileList, setGalleryFileList] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // ==================== 2. API FETCHING ====================

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, importRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getSellerProducts(),
        productApi.getImportRequestProducts().catch(() => ({ data: [] })),
      ]);

      const categoriesData = catRes.data.results || catRes.data || [];
      const productsData = prodRes.data.results || prodRes.data || [];
      const importData = importRes.data || [];

      // Map Category Name vào Product (Tối ưu logic tìm kiếm)
      const mapped = productsData.map((p) => {
        let catName = "Khác";
        let subName = "Khác";

        // Tìm category cha chứa subcategory id của sản phẩm
        if (p.subcategory) {
          const cat = categoriesData.find((c) =>
            c.subcategories?.some((s) => s.id === p.subcategory)
          );
          if (cat) {
            catName = cat.name;
            const sub = cat.subcategories.find((s) => s.id === p.subcategory);
            if (sub) subName = sub.name;
          }
        }
        
        return {
          ...p,
          category_name: catName,
          subcategory_name: subName,
        };
      });

      // Sort: Mới nhất lên đầu
      const sorted = mapped.sort((a, b) => b.id - a.id);

      setCategories(categoriesData);
      setRawProducts(sorted);
      setImportRequestProducts(importData);
    } catch (err) {
      message.error("Không thể tải dữ liệu sản phẩm");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==================== 3. FILTER ENGINE ====================

  useEffect(() => {
    let result = [...rawProducts];

    // 1. Filter by Search
    if (searchTerm) {
      const lowerKey = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerKey) ||
          String(p.id).includes(lowerKey) ||
          (p.category_name && p.category_name.toLowerCase().includes(lowerKey))
      );
    }

    // 1.1 Filter by Category (parent category)
    if (selectedCategoryId) {
      const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
      const subIds = (cat?.subcategories || []).map((s) => s.id);
      result = result.filter((p) => !subIds.length ? false : subIds.includes(p.subcategory));
    }

    // 2. Filter by Tab
    if (activeTab !== "all") {
      switch (activeTab) {
        case "pending":
          result = result.filter((p) => p.status === "pending" || p.status === "pending_update");
          break;
        case "approved":
          result = result.filter((p) => p.status === "approved");
          break;
        case "rejected":
          result = result.filter((p) => ["rejected", "self_rejected", "banned"].includes(p.status));
          break;
        case "out_of_stock":
          result = result.filter((p) => p.stock <= 0);
          break;
        case "import_request":
          result = importRequestProducts; // Lấy từ nguồn riêng
          // Apply search lại cho tab này vì nguồn dữ liệu khác
          if (searchTerm) {
            const lowerKey = searchTerm.toLowerCase();
            result = result.filter(
               (p) => p.name.toLowerCase().includes(lowerKey) || String(p.id).includes(lowerKey)
            );
          }
          break;
        default:
          break;
      }
    }
    setFilteredProducts(result);
  }, [rawProducts, searchTerm, selectedCategoryId, activeTab, importRequestProducts]);

  // ==================== 4. STATS & CONFIG ====================

  const statsItems = useMemo(() => {
    const total = rawProducts.length;
    const approved = rawProducts.filter((p) => p.status === "approved").length;
    const pending = rawProducts.filter((p) => ["pending", "pending_update"].includes(p.status)).length;
    const outOfStock = rawProducts.filter((p) => p.stock <= 0).length;
    const importRequest = importRequestProducts.length;

    return [
        { value: total },      // 0: All
        { value: approved },   // 1: Selling
        { value: pending },    // 2: Pending
        { value: outOfStock }, // 3: Out of stock
        { value: importRequest } // 4: Request
    ];
  }, [rawProducts, importRequestProducts]);

  const tabItems = [
    { key: "all", label: `Tất cả (${statsItems[0].value})` },
    { key: "approved", label: `Đang bán (${statsItems[1].value})`, icon: <CheckCircleOutlined /> },
    { key: "pending", label: `Chờ duyệt (${statsItems[2].value})`, icon: <ClockCircleOutlined /> },
    { key: "out_of_stock", label: `Hết hàng (${statsItems[3].value})`, icon: <StopOutlined /> },
    { key: "import_request", label: `Yêu cầu nhập (${statsItems[4].value})`, icon: <ImportOutlined /> },
    { key: "rejected", label: "Đã huỷ / Từ chối" },
  ];

  const getStatusConfig = (status) =>
    ({
      pending: { text: "Chờ duyệt", color: "gold" },
      approved: { text: "Đã duyệt", color: "green" },
      rejected: { text: "Bị từ chối", color: "red" },
      self_rejected: { text: "Đã hủy", color: "default" },
      banned: { text: "Đã khóa", color: "volcano" },
      pending_update: { text: "Chờ duyệt cập nhật", color: "orange" },
    })[status] || { text: status, color: "default" };

  const getAvailabilityConfig = (availability) =>
    ({
      available: { text: "Có sẵn", color: "blue" },
      coming_soon: { text: "Sắp có", color: "purple" },
      out_of_stock: { text: "Hết hàng", color: "red" },
    })[availability] || { text: availability, color: "default" };

  // ==================== 5. HANDLERS ====================

  const handleAddNew = () => { setEditingProduct(null); setModalVisible(true); };
  const handleEdit = (product) => { setEditingProduct(product); setModalVisible(true); };
  
  const handleImportSuccess = () => {
    fetchData(); // Refresh data sau khi import excel xong
  };

  const handleDelete = async (id) => {
    try {
      await productApi.deleteProduct(id);
      message.success("Đã xóa sản phẩm");
      setRawProducts(prev => prev.filter(i => i.id !== id));
    } catch {
      message.error("Lỗi khi xóa sản phẩm");
    }
  };

  const handleSelfReject = async (p) => {
    try {
      await productApi.selfReject(p.id);
      message.success("Đã hủy đăng bán");
      setRawProducts(prev => prev.map(i => i.id === p.id ? { ...i, status: 'self_rejected' } : i));
    } catch {
      message.error("Lỗi khi hủy đăng bán");
    }
  };

  const handleToggleHide = async (record) => {
    try {
      await productApi.toggleHide(record.id);
      const actionText = record.is_hidden ? "Đã hiển thị lại" : "Đã ẩn";
      message.success(`${actionText} sản phẩm: ${record.name}`);
      setRawProducts(prev => prev.map(p => p.id === record.id ? { ...p, is_hidden: !p.is_hidden } : p));
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi thay đổi trạng thái");
    }
  };

  // --- GALLERY LOGIC (QUAN TRỌNG) ---
  const openGallery = (p) => {
    setGalleryProduct(p);
    
    // 1. Lấy ảnh từ mảng images (Gallery)
    let existing = p.images?.map(i => ({
      uid: String(i.id),
      url: i.image,
      status: 'done',
      name: `Image-${i.id}`,
      is_primary: i.is_primary
    })) || [];

    // 2. [FIX QUAN TRỌNG] Nếu Gallery rỗng nhưng có ảnh đại diện ở root (p.image)
    // Hiển thị nó ra để user biết là có ảnh.
    // Đặt UID đặc biệt để biết đây là ảnh từ root (không xóa được qua API deleteProductImage)
    if (existing.length === 0 && p.image) {
        existing.push({
            uid: 'root-image-placeholder',
            url: p.image,
            status: 'done',
            name: 'Ảnh đại diện chính',
            is_primary: true
        });
    }

    setGalleryFileList(existing);
    setGalleryVisible(true);
  };

  const handleSetPrimaryImage = async (imgId) => {
    if (!galleryProduct) return;
    if (imgId === 'root-image-placeholder') return; // Không cần set lại nếu nó đã là chính

    try {
      await productApi.setPrimaryImage(galleryProduct.id, imgId);
      message.success("Đã thay đổi ảnh đại diện");
      fetchData();
      setGalleryVisible(false); // Đóng modal để refresh data cho chuẩn
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi đặt ảnh đại diện");
    }
  };

  const handleRemoveImage = async (file) => {
    // Case 1: Ảnh mới upload (chưa lưu server) -> Xóa khỏi state
    if (file.originFileObj) {
      setGalleryFileList(prev => prev.filter(item => item.uid !== file.uid));
      return;
    }

    // Case 2: Ảnh placeholder từ root (FIX)
    if (file.uid === 'root-image-placeholder') {
        message.warning("Đây là ảnh đại diện chính. Hãy thêm ảnh khác và đặt làm đại diện trước khi xóa ảnh này.");
        return;
    }

    // Case 3: Ảnh cũ trên server -> Gọi API xóa
    try {
      await productApi.deleteProductImage(file.uid);
      message.success("Đã xóa ảnh");
      setGalleryFileList(prev => prev.filter(item => item.uid !== file.uid));
      fetchData();
    } catch (err) {
      message.error("Không thể xóa ảnh này");
    }
  };

  const handleGalleryUpload = async () => {
    const newFiles = galleryFileList.filter((f) => f.originFileObj);
    if (newFiles.length === 0) return message.warning("Chưa có ảnh mới");

    const formData = new FormData();
    newFiles.forEach((file) => formData.append("images", file.originFileObj));

    setGalleryLoading(true);
    try {
      await productApi.uploadProductImages(galleryProduct.id, formData);
      message.success("Tải ảnh thành công");
      setGalleryVisible(false);
      fetchData();
      if (selectedProduct && selectedProduct.id === galleryProduct.id) {
        setIsDetailModalVisible(false); 
      }
    } catch (err) {
      message.error("Tải ảnh thất bại");
    } finally {
      setGalleryLoading(false);
    }
  };

  // --- SUBMIT FORM ---
  const handleSubmitForm = async (formData) => {
    try {
      if (!editingProduct) {
        formData.append("status", "pending");
        await productApi.createProduct(formData);
        message.success("Thêm mới thành công, chờ duyệt");
      } else {
        // Kiểm tra xem có update ảnh không để chọn Content-Type
        const hasImages = Array.from(formData.entries()).some(([k]) => k === "images" || k === "image");
        if (!hasImages) {
          // Nếu chỉ update text -> gửi JSON
          const plain = {};
          for (let [k, v] of formData.entries()) {
             if (k !== 'images' && k !== 'primary_image_index') plain[k] = v;
          }
          await productApi.updateProduct(editingProduct.id, plain, { headers: { "Content-Type": "application/json" } });
        } else {
          // Nếu có ảnh -> gửi FormData
          await productApi.updateProduct(editingProduct.id, formData);
        }
        message.success("Cập nhật thành công");
      }
      setModalVisible(false);
      fetchData();
    } catch {
      message.error("Lỗi khi lưu dữ liệu");
    }
  };

  // ==================== 6. RENDER ====================

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "0px" }}>
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        
        {/* Toolbar */}
        <div className="page-toolbar" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>DANH SÁCH SẢN PHẨM</Title>
          <div className="toolbar-actions" style={{ display: 'flex', gap: 10 }}>
            <Input
              placeholder="Tìm theo tên, mã SP..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            {/* Category Filter (đặt sau ô tìm kiếm) */}
            <Select
              showSearch
              allowClear
              placeholder="Lọc theo danh mục"
              style={{ width: 220 }}
              value={selectedCategoryId}
              onChange={(val) => setSelectedCategoryId(val || null)}
              optionFilterProp="label"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            <Button 
                icon={<ImportOutlined />} 
                onClick={() => setImportModalVisible(true)}
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
            >
                Nhập Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>Thêm sản phẩm</Button>
          </div>
        </div>

        {/* Filters */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" style={{ marginBottom: 16 }} />

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <ProductTable
            data={filteredProducts}
            loading={loading}
            onView={(record) => { setSelectedProduct(record); setIsDetailModalVisible(true); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelfReject={handleSelfReject}
            onToggleHide={handleToggleHide}
            onRow={(record) => ({
              onClick: () => { setSelectedProduct(record); setIsDetailModalVisible(true); },
            })}
          />
        </div>
      </Card>

      {/* --- MODALS --- */}
      <ProductDetailModal
        visible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        product={selectedProduct}
        onManageImages={openGallery}
        getStatusConfig={getStatusConfig}
        getAvailabilityConfig={getAvailabilityConfig}
      />

      <ProductForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmitForm}
        initialValues={editingProduct}
        categories={categories}
      />

      <ImportProductModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Gallery Modal */}
      <Modal
        open={galleryVisible}
        title={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><UploadOutlined /> Quản lý thư viện ảnh</div>}
        onCancel={() => setGalleryVisible(false)}
        footer={[
          <Button key="back" onClick={() => setGalleryVisible(false)}>Đóng</Button>,
          <Button
            key="submit" type="primary" onClick={handleGalleryUpload} loading={galleryLoading}
            disabled={!galleryFileList.some(f => f.originFileObj)}
          >
            Tải lên ảnh mới
          </Button>
        ]}
        width={800} centered
      >
        <div style={{ padding: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>Ảnh hiện tại</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            {galleryFileList.filter(f => !f.originFileObj).map(file => (
              <div key={file.uid} style={{ position: 'relative', width: 120, height: 120, border: file.is_primary ? '2px solid #faad14' : '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
                <img src={file.url} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', padding: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <Button type="text" size="small" icon={file.is_primary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined style={{ color: 'white' }} />} onClick={() => handleSetPrimaryImage(file.uid)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveImage(file)} />
                </div>
                {file.is_primary && <div style={{ position: 'absolute', top: 0, right: 0, background: '#faad14', color: 'white', fontSize: 10, padding: '2px 6px', borderBottomLeftRadius: 8 }}>Chính</div>}
              </div>
            ))}
            {galleryFileList.filter(f => !f.originFileObj).length === 0 && <Text type="secondary" italic>Chưa có ảnh trong thư viện.</Text>}
          </div>
          <Divider />
          <Title level={5} style={{ marginBottom: 16 }}>Thêm ảnh mới</Title>
          <Upload
            listType="picture-card"
            fileList={galleryFileList.filter(f => f.originFileObj)}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              const oldFiles = galleryFileList.filter(f => !f.originFileObj);
              if (oldFiles.length + fileList.length <= 6) setGalleryFileList([...oldFiles, ...fileList]);
              else message.warning("Tổng cộng tối đa 6 ảnh");
            }}
            onRemove={(file) => handleRemoveImage(file)}
            multiple
          >
            {galleryFileList.length < 6 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>Chọn ảnh</div></div>}
          </Upload>
        </div>
      </Modal>
    </div>
  );
}