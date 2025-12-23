import { useState, useEffect, useMemo } from "react";
import { message, Modal } from "antd";
import { 
  CheckCircleOutlined, ClockCircleOutlined, StopOutlined, ImportOutlined 
} from "@ant-design/icons";
import { productApi } from "../services/api/productApi";
import { EyeClosed } from "lucide-react";

export const useProductPage = () => {
  // ==================== STATE MANAGEMENT ====================
  const [rawProducts, setRawProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // -- Modals --
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // -- Detail & Gallery --
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [galleryFileList, setGalleryFileList] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // -- Filters --
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [importRequestProducts, setImportRequestProducts] = useState([]);

  // ==================== CONFIGS ====================
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === 'banned',
    }),
  };

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

  // ==================== API FETCHING ====================
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

      // Map Category Logic
      const mapped = productsData.map((p) => {
        let catName = "Khác";
        let subName = "Khác";
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
        return { ...p, category_name: catName, subcategory_name: subName };
      });

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

  // ==================== FILTER ENGINE ====================
  useEffect(() => {
    let result = [...rawProducts];

    // Search
    if (searchTerm) {
      const lowerKey = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerKey) ||
          String(p.id).includes(lowerKey) ||
          (p.category_name && p.category_name.toLowerCase().includes(lowerKey))
      );
    }

    // Tab Filter
    if (activeTab !== "all") {
      switch (activeTab) {
        case "pending":
          result = result.filter((p) => ["pending", "pending_update"].includes(p.status));
          break;
        case "approved":
          result = result.filter((p) => p.status === "approved" && !p.is_hidden);
          break;
        case "hidden":
          result = result.filter((p) => p.status === "approved" && p.is_hidden);
          break;
        case "rejected":
          result = result.filter((p) => ["rejected", "self_rejected"].includes(p.status));
          break;
        case "banned":
          result = result.filter((p) => p.status === "banned");
          break;
        case "out_of_stock":
          result = result.filter((p) => p.stock <= 0);
          break;
        case "import_request":
          result = importRequestProducts;
          if (searchTerm) {
            const lowerKey = searchTerm.toLowerCase();
            result = result.filter(
              (p) => p.name.toLowerCase().includes(lowerKey) || String(p.id).includes(lowerKey)
            );
          }
          break;
        default: break;
      }
    }
    setFilteredProducts(result);
  }, [rawProducts, searchTerm, activeTab, importRequestProducts]);

  // ==================== STATS ====================
  const statsItems = useMemo(() => {
    const total = rawProducts.length;
    const approved = rawProducts.filter((p) => p.status === "approved").length;
    const pending = rawProducts.filter((p) => ["pending", "pending_update"].includes(p.status)).length;
    const outOfStock = rawProducts.filter((p) => p.stock <= 0).length;
    const importRequest = importRequestProducts.length;
    const hidden = rawProducts.filter((p) => p.status === "approved" && p.is_hidden).length;
    const banned = rawProducts.filter((p) => p.status === "banned").length;

    return [
      { value: total },
      { value: approved },
      { value: pending },
      { value: outOfStock },
      { value: importRequest },
      { value: hidden },
      { value: banned }
    ];
  }, [rawProducts, importRequestProducts]);

  const tabItems = [
    { key: "all", label: `Tất cả (${statsItems[0].value})` },
    { key: "approved", label: `Đang bán (${statsItems[1].value})`, icon: <CheckCircleOutlined /> },
    { key: "pending", label: `Chờ duyệt (${statsItems[2].value})`, icon: <ClockCircleOutlined /> },
    { key: "out_of_stock", label: `Hết hàng (${statsItems[3].value})`, icon: <StopOutlined /> },
    { key: "import_request", label: `Yêu cầu nhập (${statsItems[4].value})`, icon: <ImportOutlined /> },
    { key: "hidden", label: `Bị ẩn (${statsItems[5].value})`, icon: <EyeClosed /> },
    { key: "banned", label: `Bị khóa (${statsItems[6].value})`, icon: <StopOutlined /> },
    { key: "rejected", label: "Đã huỷ / Từ chối" },
  ];

  // ==================== HANDLERS ====================
  
  // --- BULK ACTIONS ---
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    const deletableProducts = selectedRows.filter(item =>
      (item.sold === 0 || !item.sold) &&
      (item.ordered_quantity === 0 || !item.ordered_quantity) &&
      item.status !== 'banned'
    );

    const validCount = deletableProducts.length;
    const totalCount = selectedRows.length;

    if (validCount === 0) {
      return Modal.warning({
        title: "Không thể xóa",
        content: "Các sản phẩm đã chọn đều đã phát sinh đơn hàng hoặc đang bị khóa.",
      });
    }

    Modal.confirm({
      title: `Xác nhận xóa ${validCount} sản phẩm?`,
      content: (
        <div>
          <p>Hành động này không thể hoàn tác.</p>
          {validCount < totalCount && (
            <p style={{ color: 'orange' }}>* Chú ý: Có {totalCount - validCount} sản phẩm không thể xóa.</p>
          )}
        </div>
      ),
      okText: `Xóa ${validCount} mục`,
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all(deletableProducts.map((p) => productApi.deleteProduct(p.id)));
          message.success(`Đã xóa thành công ${validCount} sản phẩm`);
          setSelectedRowKeys([]);
          setSelectedRows([]);
          fetchData();
        } catch (error) {
          message.error("Lỗi khi xóa một số sản phẩm");
          fetchData();
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkToggleHide = () => {
    const approvedProducts = selectedRows.filter(item => item.status === 'approved');
    
    if (approvedProducts.length === 0) {
      return message.info('Chỉ có thể ẩn/hiển thị sản phẩm đã duyệt.');
    }

    const hiddenCount = approvedProducts.filter(p => p.is_hidden).length;
    const visibleCount = approvedProducts.length - hiddenCount;
    
    let actionText = '';
    let targetProducts = [];
    
    if (hiddenCount > 0 && visibleCount === 0) {
      actionText = 'Hiển thị';
      targetProducts = approvedProducts;
    } else if (visibleCount > 0 && hiddenCount === 0) {
      actionText = 'Ẩn';
      targetProducts = approvedProducts;
    } else {
      message.info('Chọn các sản phẩm cùng trạng thái ẩn/hiển thị để thao tác.');
      return;
    }

    Modal.confirm({
      title: `Bạn muốn ${actionText} ${targetProducts.length} sản phẩm?`,
      onOk: async () => {
        try {
          await Promise.all(targetProducts.map(p => productApi.toggleHide(p.id)));
          message.success(`${actionText} thành công ${targetProducts.length} sản phẩm`);
          setSelectedRowKeys([]);
          setSelectedRows([]);
          fetchData();
        } catch (e) {
          message.error("Có lỗi xảy ra");
        }
      }
    });
  };

  // --- CRUD ---
  const handleAddNew = () => { setEditingProduct(null); setModalVisible(true); };
  const handleEdit = (product) => { setEditingProduct(product); setModalVisible(true); };
  const handleImportSuccess = () => fetchData();
  
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
      fetchData();
    } catch {
      message.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (!editingProduct) {
        formData.append("status", "pending");
        await productApi.createProduct(formData);
        message.success("Thêm mới thành công, chờ duyệt");
      } else {
        const hasImages = Array.from(formData.entries()).some(([k]) => k === "images" || k === "image");
        if (!hasImages) {
          const plain = {};
          for (let [k, v] of formData.entries()) {
            if (k !== 'images' && k !== 'primary_image_index') plain[k] = v;
          }
          await productApi.updateProduct(editingProduct.id, plain, { headers: { "Content-Type": "application/json" } });
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

  // --- GALLERY ---
  const openGallery = (p) => {
    setGalleryProduct(p);
    let existing = p.images?.map(i => ({
      uid: String(i.id),
      url: i.image,
      status: 'done',
      name: `Image-${i.id}`,
      is_primary: i.is_primary
    })) || [];

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
    if (!galleryProduct || imgId === 'root-image-placeholder') return;
    try {
      await productApi.setPrimaryImage(galleryProduct.id, imgId);
      message.success("Đã thay đổi ảnh đại diện");
      fetchData();
      setGalleryVisible(false);
    } catch {
      message.error("Lỗi khi đặt ảnh đại diện");
    }
  };

  const handleRemoveImage = async (file) => {
    if (file.originFileObj) {
      setGalleryFileList(prev => prev.filter(item => item.uid !== file.uid));
      return;
    }
    if (file.uid === 'root-image-placeholder') {
      return message.warning("Hãy thêm ảnh khác và đặt làm đại diện trước khi xóa ảnh này.");
    }
    try {
      await productApi.deleteProductImage(file.uid);
      message.success("Đã xóa ảnh");
      setGalleryFileList(prev => prev.filter(item => item.uid !== file.uid));
      fetchData();
    } catch {
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
    } catch {
      message.error("Tải ảnh thất bại");
    } finally {
      setGalleryLoading(false);
    }
  };

  // Return tất cả state và function cần thiết
  return {
    rawProducts, filteredProducts, categories, loading,
    selectedRowKeys, selectedRows, setSelectedRowKeys, setSelectedRows, rowSelection,
    activeTab, setActiveTab, searchTerm, setSearchTerm, tabItems,
    
    modalVisible, setModalVisible,
    importModalVisible, setImportModalVisible,
    editingProduct, setEditingProduct,
    
    selectedProduct, setSelectedProduct,
    isDetailModalVisible, setIsDetailModalVisible,
    
    galleryVisible, setGalleryVisible,
    galleryProduct,
    galleryFileList, setGalleryFileList,
    galleryLoading,

    fetchData,
    handleBulkDelete, handleBulkToggleHide,
    handleAddNew, handleEdit, handleImportSuccess, handleDelete,
    handleSelfReject, handleToggleHide, handleSubmitForm,
    openGallery, handleSetPrimaryImage, handleRemoveImage, handleGalleryUpload,
    
    getStatusConfig, getAvailabilityConfig
  };
};