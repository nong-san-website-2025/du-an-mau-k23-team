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

  // --- Fetch Data ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      // Sắp xếp: Ưu tiên AI score cao lên đầu, sau đó đến ngày cập nhật
      const sorted = raw.sort((a, b) => {
        if ((b.ai_score || 0) !== (a.ai_score || 0))
          return (b.ai_score || 0) - (a.ai_score || 0);
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
    // Giả sử API trả về field 'previously_deleted' hoặc ta check logic nào đó
    // Ví dụ tạm: check field giả định hoặc description có chứa từ khóa
    return item.is_reup || item.history_status === "deleted";
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
          {loading && !data.length ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            <ProductTable
              data={filteredData}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              onApprove={handleApprove}
              onReject={handleReject}
              onView={handleView}
            />
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
    </AdminPageLayout>
  );
};

export default ApprovalProductsPage;
