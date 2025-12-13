import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  message,
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Space,
  Input,
  Spin,
  Empty,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  FileTextOutlined,
  RocketOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";

// Import Components
import ProductManager from "../../components/ProductAdmin/Product/ProductManager"; 
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ProductComparisonModal from "../../components/ProductAdmin/Product/ProductComparisonModal"; // Import Modal So sánh
import ShopDetailDrawer from "../../components/ProductAdmin/Product/ShopDetailDrawer";

const { Text } = Typography;

// --- API CONFIG ---
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// --- HELPER LOGIC: CHECK RE-UP ---
const detectReupAttempts = (products) => {
  if (!Array.isArray(products)) return [];
  const blacklistHistory = products.filter((p) =>
    ["deleted", "banned", "rejected"].includes(p.status)
  );

  return products.map((currentProduct) => {
    if (["pending", "pending_update"].includes(currentProduct.status)) {
      const historyMatches = blacklistHistory.filter((oldProduct) => {
        const isSameSeller = oldProduct.seller?.id === currentProduct.seller?.id;
        const isNotSelf = oldProduct.id !== currentProduct.id;
        const cleanNameCurrent = currentProduct.name?.trim().toLowerCase();
        const cleanNameOld = oldProduct.name?.trim().toLowerCase();
        const isSameName = cleanNameCurrent === cleanNameOld;
        return isSameSeller && isNotSelf && isSameName;
      });

      if (historyMatches.length > 0) {
        return {
          ...currentProduct,
          is_reup: true,
          reupHistory: historyMatches,
        };
      }
    }
    return { ...currentProduct, is_reup: false, reupHistory: [] };
  });
};

