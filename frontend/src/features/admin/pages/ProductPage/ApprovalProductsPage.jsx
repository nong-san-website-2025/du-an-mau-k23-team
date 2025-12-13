// src/pages/ProductAdmin/Approval/ApprovalProductsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Input,
  message,
  Spin,
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  AppstoreOutlined,
  WarningOutlined,
  ThunderboltFilled,
  ShopOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs"; // Cần cài dayjs hoặc dùng new Date()

// Import components cũ
import ProductTable from "../../components/ProductAdmin/Product/ProductTable"; // <--- IMPORT COMPONENT VỪA TẠO
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ProductComparisonModal from "../../components/ProductAdmin/Product/ProductComparisonModal";
import { productApi } from "../../services/productApi";
import ShopDetailDrawer from "../../components/ProductAdmin/Product/ShopDetailDrawer"; // Đường dẫn tuỳ project bạn

const { Text, Title } = Typography;

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// --- Style cho thẻ lọc rủi ro ---
const filterCardStyle = (isActive, color) => ({
  cursor: "pointer",
  border: isActive ? `2px solid ${color}` : "1px solid #f0f0f0",
  backgroundColor: isActive ? `${color}10` : "#fff", // Màu nhạt khi active
  borderRadius: 8,
  transition: "all 0.3s",
  height: "100%",
});

