import { useState, useMemo } from "react";
import { message, Modal } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { productApi } from "../services/api/productApi";
import { EyeClosed } from "lucide-react";
// 1. Import React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useProductPage = () => {
  const queryClient = useQueryClient();

  // ==================== UI STATE ====================
  // Chỉ giữ lại state phục vụ UI (Modal, Tab, Search), bỏ state dữ liệu
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

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

  // ==================== 2. DATA FETCHING (QUERIES) ====================

  // 2.1. Fetch Categories (Dữ liệu ít thay đổi -> Cache lâu)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await productApi.getCategories();
      return res.data.results || res.data || [];
    },
    staleTime: Infinity, // Cache vĩnh viễn trong phiên làm việc
  });

  // 2.2. Fetch Products (Dữ liệu chính -> Cache 5 phút)
  const {
    data: rawProductsData = [],
    isLoading: loadingProduct,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => {
      const res = await productApi.getSellerProducts();
      return res.data.results || res.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 phút không cần gọi lại API
    gcTime: 1000 * 60 * 30, // Giữ trong bộ nhớ 30 phút
  });

  // 2.3. Fetch Import Requests
  const { data: importRequests = [] } = useQuery({
    queryKey: ["import-requests"],
    queryFn: async () => {
      const res = await productApi.getImportRequestProducts();
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ==================== 3. DATA PROCESSING (MEMO) ====================

  // Kết hợp Products với Category Name
  // Logic này chạy cực nhanh ở Client, không cần useEffect
  const processedProducts = useMemo(() => {
    return rawProductsData
      .map((p) => {
        let catName = "Khác";
        let subName = "Khác";
        if (p.subcategory) {
          const cat = categories.find((c) =>
            c.subcategories?.some((s) => s.id === p.subcategory)
          );
          if (cat) {
            catName = cat.name;
            const sub = cat.subcategories.find((s) => s.id === p.subcategory);
            if (sub) subName = sub.name;
          }
        }
        return { ...p, category_name: catName, subcategory_name: subName };
      })
      .sort((a, b) => b.id - a.id);
  }, [rawProductsData, categories]);

  // Logic lọc dữ liệu (Filter Engine)
  const filteredProducts = useMemo(() => {
    let result =
      activeTab === "import_request"
        ? [...importRequests]
        : [...processedProducts];

    // 1. Search Filter
    if (searchTerm) {
      const lowerKey = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerKey) ||
          String(p.id).includes(lowerKey) ||
          (p.category_name && p.category_name.toLowerCase().includes(lowerKey))
      );
    }

    // 2. Tab Filter
    if (activeTab !== "all" && activeTab !== "import_request") {
      switch (activeTab) {
        case "pending":
          result = result.filter((p) =>
            ["pending", "pending_update"].includes(p.status)
          );
          break;
        case "approved":
          result = result.filter(
            (p) => p.status === "approved" && !p.is_hidden
          );
          break;
        case "hidden":
          result = result.filter((p) => p.status === "approved" && p.is_hidden);
          break;
        case "rejected":
          result = result.filter((p) =>
            ["rejected", "self_rejected"].includes(p.status)
          );
          break;
        case "banned":
          result = result.filter((p) => p.status === "banned");
          break;
        case "out_of_stock":
          result = result.filter((p) => p.stock <= 0); // Lưu ý: API trả về field là 'stock' hay 'stock_quantity' cần check kỹ
          break;
        default:
          break;
      }
    }
    return result;
  }, [processedProducts, importRequests, searchTerm, activeTab]);

  // ==================== 4. MUTATIONS (Cập nhật dữ liệu) ====================
  // Helper để refresh dữ liệu sau khi sửa đổi
  const refreshData = () => {
    queryClient.invalidateQueries(["seller-products"]);
    queryClient.invalidateQueries(["import-requests"]);
  };

  // 4.1. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.deleteProduct(id),
    onSuccess: () => {
      message.success("Đã xóa sản phẩm");
      refreshData();
    },
    onError: () => message.error("Lỗi khi xóa sản phẩm"),
  });

  // 4.2. Submit Form Mutation (Create & Update)
  const submitMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      if (!id) return productApi.createProduct(formData);

      // Logic check formData images (như code cũ)
      const hasImages = Array.from(formData.entries()).some(
        ([k]) => k === "images" || k === "image"
      );
      if (!hasImages) {
        const plain = {};
        for (let [k, v] of formData.entries()) {
          if (k !== "images" && k !== "primary_image_index") plain[k] = v;
        }
        return productApi.updateProduct(id, plain, {
          headers: { "Content-Type": "application/json" },
        });
      }
      return productApi.updateProduct(id, formData);
    },
    onSuccess: (data, variables) => {
      if (!variables.id) {
        message.success("Thêm mới thành công, chờ duyệt");
        setEditingProduct(null); // Reset form nếu là thêm mới
      } else {
        message.success("Cập nhật thành công");
        setModalVisible(false); // Đóng modal nếu là sửa
      }
      refreshData();
    },
    onError: (err) => {
      const serverMsg =
        err?.response?.data?.detail || err?.response?.data || err.message;
      message.error(serverMsg || "Lỗi khi lưu dữ liệu");
    },
  });

  // 4.3. Toggle Hide Mutation
  const toggleHideMutation = useMutation({
    mutationFn: (id) => productApi.toggleHide(id),
    onSuccess: () => {
      message.success("Cập nhật trạng thái hiển thị thành công");
      refreshData();
    },
  });

  // 4.4. Self Reject
  const selfRejectMutation = useMutation({
    mutationFn: (id) => productApi.selfReject(id),
    onSuccess: () => {
      message.success("Đã hủy đăng bán");
      refreshData();
    },
  });

  // ==================== CONFIGS & STATS ====================
  const statsItems = useMemo(() => {
    const total = processedProducts.length;
    const approved = processedProducts.filter(
      (p) => p.status === "approved"
    ).length;
    const pending = processedProducts.filter((p) =>
      ["pending", "pending_update"].includes(p.status)
    ).length;
    const outOfStock = processedProducts.filter((p) => p.stock <= 0).length;
    const hidden = processedProducts.filter(
      (p) => p.status === "approved" && p.is_hidden
    ).length;
    const banned = processedProducts.filter(
      (p) => p.status === "banned"
    ).length;

    return [
      { value: total },
      { value: approved },
      { value: pending },
      { value: outOfStock },
      { value: importRequests.length },
      { value: hidden },
      { value: banned },
    ];
  }, [processedProducts, importRequests]);

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
    {
      key: "import_request",
      label: `Yêu cầu nhập (${statsItems[4].value})`,
      icon: <ImportOutlined />,
    },
    {
      key: "hidden",
      label: `Bị ẩn (${statsItems[5].value})`,
      icon: <EyeClosed />,
    },
    {
      key: "banned",
      label: `Bị khóa (${statsItems[6].value})`,
      icon: <StopOutlined />,
    },
    { key: "rejected", label: "Đã huỷ / Từ chối" },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows);
    },
    getCheckboxProps: (record) => ({ disabled: record.status === "banned" }),
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

  // ==================== HANDLER WRAPPERS ====================
  // (Giữ nguyên tên hàm để tương thích với View)

  const handleAddNew = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };
  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };
  const handleDelete = (id) => deleteMutation.mutate(id);
  const handleSelfReject = (p) => selfRejectMutation.mutate(p.id);
  const handleToggleHide = (p) => toggleHideMutation.mutate(p.id);
  const handleSubmitForm = (formData) =>
    submitMutation.mutate({ id: editingProduct?.id, formData });

  // Bulk Delete (Logic phức tạp nên giữ lại xử lý logic, chỉ thay đoạn gọi API)
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    const deletableProducts = selectedRows.filter(
      (item) =>
        (item.sold === 0 || !item.sold) &&
        (item.ordered_quantity === 0 || !item.ordered_quantity) &&
        item.status !== "banned"
    );

    if (deletableProducts.length === 0) {
      return Modal.warning({
        title: "Không thể xóa",
        content:
          "Các sản phẩm đã chọn đều đã phát sinh đơn hàng hoặc đang bị khóa.",
      });
    }

    Modal.confirm({
      title: `Xác nhận xóa ${deletableProducts.length} sản phẩm?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await Promise.all(
            deletableProducts.map((p) => productApi.deleteProduct(p.id))
          );
          message.success(`Đã xóa thành công`);
          setSelectedRowKeys([]);
          setSelectedRows([]);
          refreshData(); // Refresh React Query
        } catch (error) {
          message.error("Lỗi khi xóa một số sản phẩm");
        }
      },
    });
  };

  const handleBulkToggleHide = () => {
    // (Giữ logic cũ, thay đoạn cuối bằng refreshData)
    const approvedProducts = selectedRows.filter(
      (item) => item.status === "approved"
    );
    if (approvedProducts.length === 0)
      return message.info("Chỉ có thể ẩn/hiển thị sản phẩm đã duyệt.");

    const hiddenCount = approvedProducts.filter((p) => p.is_hidden).length;
    const visibleCount = approvedProducts.length - hiddenCount;
    let targetProducts = approvedProducts;
    let actionText = hiddenCount > 0 && visibleCount === 0 ? "Hiển thị" : "Ẩn";

    if (visibleCount > 0 && hiddenCount > 0)
      return message.info(
        "Chọn các sản phẩm cùng trạng thái ẩn/hiển thị để thao tác."
      );

    Modal.confirm({
      title: `Bạn muốn ${actionText} ${targetProducts.length} sản phẩm?`,
      onOk: async () => {
        try {
          await Promise.all(
            targetProducts.map((p) => productApi.toggleHide(p.id))
          );
          message.success(`${actionText} thành công`);
          setSelectedRowKeys([]);
          setSelectedRows([]);
          refreshData();
        } catch (e) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  // Gallery Handlers (Giữ nguyên logic cũ nhưng cập nhật UI tốt hơn)
  const openGallery = (p) => {
    setGalleryProduct(p);
    let existing =
      p.images?.map((i) => ({
        uid: String(i.id),
        url: i.image,
        status: "done",
        name: `Image-${i.id}`,
        is_primary: i.is_primary,
      })) || [];
    if (existing.length === 0 && p.image) {
      existing.push({
        uid: "root-image-placeholder",
        url: p.image,
        status: "done",
        name: "Ảnh đại diện chính",
        is_primary: true,
      });
    }
    setGalleryFileList(existing);
    setGalleryVisible(true);
  };

  const handleSetPrimaryImage = async (imgId) => {
    if (!galleryProduct || imgId === "root-image-placeholder") return;
    try {
      await productApi.setPrimaryImage(galleryProduct.id, imgId);
      message.success("Đã thay đổi ảnh đại diện");
      setGalleryVisible(false);
      refreshData();
    } catch {
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
    if (file.uid === "root-image-placeholder")
      return message.warning(
        "Hãy thêm ảnh khác và đặt làm đại diện trước khi xóa ảnh này."
      );

    try {
      await productApi.deleteProductImage(file.uid);
      message.success("Đã xóa ảnh");
      setGalleryFileList((prev) =>
        prev.filter((item) => item.uid !== file.uid)
      );
      refreshData();
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
      refreshData();
      if (selectedProduct?.id === galleryProduct.id)
        setIsDetailModalVisible(false);
    } catch {
      message.error("Tải ảnh thất bại");
    } finally {
      setGalleryLoading(false);
    }
  };

  return {
    // Data
    rawProducts: processedProducts, // Map sang tên mới để khớp với UI cũ
    filteredProducts,
    categories,
    loading: loadingProduct,

    // UI State
    selectedRowKeys,
    setSelectedRowKeys,
    selectedRows,
    setSelectedRows,
    rowSelection,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    tabItems,

    // Modals
    modalVisible,
    setModalVisible,
    importModalVisible,
    setImportModalVisible,
    editingProduct,
    setEditingProduct,

    // Detail & Gallery
    selectedProduct,
    setSelectedProduct,
    isDetailModalVisible,
    setIsDetailModalVisible,
    galleryVisible,
    setGalleryVisible,
    galleryFileList,
    setGalleryFileList,
    galleryLoading,

    // Actions
    fetchData: refreshData, // Map refreshData vào fetchData để tương thích nút "Làm mới"
    handleAddNew,
    handleEdit,
    handleImportSuccess: refreshData,
    handleDelete,
    handleSelfReject,
    handleToggleHide,
    handleSubmitForm,
    handleBulkDelete,
    handleBulkToggleHide,

    // Gallery Actions
    openGallery,
    handleSetPrimaryImage,
    handleRemoveImage,
    handleGalleryUpload,

    // Configs
    getStatusConfig,
    getAvailabilityConfig,
  };
};
