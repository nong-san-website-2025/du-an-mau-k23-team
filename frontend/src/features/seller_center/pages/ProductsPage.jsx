import React, { useEffect, useMemo, useState } from "react";
import {
  message,
  Modal,
  Upload,
  Typography,
  Card,
  Input,
  Tabs,
  Button,
  Divider,
  Space,
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
  ImportOutlined, // <--- 1. Import Icon Import
  FileExcelOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import { productApi } from "../services/api/productApi";

// Import Components
import ProductTable from "../components/ProductSeller/ProductTable";
import ProductForm from "../components/ProductSeller/ProductForm";
import ProductDetailModal from "../components/ProductSeller/ProductDetailModal";
import ImportProductModal from "../components/ProductSeller/ImportProductModal"; // <--- 2. Import Component Modal
import StatsSection from "../../admin/components/common/StatsSection";

import "../styles/OrderPage.css";

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function ProductsPage() {
  // ==================== 1. STATE MANAGEMENT ====================

  // Data States
  const [rawProducts, setRawProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // UI States
  const [loading, setLoading] = useState(false);

  // -- Modal Visibilities --
  const [modalVisible, setModalVisible] = useState(false); // Add/Edit Modal
  const [importModalVisible, setImportModalVisible] = useState(false); // <--- 3. State cho Import Modal

  const [editingProduct, setEditingProduct] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail & Gallery States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [galleryFileList, setGalleryFileList] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // ==================== 2. CONFIG & HELPERS ====================

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

  // ==================== 3. API FETCHING ====================

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getSellerProducts(),
      ]);

      const categoriesData = catRes.data.results || catRes.data || [];
      const productsData = prodRes.data.results || prodRes.data || [];

      // Map Category Name vào Product
      const mapped = productsData.map((p) => {
        const cat = categoriesData.find((c) =>
          c.subcategories?.some((s) => s.id === p.subcategory)
        );
        const sub = cat?.subcategories.find((s) => s.id === p.subcategory);
        return {
          ...p,
          category_name: cat?.name || "Khác",
          subcategory_name: sub?.name || "Khác",
        };
      });

      // Sort: Mới nhất lên đầu
      const sorted = mapped.sort((a, b) => b.id - a.id);

      setCategories(categoriesData);
      setRawProducts(sorted);
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

  // ==================== 4. FILTER ENGINE ====================

  useEffect(() => {
    let result = [...rawProducts];

    if (searchTerm) {
      const lowerKey = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerKey) ||
          String(p.id).includes(lowerKey) ||
          p.category_name.toLowerCase().includes(lowerKey)
      );
    }

    if (activeTab !== "all") {
      switch (activeTab) {
        case "pending":
          result = result.filter(
            (p) => p.status === "pending" || p.status === "pending_update"
          );
          break;
        case "approved":
          result = result.filter((p) => p.status === "approved");
          break;
        case "rejected":
          result = result.filter((p) =>
            ["rejected", "self_rejected", "banned"].includes(p.status)
          );
          break;
        case "out_of_stock":
          result = result.filter((p) => p.stock <= 0);
          break;
        default:
          break;
      }
    }
    setFilteredProducts(result);
  }, [rawProducts, searchTerm, activeTab]);

  // ==================== 5. STATS CALCULATION ====================

  const statsItems = useMemo(() => {
    const total = rawProducts.length;
    const approved = rawProducts.filter((p) => p.status === "approved").length;
    const pending = rawProducts.filter((p) =>
      ["pending", "pending_update"].includes(p.status)
    ).length;
    const outOfStock = rawProducts.filter((p) => p.stock <= 0).length;

    return [
      {
        title: "Tổng sản phẩm",
        value: total,
        icon: <DropboxOutlined />,
        color: "#1890ff",
      },
      {
        title: "Đang hoạt động",
        value: approved,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
      },
      {
        title: "Chờ phê duyệt",
        value: pending,
        icon: <ClockCircleOutlined />,
        color: "#faad14",
      },
      {
        title: "Hết hàng",
        value: outOfStock,
        icon: <StopOutlined />,
        color: "#ff4d4f",
      },
    ];
  }, [rawProducts]);

  // ==================== 6. HANDLERS ====================

  // --- CRUD Handlers ---
  const handleAddNew = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };
  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await productApi.deleteProduct(id);
      message.success("Đã xóa sản phẩm");
      setRawProducts((prev) => prev.filter((i) => i.id !== id));
    } catch {
      message.error("Lỗi khi xóa sản phẩm");
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;

    confirm({
      title: `Bạn có chắc muốn xóa ${selectedRowKeys.length} sản phẩm đã chọn?`,
      icon: <ExclamationCircleOutlined />,
      content:
        "Các sản phẩm này sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.",
      okText: "Xóa Vĩnh Viễn",
      okType: "danger",
      cancelText: "Hủy",
      async onOk() {
        setLoading(true);
        try {
          // Gọi API xóa cho từng ID trong danh sách đã chọn
          await Promise.all(
            selectedRowKeys.map((id) => productApi.deleteProduct(id))
          );
          message.success(
            `Đã xóa thành công ${selectedRowKeys.length} sản phẩm.`
          ); // Cập nhật lại danh sách sản phẩm (Loại bỏ các sản phẩm đã xóa)
          setRawProducts((prev) =>
            prev.filter((i) => !selectedRowKeys.includes(i.id))
          );
          setSelectedRowKeys([]); // Reset lựa chọn
        } catch (error) {
          message.error("Lỗi khi xóa hàng loạt. Vui lòng kiểm tra lại.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSelfReject = async (p) => {
    try {
      await productApi.selfReject(p.id);
      message.success("Đã hủy đăng bán");
      setRawProducts((prev) =>
        prev.map((i) => (i.id === p.id ? { ...i, status: "self_rejected" } : i))
      );
    } catch {
      message.error("Lỗi khi hủy đăng bán");
    }
  };

  const handleToggleHide = async (record) => {
    try {
      // Gọi API toggleHide đã khai báo trong productApi
      await productApi.toggleHide(record.id);

      const actionText = record.is_hidden ? "Đã hiển thị lại" : "Đã ẩn";
      message.success(`${actionText} sản phẩm: ${record.name}`);

      // Cập nhật state cục bộ để UI phản hồi nhanh (không cần gọi lại API list)
      setRawProducts((prev) =>
        prev.map((p) =>
          p.id === record.id ? { ...p, is_hidden: !p.is_hidden } : p
        )
      );
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi thay đổi trạng thái");
    }
  };
  // --- Import Handler ---
  const handleImportSuccess = () => {
    // <--- 4. Callback khi import xong
    fetchData(); // Refresh lại dữ liệu bảng
    // Modal sẽ tự đóng hoặc giữ lại tùy thuộc vào logic bên trong ImportProductModal,
    // nhưng ở đây ta chỉ cần refresh data.
  };

  // --- Image Gallery Logic ---
  const handleSetPrimaryImage = async (imgId) => {
    if (!galleryProduct) return;
    try {
      await productApi.setPrimaryImage(galleryProduct.id, imgId);
      message.success("Đã thay đổi ảnh đại diện");
      fetchData();
      setGalleryFileList((prev) =>
        prev.map((item) => ({
          ...item,
          is_primary: String(item.uid) === String(imgId),
        }))
      );
      if (selectedProduct && selectedProduct.id === galleryProduct.id) {
        const newPrimaryImg = galleryFileList.find(
          (i) => String(i.uid) === String(imgId)
        );
        if (newPrimaryImg)
          setSelectedProduct((prev) => ({ ...prev, image: newPrimaryImg.url }));
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi đặt ảnh đại diện");
    }
  };

  const handleRemoveImage = async (file) => {
    if (file.originFileObj) {
      setGalleryFileList((prev) =>
        prev.filter((item) => item.uid !== file.uid)
      );
      return;
    }
    try {
      await productApi.deleteProductImage(file.uid);
      message.success("Đã xóa ảnh");
      setGalleryFileList((prev) =>
        prev.filter((item) => item.uid !== file.uid)
      );
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
        setIsDetailModalVisible(false); // Close detail to refresh
      }
    } catch (err) {
      message.error("Tải ảnh thất bại");
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [activeTab]);

  const openGallery = (p) => {
    setGalleryProduct(p);
    const existing =
      p.images?.map((i) => ({
        uid: String(i.id),
        url: i.image,
        status: "done",
        name: `Image-${i.id}`,
        is_primary: i.is_primary,
      })) || [];
    setGalleryFileList(existing);
    setGalleryVisible(true);
  };

  // --- Submit Form ---
  const handleSubmitForm = async (formData) => {
    try {
      if (!formData.has("original_price")) {
        message.error("Lỗi: Giá gốc không được gửi từ form!");
        return;
      }
      if (!editingProduct) {
        formData.append("status", "pending");
        await productApi.createProduct(formData);
        message.success("Thêm mới thành công, chờ duyệt");
      } else {
        // Logic update (như cũ)
        const hasImages = Array.from(formData.entries()).some(
          ([k]) => k === "images"
        );
        if (!hasImages) {
          const plain = {};
          for (let [k, v] of formData.entries()) {
            if (k !== "images" && k !== "primary_image_index") plain[k] = v;
          }
          await productApi.updateProduct(editingProduct.id, plain, {
            headers: { "Content-Type": "application/json" },
          });
        } else {
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

  const tabItems = [
    { key: "all", label: `Tất cả (${statsItems[0].value})` },
    {
      key: "approved",
      label: `Đang bán (${statsItems[1].value})`,
      icon: <CheckCircleOutlined />,
    },
    {
      key: "pending",
      label: `Chờ duyệt (${statsItems[2].value})`,
      icon: <ClockCircleOutlined />,
    },
    {
      key: "out_of_stock",
      label: `Hết hàng (${statsItems[3].value})`,
      icon: <StopOutlined />,
    },
    { key: "rejected", label: "Đã huỷ / Từ chối" },
  ];

  const rowSelection = useMemo(() => {
    // Chỉ kích hoạt rowSelection khi đang ở tab "Đã hủy / Từ chối"
    if (activeTab !== "rejected") return null;

    return {
      selectedRowKeys,
      onChange: (keys) => {
        // Lọc ra các ID (sản phẩm bị từ chối/hủy) để đảm bảo chỉ chọn hàng hợp lệ
        const rejectedIds = filteredProducts
          .filter((p) =>
            ["rejected", "self_rejected", "banned"].includes(p.status)
          )
          .map((p) => p.id); // Đảm bảo chỉ chọn các keys hợp lệ trong danh sách filteredProducts
        const validKeys = keys.filter((key) => rejectedIds.includes(key));

        setSelectedRowKeys(validKeys);
      },
    };
  }, [activeTab, selectedRowKeys, filteredProducts]);

  // ==================== 7. RENDER ====================

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "0px" }}
    >
      {/* 2. Main Content Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        {/* Toolbar */}
        <div
          className="page-toolbar"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <Title
            level={4}
            className="page-title"
            style={{
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            DANH SÁCH SẢN PHẨM
          </Title>
          <div className="toolbar-actions" style={{ display: "flex", gap: 10 }}>
            <Input
              placeholder="Tìm theo tên, mã SP..."
              prefix={<SearchOutlined />}
              style={{ width: 250, maxWidth: "100%" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Làm mới
            </Button>

            {/* --- 5. Button Nhập Excel --- */}
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
              style={{ borderColor: "#52c41a", color: "#52c41a" }}
            >
              Nhập Excel
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
            >
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Tabs Filter */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          style={{ marginBottom: 16 }}
        />

        {activeTab === "rejected" && selectedRowKeys.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 16px",
              border: "1px solid #f30049ff",
              background: "#fffbe6",
              borderRadius: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {" "}
            <Text strong style={{ color: "#db0f0fff" }}>
              Đã chọn {selectedRowKeys.length} sản phẩm
              {" "}
            </Text>
            {" "}
            <Space>
              {/* Nút Xóa Hàng Loạt */}{" "}
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
              >
                Xóa tất cả{" "}
              </Button>
              {" "}
            </Space>
            {" "}
          </div>
        )}

        {/* Product Table */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <ProductTable
            data={filteredProducts}
            loading={loading}
            onView={(record) => {
              setSelectedProduct(record);
              setIsDetailModalVisible(true);
            }}

            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelfReject={handleSelfReject}
            onToggleHide={handleToggleHide}
            rowSelection={rowSelection} // 👈 Truyền hàm này vào
            onRow={(record) => ({
              onClick: () => {
                setSelectedProduct(record);
                setIsDetailModalVisible(true);
              },
            })}
          />
        </div>
      </Card>

      {/* --- MODALS AREA --- */}

      {/* 1. Detail Modal */}
      <ProductDetailModal
        visible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        product={selectedProduct}
        onManageImages={openGallery}
        getStatusConfig={getStatusConfig}
        getAvailabilityConfig={getAvailabilityConfig}
      />

      {/* 2. Add/Edit Form */}
      <ProductForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmitForm}
        initialValues={editingProduct}
        categories={categories}
      />

      {/* 3. Import Excel Modal - TÍCH HỢP MỚI */}
      <ImportProductModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />

      {/* 4. Gallery Upload Modal */}
      <Modal
        open={galleryVisible}
        title={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <UploadOutlined /> Quản lý thư viện ảnh
          </div>
        }
        onCancel={() => setGalleryVisible(false)}
        footer={[
          <Button key="back" onClick={() => setGalleryVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleGalleryUpload}
            loading={galleryLoading}
            disabled={!galleryFileList.some((f) => f.originFileObj)}
          >
            Tải lên ảnh mới
          </Button>,
        ]}
        width={800}
        centered
      >
        <div style={{ padding: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Ảnh hiện tại
          </Title>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {galleryFileList
              .filter((f) => !f.originFileObj)
              .map((file) => (
                <div
                  key={file.uid}
                  style={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    border: file.is_primary
                      ? "2px solid #faad14"
                      : "1px solid #d9d9d9",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={file.url}
                    alt="product"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      background: "rgba(0,0,0,0.6)",
                      padding: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={
                        file.is_primary ? (
                          <StarFilled style={{ color: "#faad14" }} />
                        ) : (
                          <StarOutlined style={{ color: "white" }} />
                        )
                      }
                      onClick={() => handleSetPrimaryImage(file.uid)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveImage(file)}
                    />
                  </div>
                  {file.is_primary && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "#faad14",
                        color: "white",
                        fontSize: 10,
                        padding: "2px 6px",
                        borderBottomLeftRadius: 8,
                      }}
                    >
                      Chính
                    </div>
                  )}
                </div>
              ))}
            {galleryFileList.filter((f) => !f.originFileObj).length === 0 && (
              <Text type="secondary">Chưa có ảnh nào trên server.</Text>
            )}
          </div>
          <Divider />
          <Title level={5} style={{ marginBottom: 16 }}>
            Thêm ảnh mới
          </Title>
          <Upload
            listType="picture-card"
            fileList={galleryFileList.filter((f) => f.originFileObj)}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              const oldFiles = galleryFileList.filter((f) => !f.originFileObj);
              if (oldFiles.length + fileList.length <= 6)
                setGalleryFileList([...oldFiles, ...fileList]);
              else message.warning("Tổng cộng tối đa 6 ảnh");
            }}
            onRemove={(file) => handleRemoveImage(file)}
            multiple
          >
            {galleryFileList.length < 6 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
              </div>
            )}
          </Upload>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              * Bấm vào <StarOutlined /> để chọn làm ảnh đại diện.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}