const ApprovalProductsPage = () => {
  // --- Data States ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // --- UI/UX States ---
  const [activeTab, setActiveTab] = useState("action_required"); // Tab chính (Pending, Approved...)
  const [riskFilter, setRiskFilter] = useState("all"); // <--- MỚI: Filter rủi ro (all, suspicious, new_shop, reup)

  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // --- Modal States ---
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedComparisonProduct, setSelectedComparisonProduct] =
    useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const [shopDrawerVisible, setShopDrawerVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);

  // --- Fetch Data ---
  // --- Fetch Data & Logic Thám Tử ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });

      // 1. Lấy dữ liệu thô từ API
      let rawData = Array.isArray(res.data) ? res.data : res.data.results || [];

      // ==================================================================
      // 🕵️‍♂️ LOGIC THÁM TỬ: PHÁT HIỆN TÁI XUẤT HIỆN (RE-UP CHECK)
      // ==================================================================

      // A. Tạo danh sách đen (Blacklist): Các SP đã bị xóa hoặc cấm trước đây
      const blacklistHistory = rawData.filter((p) =>
        ["deleted", "banned", "rejected"].includes(p.status)
      );

      // B. Duyệt qua từng sản phẩm để kiểm tra
      const processedData = rawData.map((currentProduct) => {
        // Chỉ soi những ông đang chờ duyệt
        if (["pending", "pending_update"].includes(currentProduct.status)) {
          // Soi xem có trùng với hồ sơ đen nào không
          const matchFound = blacklistHistory.find((oldProduct) => {
            // Điều kiện 1: Phải cùng một Shop (Seller)
            // Lưu ý: Dùng optional chaining ?. để tránh lỗi nếu seller null
            const isSameSeller =
              oldProduct.seller?.id === currentProduct.seller?.id;

            // Điều kiện 2: Trùng tên (Bỏ viết hoa, bỏ khoảng trắng thừa)
            const isSameName =
              oldProduct.name?.trim().toLowerCase() ===
              currentProduct.name?.trim().toLowerCase();

            // Điều kiện 3: Trùng giá tiền (Ép kiểu Number cho chắc)
            const isSamePrice =
              Number(oldProduct.price) === Number(currentProduct.price);

            // Điều kiện 4: Không so sánh với chính nó (Quan trọng!)
            const isNotSelf = oldProduct.id !== currentProduct.id;

            // ==> Nếu thỏa mãn tất cả thì là Tái xuất hiện
            return isSameSeller && isSameName && isSamePrice && isNotSelf;
          });

          // Nếu phát hiện trùng
          if (matchFound) {
            console.log(
              `⚠️ Phát hiện Re-up: ${currentProduct.name} trùng với ID cũ ${matchFound.id}`
            );
            return {
              ...currentProduct,
              is_reup: true, // Gắn cờ Re-up
              // Tạo câu cảnh báo để hiển thị (nếu cần)
              reup_warning: `Trùng khớp sản phẩm đã xóa ngày ${dayjs(matchFound.updated_at).format("DD/MM/YYYY")} (Lý do: ${matchFound.reason || "Vi phạm"})`,
            };
          }
        }

        // Nếu không trùng thì trả về nguyên bản
        return currentProduct;
      });
      // ==================================================================

      // 2. Sắp xếp lại (Ưu tiên Re-up và AI Score lên đầu để Admin chú ý)
      const sorted = processedData.sort((a, b) => {
        // Nếu là Re-up thì ưu tiên lên đầu tiên
        if (a.is_reup && !b.is_reup) return -1;
        if (!a.is_reup && b.is_reup) return 1;

        // Sau đó đến điểm AI
        if ((b.ai_score || 0) !== (a.ai_score || 0))
          return (b.ai_score || 0) - (a.ai_score || 0);

        // Cuối cùng là ngày tháng
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

      setData(sorted);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Helpers Check Rủi Ro ---
  const isSuspicious = (item) =>
    (item.ai_score && item.ai_score >= 80) || item.is_flagged;

  // Hàm kiểm tra Shop mới (Dùng JS thuần, không cần dayjs)
  const isNewShop = (item) => {
    // --- DÒNG LOG KIỂM TRA ---
    // In ra xem bên trong seller có gì
    if (item.seller) {
      console.log("Dữ liệu Seller của: " + item.name, item.seller);
    }
    // -------------------------

    if (!item.seller || typeof item.seller !== "object") return false;
    if (!item.seller.created_at) return false; // <--- Nếu API thiếu trường này thì code sẽ dừng ở đây

    // 3. Tính toán khoảng cách ngày
    try {
      const createdDate = new Date(item.seller.created_at);
      const today = new Date();

      // Tính số mili-giây chênh lệch
      const diffTime = Math.abs(today - createdDate);
      // Đổi ra ngày (chia cho 1000ms * 60s * 60m * 24h)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Debug: Bỏ comment dòng dưới để xem log nếu vẫn lỗi
      // if (diffDays <= 7) console.log("Found New Shop:", item.name, diffDays);

      return diffDays <= 7;
    } catch (e) {
      return false;
    }
  };

  const isReappearing = (item) => {
    // Chỉ tính những cái đang chờ duyệt
    if (!["pending", "pending_update"].includes(item.status)) return false;

    // Logic mới: Kiểm tra cờ is_reup do Frontend tự tính toán ở trên
    if (item.is_reup === true) return true;

    // Logic cũ (Backup): Nếu Backend có lưu vết
    if (item.previous_status === "deleted" || item.previous_status === "banned")
      return true;

    return false;
  };

  // --- Thống kê số lượng cho Filter Rủi ro (Chỉ tính trên tập đang chờ xử lý) ---
  const riskCounts = useMemo(() => {
    // Chỉ tính toán trên những item cần xử lý (Pending)
    const pendingItems = data.filter((i) =>
      ["pending", "pending_update"].includes(i.status)
    );

    return {
      all: pendingItems.length,
      suspicious: pendingItems.filter(isSuspicious).length,
      new_shop: pendingItems.filter(isNewShop).length,
      reup: pendingItems.filter(isReappearing).length,
    };
  }, [data]);

  // --- Logic Lọc Dữ Liệu (Master Filter) ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Lọc theo Tab chính (Trạng thái)
      let matchesTab = false;
      switch (activeTab) {
        case "pending":
          matchesTab = item.status === "pending";
          break;
        case "action_required":
          matchesTab = ["pending", "pending_update"].includes(item.status);
          break;
        case "approved":
          matchesTab = item.status === "approved";
          break;
        case "rejected":
          matchesTab = item.status === "rejected";
          break;
        case "banned":
          matchesTab = item.status === "banned";
          break;
        case "all":
        default:
          matchesTab = true;
      }
      if (!matchesTab) return false;

      // 2. Lọc theo Risk Filter (Chỉ áp dụng khi ở tab "Cần xử lý" hoặc "Chờ duyệt")
      if (["action_required", "pending"].includes(activeTab)) {
        if (riskFilter === "suspicious" && !isSuspicious(item)) return false;
        if (riskFilter === "new_shop" && !isNewShop(item)) return false;
        if (riskFilter === "reup" && !isReappearing(item)) return false;
      }

      // 3. Các bộ lọc tìm kiếm thông thường
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.seller?.store_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesSeller = sellerFilter
        ? String(item.seller?.id) === String(sellerFilter)
        : true;
      const matchesCategory = categoryFilter
        ? String(item.category_id) === String(categoryFilter)
        : true;

      return matchesSearch && matchesSeller && matchesCategory;
    });
  }, [data, activeTab, riskFilter, searchTerm, sellerFilter, categoryFilter]);

  // --- Handlers ---
  const processApproval = async (idOrIds, isReject = false, reason = "") => {
    // ... (Giữ nguyên code xử lý API như cũ)
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    let successCount = 0;
    setLoading(true);
    try {
      for (const id of ids) {
        const record = data.find((item) => item.id === id);
        if (!record) continue;
        const actionType = isReject ? "reject" : "approve";
        const suffix = record.status === "pending_update" ? "_update" : "";
        const endpoint = `${actionType}${suffix}`;
        const payload = isReject ? { reason: reason } : {};
        await api.post(`/products/${id}/${endpoint}/`, payload, {
          headers: getAuthHeaders(),
        });
        successCount++;
      }
      if (successCount > 0) {
        message.success(`Đã xử lý ${successCount} sản phẩm.`);
        fetchProducts();
        setSelectedRowKeys([]);
        if (selectedProduct) setDrawerVisible(false);
        if (selectedComparisonProduct) setComparisonModalVisible(false);
      }
    } catch (e) {
      console.error(e);
      message.error("Lỗi xử lý.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (idOrIds) => processApproval(idOrIds, false);
  const handleReject = (idOrIds, reason) =>
    processApproval(idOrIds, true, reason);
  const handleView = (record) => {
    setSelectedProduct(record);
    setDrawerVisible(true);
  };

  // --- Counts cho Tabs ---
  const counts = useMemo(() => {
    return {
      pending: data.filter((i) => i.status === "pending").length,
      action_required: data.filter((i) =>
        ["pending", "pending_update"].includes(i.status)
      ).length,
      approved: data.filter((i) => i.status === "approved").length,
      rejected: data.filter((i) => i.status === "rejected").length,
      banned: data.filter((i) => i.status === "banned").length,
      all: data.length,
    };
  }, [data]);

  const tabItems = [
    {
      key: "action_required",
      label: (
        <span>
          <WarningOutlined /> Cần xử lý ({counts.action_required})
        </span>
      ),
    },
    {
      key: "approved",
      label: (
        <span>
          <CheckCircleOutlined /> Đã duyệt ({counts.approved})
        </span>
      ),
    },
    {
      key: "rejected",
      label: (
        <span>
          <CloseCircleOutlined /> Từ chối ({counts.rejected})
        </span>
      ),
    },
    { key: "all", label: "Tất cả" },
  ];

  const getJoinTime = (dateString) => {
    if (!dateString) return "N/A";
    const created = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Dùng ceil (làm tròn lên) hoặc check < 1

    if (diffDays <= 1) return " Vừa tham gia hôm nay ";
    return `${diffDays} ngày trước`;
  };

  // Hàm gom nhóm sản phẩm theo Seller
  const groupProductsBySeller = (productList) => {
    const groups = {};

    productList.forEach((product) => {
      // Lấy ID hoặc tên shop để làm key gom nhóm
      // (Dùng optional chaining ?. để tránh lỗi nếu dữ liệu seller bị null)
      const shopName = product.seller?.store_name || "Chưa đặt tên Shop";
      const shopAvatar = product.seller?.avatar || null;
      const seller = product.seller || {};
      if (seller) console.log("Check hàng seller:", seller);

      if (!groups[shopName]) {
        groups[shopName] = {
          shopName: shopName,
          image: shopAvatar,
          created_at: product.seller?.created_at, // Ngày tạo shop
          joinedText: getJoinTime(seller.created_at),
          products: [], // Danh sách sản phẩm của shop này
          email: seller.email || "Chưa có email",
          phone: seller.phone || seller.phone_number || "Chưa có SĐT",
          address: seller.address || "Chưa cập nhật địa chỉ",
          ownerName: seller.full_name,
        };
      }
      // Đẩy sản phẩm vào danh sách của shop đó
      groups[shopName].products.push(product);
    });

    // Chuyển object thành mảng để dễ map() ra giao diện
    return Object.values(groups);
  };

  const handleViewShopProfile = (shopData) => {
    setSelectedShopProfile(shopData);
    setShopDrawerVisible(true);
  };

  return (
    <AdminPageLayout title="QUẢN LÝ & DUYỆT SẢN PHẨM">
      <Card bordered={false} bodyStyle={{ padding: "0px" }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k);
            setRiskFilter("all");
          }}
          items={tabItems}
          type="card"
          size="large"
          style={{ marginBottom: 0 }}
        />

        <div
          style={{
            padding: "16px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderTop: "none",
          }}
        >
          {/* --- KHU VỰC RISK SEGMENTS (Chỉ hiện khi ở tab Cần xử lý) --- */}
          {["action_required", "pending"].includes(activeTab) && (
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                🎯 Phân loại rủi ro (Ưu tiên xử lý):
              </Text>
              <Row gutter={[16, 16]}>
                {/* Thẻ 1: Tất cả - Chiếm 1/3 chiều rộng (md={8}) */}
                <Col xs={24} sm={24} md={8}>
                  <Card
                    hoverable
                    bodyStyle={{ padding: 20 }}
                    style={filterCardStyle(riskFilter === "all", "#1890ff")}
                    onClick={() => setRiskFilter("all")}
                  >
                    <Statistic
                      title={<Text strong>📋 Tất cả chờ duyệt</Text>}
                      value={riskCounts.all}
                      prefix={<SafetyCertificateOutlined />}
                    />
                  </Card>
                </Col>

                {/* Thẻ 2: Shop mới - Chiếm 1/3 chiều rộng (md={8}) */}
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bodyStyle={{ padding: 20 }}
                    style={filterCardStyle(
                      riskFilter === "new_shop",
                      "#faad14"
                    )}
                    onClick={() => setRiskFilter("new_shop")}
                  >
                    <Statistic
                      title={
                        <Text type="warning" strong>
                          🆕 Shop mới (dưới 7 ngày)
                        </Text>
                      }
                      value={riskCounts.new_shop}
                      prefix={<ShopOutlined style={{ color: "#faad14" }} />}
                      valueStyle={{ color: "#faad14" }}
                    />
                  </Card>
                </Col>

                {/* Thẻ 3: Tái xuất hiện - Chiếm 1/3 chiều rộng (md={8}) */}
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    bodyStyle={{ padding: 20 }}
                    style={filterCardStyle(riskFilter === "reup", "#722ed1")}
                    onClick={() => setRiskFilter("reup")}
                  >
                    <Statistic
                      title={
                        <Text style={{ color: "#722ed1" }} strong>
                          ♻️ Tái xuất hiện (Đã xóa)
                        </Text>
                      }
                      value={riskCounts.reup}
                      prefix={<ReloadOutlined style={{ color: "#722ed1" }} />}
                      valueStyle={{ color: "#722ed1" }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* --- FILTER TOOLBAR CŨ --- */}
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#f9f9f9",
              borderRadius: 8,
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Input
                  placeholder="Tìm tên SP, Shop..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} md={5}>
                <SellerSelect
                  onChange={setSellerFilter}
                  placeholder="Lọc theo Shop"
                />
              </Col>
              <Col xs={24} md={5}>
                <CategorySelect
                  onChange={setCategoryFilter}
                  placeholder="Lọc theo Danh mục"
                />
              </Col>
            </Row>
          </div>

          {/* --- TABLE / GRID VIEW --- */}
          {/* --- TABLE / GRID VIEW --- */}
          {/* TABLE / GRID VIEW */}
          {loading && !data.length ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* --- TRƯỜNG HỢP 1: SHOP MỚI -> HIỆN GRID CARD --- */}
              {riskFilter === "new_shop" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(400px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {groupProductsBySeller(filteredData).map((shop, index) => (
                    <Card
                      key={index}
                      hoverable
                      style={{
                        borderRadius: "12px",
                        border: "1px solid #d9d9d9",
                        overflow: "hidden",
                      }}
                      bodyStyle={{ padding: 0 }}
                    >
                      {/* 1. Header của Shop Card */}
                      <div
                        style={{
                          padding: "16px",
                          background: "#f0f5ff",
                          borderBottom: "1px solid #f0f0f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              background: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #ddd",
                              overflow: "hidden",
                            }}
                          >
                            {shop.avatar ? (
                              <img
                                src={shop.avatar}
                                alt="avatar"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <ShopOutlined
                                style={{ fontSize: "24px", color: "#1890ff" }}
                              />
                            )}
                          </div>
                          <div>
                            <Title
                              level={5}
                              style={{ margin: 0, color: "#1f1f1f" }}
                            >
                              {shop.shopName}
                            </Title>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              📅 Tham gia: {shop.joinedText}
                            </Text>
                          </div>
                        </div>
                        <Tag color="green">Shop mới</Tag>
                      </div>

                      {/* 2. Danh sách sản phẩm bên trong */}
                      <div style={{ padding: "0 16px" }}>
                        <div
                          style={{
                            padding: "12px 0",
                            borderBottom: "1px dashed #f0f0f0",
                          }}
                        >
                          <Text strong>
                            📦 Danh sách chờ duyệt ({shop.products.length}):
                          </Text>
                        </div>
                        <div
                          style={{
                            maxHeight: "250px",
                            overflowY: "auto",
                            paddingBottom: "12px",
                          }}
                        >
                          {shop.products.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 0",
                                borderBottom: "1px solid #f5f5f5",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "4px",
                                    objectFit: "cover",
                                    border: "1px solid #eee",
                                  }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: "14px",
                                      maxWidth: "180px",
                                    }}
                                    ellipsis={{ tooltip: item.name }}
                                  >
                                    {item.name}
                                  </Text>
                                  <Text
                                    type="danger"
                                    style={{ fontSize: "12px" }}
                                  >
                                    {parseInt(item.price).toLocaleString()}đ
                                  </Text>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <CheckCircleOutlined
                                  style={{
                                    fontSize: "20px",
                                    color: "#52c41a",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => handleApprove(item.id)}
                                  title="Duyệt nhanh"
                                />
                                <CloseCircleOutlined
                                  style={{
                                    fontSize: "20px",
                                    color: "#ff4d4f",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleReject(item.id, "Vi phạm chính sách")
                                  }
                                  title="Từ chối nhanh"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Footer của Card (Đã sửa lỗi lặp code) */}
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#fafafa",
                          borderTop: "1px solid #f0f0f0",
                          textAlign: "right",
                        }}
                      >
                        <a
                          style={{
                            color: "#1890ff",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                          onClick={() => handleViewShopProfile(shop)}
                        >
                          Xem hồ sơ Shop &rarr;
                        </a>
                      </div>
                    </Card>
                  ))}
                  {filteredData.length === 0 && (
                    <div
                      style={{
                        gridColumn: "1/-1",
                        textAlign: "center",
                        padding: 20,
                      }}
                    >
                      <Text type="secondary">
                        Không có shop mới nào cần duyệt.
                      </Text>
                    </div>
                  )}
                </div>
              ) : (
                // --- TRƯỜNG HỢP 2: CÁC TRƯỜNG HỢP KHÁC (BAO GỒM "TÁI XUẤT HIỆN") -> HIỆN BẢNG ---
                <div>
                  {/* Đã di chuyển cảnh báo Reup xuống đúng chỗ này */}
                  {riskFilter === "reup" && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "8px 12px",
                        background: "#fff1f0",
                        border: "1px solid #ffa39e",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ReloadOutlined style={{ color: "#cf1322" }} />
                      <Text type="danger">
                        Danh sách này gồm các sản phẩm đã từng bị xóa/vi phạm
                        trước đây. Vui lòng kiểm tra kỹ trước khi duyệt lại.
                      </Text>
                    </div>
                  )}

                  <ProductTable
                    data={filteredData}
                    selectedRowKeys={selectedRowKeys}
                    setSelectedRowKeys={setSelectedRowKeys}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onView={handleView}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Detail & Comparison Components (Giữ nguyên) */}
      <ProductDetailDrawer
        visible={drawerVisible}
        product={selectedProduct}
        onClose={() => setDrawerVisible(false)}
        onApprove={() => handleApprove(selectedProduct?.id)}
        onReject={() => handleReject(selectedProduct?.id)}
      />
      <ProductComparisonModal
        visible={comparisonModalVisible}
        onCancel={() => setComparisonModalVisible(false)}
        product={selectedComparisonProduct}
        onApprove={(p) => handleApprove(p.id)}
        onReject={(p) => handleReject(p.id)}
        loading={comparisonLoading}
      />

      <ShopDetailDrawer
        visible={shopDrawerVisible}
        onClose={() => setShopDrawerVisible(false)}
        shopData={selectedShopProfile}
      />
    </AdminPageLayout>
  );
};

export default ApprovalProductsPage;
