import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Input,
  Spin,
  Badge,
  Button,
  DatePicker,
  Select,
  Tooltip,
  Empty,
} from "antd";
import {
  CloudSyncOutlined,
  WarningOutlined,
  FileTextOutlined,
  RocketOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import axiosClient from "../../services/axiosClient";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Import Components
import ProductManager from "../../components/ProductAdmin/Product/ProductManager";
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ShopDetailDrawer from "../../components/ProductAdmin/Product/ShopDetailDrawer";
import { getWSBaseUrl } from "../../../../utils/ws";

dayjs.extend(isBetween);
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const api = axiosClient;

// --- HELPER: DETECT RE-UP ---
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
        return isSameSeller && isNotSelf && cleanNameCurrent === cleanNameOld;
      });
      if (historyMatches.length > 0)
        return {
          ...currentProduct,
          is_reup: true,
          reupHistory: historyMatches,
        };
    }
    return { ...currentProduct, is_reup: false, reupHistory: [] };
  });
};

const ApprovalProductsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("action_required");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");

  // Modals
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shopDrawerVisible, setShopDrawerVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);

  const socketRef = useRef(null);

  // --- ACTIONS ---
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/");
      const rawData = Array.isArray(res.data) ? res.data : res.data.results || [];
      
      const processed = detectReupAttempts(rawData).sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );
      setData(processed);
    } catch (err) {
      message.error("Không tải được dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- PRODUCT ACTION HANDLERS ---
  const handleApprove = useCallback(async (productIds) => {
    try {
      const response = await api.post("/products/bulk_approve/", {
        product_ids: Array.isArray(productIds) ? productIds : [productIds]
      });
      message.success(`Đã duyệt ${response.data.approved_count || 0} sản phẩm thành công`);
      fetchProducts();
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("Lỗi khi duyệt sản phẩm");
      console.error("Approve error:", error.response || error);
    }
  }, [fetchProducts]);

  const handleReject = useCallback(async (productIds, reason) => {
    try {
      const response = await api.post("/products/reject/", {
        product_ids: Array.isArray(productIds) ? productIds : [productIds],
        reason: reason
      });
      message.success(`Đã từ chối ${response.data.rejected_count || 0} sản phẩm`);
      fetchProducts();
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("Lỗi khi từ chối sản phẩm");
      console.error("Reject error:", error.response || error);
    }
  }, [fetchProducts]);

  const handleBan = useCallback(async (productIds, reason) => {
    try {
      const response = await api.post("/products/bulk_lock/", {
        product_ids: Array.isArray(productIds) ? productIds : [productIds],
        reason: reason
      });
      message.success(`Đã khóa ${response.data.locked_count || 0} sản phẩm`);
      fetchProducts();
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("Lỗi khi khóa sản phẩm");
      console.error("Ban error:", error.response || error);
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
    const token = localStorage.getItem("token");
    if (!token) return;

    const base = getWSBaseUrl();
    const wsUrl = `${base}/ws/admin/products/?token=${token}`;
    let socket;
    let isStopped = false;

    const connectWS = () => {
      if (isStopped) return;
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      socket.onopen = () => setWsConnected(true);
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const action = payload.action || payload.type;
        const incoming = payload.data;
        if (!incoming?.id) return;

        setData((prev) => {
          let newData;
          if (["CREATE", "NEW_PRODUCT", "CREATED"].includes(action)) {
            message.info(`Sản phẩm mới: ${incoming.name}`);
            newData = [{ ...incoming, is_new: true, isForcedVisible: true }, ...prev];
          } else if (["UPDATE", "UPDATED", "PRODUCT_CHANGED"].includes(action)) {
            newData = prev.map((p) => (p.id === incoming.id ? incoming : p));
          } else if (action === "DELETE") {
            newData = prev.filter((p) => p.id !== incoming.id);
          } else {
            return prev;
          }
          return detectReupAttempts(newData);
        });
      };
      socket.onclose = () => {
        setWsConnected(false);
        if (!isStopped) setTimeout(connectWS, 3000);
      };
    };

    connectWS();
    return () => {
      isStopped = true;
      socket?.close();
    };
  }, [fetchProducts]);

  // --- FILTER LOGIC ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const now = dayjs();
    if (val === "all") setDateRange(null);
    else if (val === "today") setDateRange([now.startOf("day"), now.endOf("day")]);
    else if (val === "7d") setDateRange([now.subtract(6, "day").startOf("day"), now.endOf("day")]);
    else if (val === "30d") setDateRange([now.subtract(29, "day").startOf("day"), now.endOf("day")]);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (item.isForcedVisible) return true;

      // Status & Risk Filter
      let matchesStatus = false;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "action_required") {
        const isPending = ["pending", "pending_update"].includes(item.status);
        matchesStatus = riskFilter === "reup" ? (isPending && item.is_reup) : isPending;
      } else if (statusFilter === "banned") {
        matchesStatus = ["banned", "locked"].includes(item.status);
      } else {
        matchesStatus = item.status === statusFilter;
      }

      if (!matchesStatus) return false;

      // Search
      const s = searchTerm.toLowerCase();
      if (searchTerm && !((item.name || "").toLowerCase().includes(s) || (item.seller?.store_name || "").toLowerCase().includes(s))) {
        return false;
      }

      // Selects
      if (sellerFilter && String(item.seller?.id) !== String(sellerFilter)) return false;
      if (categoryFilter && String(item.category_id) !== String(categoryFilter)) return false;

      // Date
      if (dateRange?.[0] && dateRange?.[1]) {
        if (!dayjs(item.created_at).isBetween(dateRange[0], dateRange[1], null, "[]")) return false;
      }

      return true;
    });
  }, [data, statusFilter, riskFilter, searchTerm, sellerFilter, categoryFilter, dateRange]);

  const stats = useMemo(() => ({
    total: data.length,
    pending: data.filter((i) => ["pending", "pending_update"].includes(i.status)).length,
    approved: data.filter((i) => i.status === "approved").length,
    rejected: data.filter((i) => i.status === "rejected").length,
    banned: data.filter((i) => ["banned", "locked"].includes(i.status)).length,
    reup: data.filter((i) => i.is_reup && ["pending", "pending_update"].includes(i.status)).length,
  }), [data]);

  const StatCard = ({ title, value, icon, color, active, onClick }) => (
    <Card
      hoverable
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: active ? `2px solid ${color}` : "1px solid #f0f0f0",
        background: active ? `${color}05` : "#fff",
        cursor: "pointer",
        height: '100%'
      }}
    >
      <Space size={16}>
        <div style={{ background: `${color}15`, color, padding: 12, borderRadius: 10, fontSize: 20, display: 'flex' }}>
          {icon}
        </div>
        <div>
          <Text type="secondary" strong>{title}</Text>
          <Title level={4} style={{ margin: 0, color }}>{value}</Title>
        </div>
      </Space>
    </Card>
  );

  return (
    <AdminPageLayout
      title={
        <Space align="center" size="middle">
          <Title level={3} style={{ margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Kiểm duyệt sản phẩm
          </Title>
          <Space size={8}>
            <Badge status={wsConnected ? "processing" : "default"} />
            <CloudSyncOutlined style={{ color: wsConnected ? "#52c41a" : "#d9d9d9", fontSize: "20px" }} />
          </Space>
        </Space>
      }
    >
      <div style={{ padding: "0 24px 24px" }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <StatCard title="Chờ duyệt" value={stats.pending} icon={<WarningOutlined />} color="#faad14" active={statusFilter === "action_required" && riskFilter === "all"} onClick={() => { setStatusFilter("action_required"); setRiskFilter("all"); }} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <StatCard title="Đã duyệt" value={stats.approved} icon={<CheckCircleOutlined />} color="#52c41a" active={statusFilter === "approved"} onClick={() => { setStatusFilter("approved"); setRiskFilter("all"); }} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <StatCard title="Từ chối" value={stats.rejected} icon={<CloseCircleOutlined />} color="#ff4d4f" active={statusFilter === "rejected"} onClick={() => { setStatusFilter("rejected"); setRiskFilter("all"); }} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <StatCard title="Vi phạm/Khóa" value={stats.banned} icon={<StopOutlined />} color="#000" active={statusFilter === "banned"} onClick={() => { setStatusFilter("banned"); setRiskFilter("all"); }} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <StatCard title="Nghi vấn Reup" value={stats.reup} icon={<ReloadOutlined />} color="#722ed1" active={statusFilter === "action_required" && riskFilter === "reup"} onClick={() => { setStatusFilter("action_required"); setRiskFilter("reup"); }} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <StatCard title="Tất cả" value={stats.total} icon={<FileTextOutlined />} color="#1890ff" active={statusFilter === "all"} onClick={() => { setStatusFilter("all"); setRiskFilter("all"); }} />
          </Col>
        </Row>

        <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 16, borderRadius: 12 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col flex="auto">
              <Space wrap size={12}>
                <Input prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />} placeholder="Tìm tên sản phẩm, shop..." style={{ width: 250 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} allowClear />
                <Select value={timeFilter} onChange={handleTimeChange} style={{ width: 130 }}>
                  <Option value="all">Mọi lúc</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="7d">7 ngày qua</Option>
                  <Option value="30d">30 ngày qua</Option>
                </Select>
                <RangePicker value={dateRange} onChange={(d) => { setDateRange(d); setTimeFilter("custom"); }} style={{ width: 260 }} />
                <CategorySelect value={categoryFilter} onChange={setCategoryFilter} style={{ width: 160 }} />
                <SellerSelect value={sellerFilter} onChange={setSellerFilter} style={{ width: 160 }} />
              </Space>
            </Col>
            <Col>
              <Space>
                <Tooltip title="Làm mới"><Button icon={<ReloadOutlined />} onClick={fetchProducts} /></Tooltip>
                <Button icon={<DownloadOutlined />}>Xuất Excel</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 100, textAlign: "center" }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>
          ) : filteredData.length > 0 ? (
            <ProductManager
              data={filteredData}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              onView={(r) => { setSelectedProduct(r); setDrawerVisible(true); }}
              onViewShop={(s) => { setSelectedShopProfile(s); setShopDrawerVisible(true); }}
              onApprove={handleApprove}
              onReject={handleReject}
              onBan={handleBan}
            />
          ) : (
            <Empty style={{ padding: 60 }} description="Không tìm thấy sản phẩm nào khớp với bộ lọc" />
          )}
        </Card>
      </div>

      <ProductDetailDrawer visible={drawerVisible} product={selectedProduct} onClose={() => setDrawerVisible(false)} />
      <ShopDetailDrawer visible={shopDrawerVisible} shopData={selectedShopProfile} onClose={() => setShopDrawerVisible(false)} />
    </AdminPageLayout>
  );
};

export default ApprovalProductsPage;