const ApprovalProductsPage = () => {
  // --- States ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState("action_required");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modals
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shopDrawerVisible, setShopDrawerVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);

  // --- STATE MỚI CHO COMPARISON MODAL ---
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedComparisonProduct, setSelectedComparisonProduct] = useState(null);

  // --- Fetch Data ---
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });
      const rawData = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const processedData = detectReupAttempts(rawData);

      const sorted = processedData.sort((a, b) => {
        if (a.is_reup && !b.is_reup) return -1;
        if (!a.is_reup && b.is_reup) return 1;
        const scoreA = a.ai_score || 0;
        const scoreB = b.ai_score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

      setData(sorted);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      message.error(err.response?.data?.detail || "Không tải được dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Tab Status
      let matchesTab = false;
      if (activeTab === "all") matchesTab = true;
      else if (activeTab === "action_required") matchesTab = ["pending", "pending_update"].includes(item.status);
      else matchesTab = item.status === activeTab;
      if (!matchesTab) return false;

      // 2. Risk Filter
      if (["action_required", "pending"].includes(activeTab)) {
        if (riskFilter === "suspicious" && !((item.ai_score >= 80) || item.is_flagged)) return false;
        if (riskFilter === "new_shop") {
            const createdDate = item.seller?.created_at ? new Date(item.seller.created_at) : new Date(0);
            if ((new Date() - createdDate) / (86400000) > 7) return false;
        }
        if (riskFilter === "reup" && !item.is_reup) return false;
      }

      // 3. Search & Common Filters
      const searchKey = searchTerm.toLowerCase();
      const matchesSearch = (item.name || "").toLowerCase().includes(searchKey) || 
                            (item.seller?.store_name || "").toLowerCase().includes(searchKey);
      const matchesSeller = sellerFilter ? String(item.seller?.id) === String(sellerFilter) : true;
      const matchesCategory = categoryFilter ? String(item.category_id) === String(categoryFilter) : true;

      return matchesSearch && matchesSeller && matchesCategory;
    });
  }, [data, activeTab, riskFilter, searchTerm, sellerFilter, categoryFilter]);

  // --- Action Handlers ---
  const processApproval = async (idOrIds, isReject = false, reason = "") => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (ids.length === 0) return;
    const hideLoading = message.loading("Đang xử lý...", 0);
    
    try {
        await Promise.all(ids.map(id => {
            if (isReject) return api.post(`/products/${id}/reject/`, { reason }, { headers: getAuthHeaders() });
            else return api.post(`/products/${id}/approve/`, {}, { headers: getAuthHeaders() });
        }));

        hideLoading();
        message.success(`Đã ${isReject ? "từ chối" : "duyệt"} thành công.`);
        fetchProducts();
        setSelectedRowKeys([]);
        setDrawerVisible(false);
        setComparisonModalVisible(false); // Đóng modal so sánh nếu đang mở
    } catch (e) {
        hideLoading();
        message.error("Có lỗi xảy ra khi xử lý.");
    }
  };

  // --- Handler mở modal so sánh ---
  const handleCompare = (product) => {
      setSelectedComparisonProduct(product);
      setComparisonModalVisible(true);
  };

  // --- Stats ---
  const tabCounts = useMemo(() => ({
    action: data.filter((i) => ["pending", "pending_update"].includes(i.status)).length,
    approved: data.filter((i) => i.status === "approved").length,
    rejected: data.filter((i) => i.status === "rejected").length,
  }), [data]);

  const riskCounts = useMemo(() => {
     const pendings = data.filter(i => ["pending", "pending_update"].includes(i.status));
     return {
         all: pendings.length,
         new_shop: pendings.filter(i => {
             const d = i.seller?.created_at ? new Date(i.seller.created_at) : new Date(0);
             return (new Date() - d) / (86400000) <= 7;
         }).length,
         reup: pendings.filter(i => i.is_reup).length
     }
  }, [data]);

  // --- Card Component ---
  const FilterStatCard = ({ title, icon, value, color, active, onClick }) => (
    <Card
      hoverable
      onClick={onClick}
      style={{
        cursor: "pointer", borderRadius: 12,
        border: active ? `2px solid ${color}` : "1px solid #f0f0f0",
        background: active ? `${color}08` : "#fff", transition: "all 0.3s ease",
      }}
      bodyStyle={{ padding: "16px 20px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Space>
          <div style={{ padding: 8, borderRadius: "50%", background: `${color}20`, color: color, fontSize: 18, display: 'flex' }}>
            {icon}
          </div>
          <Text strong style={{ color: active ? color : "inherit" }}>{title}</Text>
        </Space>
        <Text strong style={{ fontSize: 20, color: color }}>{value}</Text>
      </div>
    </Card>
  );

  return (
    <AdminPageLayout title="KIỂM DUYỆT SẢN PHẨM">
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#fafafa', padding: "16px 24px 0" }}>
             <Tabs
                activeKey={activeTab}
                onChange={(k) => { setActiveTab(k); setRiskFilter("all"); }}
                size="large"
                items={[
                    { label: <Space><WarningOutlined /> Cần xử lý <Badge count={tabCounts.action} style={{ backgroundColor: '#faad14' }} /></Space>, key: "action_required" },
                    { label: <Space><CheckCircleOutlined /> Đã duyệt <span style={{color: '#999'}}>({tabCounts.approved})</span></Space>, key: "approved" },
                    { label: <Space><CloseCircleOutlined /> Từ chối <span style={{color: '#999'}}>({tabCounts.rejected})</span></Space>, key: "rejected" },
                    { label: "Tất cả", key: "all" },
                ]}
                style={{ marginBottom: 0 }}
             />
          </div>

          <div style={{ padding: 24 }}>
            {["action_required", "pending"].includes(activeTab) && (
              <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12, textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>Phân loại rủi ro</Text>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}><FilterStatCard title="Tất cả hồ sơ" icon={<FileTextOutlined />} value={riskCounts.all} color="#1890ff" active={riskFilter === "all"} onClick={() => setRiskFilter("all")} /></Col>
                  <Col xs={24} md={8}><FilterStatCard title="Shop mới (7 ngày)" icon={<RocketOutlined />} value={riskCounts.new_shop} color="#faad14" active={riskFilter === "new_shop"} onClick={() => setRiskFilter("new_shop")} /></Col>
                  <Col xs={24} md={8}><FilterStatCard title="Nghi vấn Re-up" icon={<ReloadOutlined />} value={riskCounts.reup} color="#f5222d" active={riskFilter === "reup"} onClick={() => setRiskFilter("reup")} /></Col>
                </Row>
              </div>
            )}

            <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Tìm kiếm..." style={{ width: 300 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} allowClear />
                <SellerSelect style={{ width: 200 }} onChange={setSellerFilter} placeholder="Lọc theo Shop" />
                <CategorySelect style={{ width: 200 }} onChange={setCategoryFilter} placeholder="Lọc theo Danh mục" />
            </div>

            {loading ? (
                 <div style={{ textAlign: "center", padding: "60px 0" }}><Spin tip="Đang tải dữ liệu..." size="large" /></div>
            ) : filteredData.length === 0 ? (
                 <Empty description="Không có sản phẩm nào phù hợp" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <ProductManager
                    data={filteredData}
                    selectedRowKeys={selectedRowKeys}
                    setSelectedRowKeys={setSelectedRowKeys}
                    onApprove={(ids) => processApproval(ids, false)}
                    onReject={(ids, reason) => processApproval(ids, true, reason)}
                    onView={(r) => { setSelectedProduct(r); setDrawerVisible(true); }}
                    onViewShop={(s) => { setSelectedShopProfile(s); setShopDrawerVisible(true); }}
                    onCompare={handleCompare} // Truyền handler so sánh xuống component con
                    viewModeProp={riskFilter === "new_shop" ? "grid" : "table"}
                />
            )}
          </div>
        </Card>
      </div>

      {/* --- DRAWERS & MODALS --- */}
      <ProductDetailDrawer
        visible={drawerVisible}
        product={selectedProduct}
        onClose={() => setDrawerVisible(false)}
        onApprove={() => processApproval(selectedProduct?.id, false)}
        onReject={() => processApproval(selectedProduct?.id, true, "Chi tiết")}
      />
      
      {/* --- COMPARISON MODAL (ĐÃ KHÔI PHỤC) --- */}
      <ProductComparisonModal
        visible={comparisonModalVisible}
        product={selectedComparisonProduct}
        onCancel={() => setComparisonModalVisible(false)}
        onApprove={(p) => processApproval(p.id, false)}
        onReject={(p, reason) => processApproval(p.id, true, reason)}
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