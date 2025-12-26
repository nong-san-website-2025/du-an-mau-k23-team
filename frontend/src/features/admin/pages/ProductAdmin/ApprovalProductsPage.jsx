// src/features/admin/pages/Product/ApprovalProductsPage.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
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
  Empty,
  Badge,
  Button,
  DatePicker,
  Select,
  Tooltip,
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
import axios from "axios";
import * as XLSX from "xlsx";
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

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// --- HELPER: PHÁT HIỆN RE-UP ---
const detectReupAttempts = (products) => {
  if (!Array.isArray(products)) return [];
  const blacklistHistory = products.filter((p) =>
    ["deleted", "banned", "rejected"].includes(p.status)
  );
  return products.map((currentProduct) => {
    if (["pending", "pending_update"].includes(currentProduct.status)) {
      const historyMatches = blacklistHistory.filter((oldProduct) => {
        const isSameSeller =
          oldProduct.seller?.id === currentProduct.seller?.id;
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
      const res = await api.get("/products/", { headers: getAuthHeaders() });
      const rawData = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setData(
        detectReupAttempts(rawData).sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )
      );
    } catch (err) {
      message.error("Không tải được dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

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
          if (["CREATE", "NEW_PRODUCT", "CREATED"].includes(action)) {
            message.info(`Sản phẩm mới: ${incoming.name}`);
            return detectReupAttempts([
              { ...incoming, is_new: true, isForcedVisible: true },
              ...prev,
            ]);
          }
          if (["UPDATE", "UPDATED", "PRODUCT_CHANGED"].includes(action)) {
            return detectReupAttempts(
              prev.map((p) => (p.id === incoming.id ? incoming : p))
            );
          }
          if (action === "DELETE")
            return prev.filter((p) => p.id !== incoming.id);
          return prev;
        });
      };
      socket.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWS, 3000);
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
    else if (val === "today")
      setDateRange([now.startOf("day"), now.endOf("day")]);
    else if (val === "7d")
      setDateRange([now.subtract(6, "day").startOf("day"), now.endOf("day")]);
    else if (val === "30d")
      setDateRange([now.subtract(29, "day").startOf("day"), now.endOf("day")]);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Nếu item mới tạo từ socket, luôn hiện
      if (item.isForcedVisible) return true;

      // 2. Logic Status Filter & Risk Filter (Kết hợp chặt chẽ)
      let matchesStatus = false;

      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "action_required") {
        // Logic: Phải là trạng thái chờ VÀ (nếu đang lọc Reup thì phải dính Reup, nếu không thì thôi)
        const isPending = ["pending", "pending_update"].includes(item.status);

        if (riskFilter === "reup") {
          // Tab "Nghi vấn Reup": Phải Pending + Có cờ Reup
          matchesStatus = isPending && item.is_reup;
        } else {
          // Tab "Chờ duyệt" thường: Chỉ cần Pending (hiện cả reup lẫn không reup hoặc chỉ không reup tùy bạn)
          // Ở đây để giống Tab "Chờ duyệt": Hiện tất cả các đơn đang chờ
          matchesStatus = isPending;
        }
      } else if (statusFilter === "banned") {
        matchesStatus = ["banned", "locked"].includes(item.status);
      } else {
        matchesStatus = item.status === statusFilter;
      }

      if (!matchesStatus) return false;

      // 3. Search & Selects (Giữ nguyên)
      const s = searchTerm.toLowerCase();
      if (
        searchTerm &&
        !(
          (item.name || "").toLowerCase().includes(s) ||
          (item.seller?.store_name || "").toLowerCase().includes(s)
        )
      )
        return false;
      if (sellerFilter && String(item.seller?.id) !== String(sellerFilter))
        return false;
      if (categoryFilter && String(item.category_id) !== String(categoryFilter))
        return false;

      // 4. Date (Giữ nguyên)
      if (dateRange?.[0] && dateRange?.[1]) {
        if (
          !dayjs(item.created_at).isBetween(
            dateRange[0],
            dateRange[1],
            null,
            "[]"
          )
        )
          return false;
      }
      return true;
    });
  }, [
    data,
    statusFilter,
    riskFilter,
    searchTerm,
    sellerFilter,
    categoryFilter,
    dateRange,
  ]);

  const stats = useMemo(
    () => ({
      total: data.length,
      pending: data.filter((i) =>
        ["pending", "pending_update"].includes(i.status)
      ).length,
      approved: data.filter((i) => i.status === "approved").length,
      rejected: data.filter((i) => i.status === "rejected").length,
      banned: data.filter((i) => ["banned", "locked"].includes(i.status))
        .length,
      reup: data.filter((i) => i.is_reup).length,
    }),
    [data]
  );

  // --- UI COMPONENTS ---
  const StatCard = ({ title, value, icon, color, active, onClick }) => (
    <Card
      hoverable
      onClick={onClick}
      className={`stat-card ${active ? "active" : ""}`}
      style={{
        borderRadius: 12,
        border: active ? `2px solid ${color}` : "1px solid #f0f0f0",
        background: active ? `${color}05` : "#fff",
        cursor: "pointer",
      }}
    >
      <Space size={16}>
        <div
          style={{
            background: `${color}15`,
            color,
            padding: 12,
            borderRadius: 10,
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div>
          <Text type="secondary" strong>
            {title}
          </Text>
          <Title level={4} style={{ margin: 0, color }}>
            {value}
          </Title>
        </div>
      </Space>
    </Card>
  );

  return (
    <AdminPageLayout
      title={
        <Space align="center" size="middle">
          <Typography.Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              textTransform: "uppercase", // In hoa để giống trang quản lý cửa hàng
              letterSpacing: "0.5px",
            }}
          >
            Kiểm duyệt sản phẩm
          </Typography.Title>

          {/* Cụm icon trạng thái WebSocket làm gọn lại */}
          <Space size={8}>
            <Badge status={wsConnected ? "processing" : "default"} />
            <CloudSyncOutlined
              style={{
                color: wsConnected ? "#52c41a" : "#d9d9d9",
                fontSize: "20px",
                verticalAlign: "middle",
              }}
            />
          </Space>
        </Space>
      }
    >
      <div style={{ padding: "0 24px 24px" }}>
        {/* STATS SECTION */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* 1. Tab CHỜ DUYỆT: Reset riskFilter về 'all' */}
          <Col xs={12} sm={8} md={4}>
            <StatCard
              title="Chờ duyệt"
              value={stats.pending}
              icon={<WarningOutlined />}
              color="#faad14"
              // Active khi: Đang lọc pending VÀ không lọc Reup
              active={
                statusFilter === "action_required" && riskFilter === "all"
              }
              onClick={() => {
                setStatusFilter("action_required");
                setRiskFilter("all"); // Quan trọng: Reset bộ lọc rủi ro
              }}
            />
          </Col>

          {/* 2. Tab ĐÃ DUYỆT */}
          <Col xs={12} sm={8} md={4}>
            <StatCard
              title="Đã duyệt"
              value={stats.approved}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              active={statusFilter === "approved"}
              onClick={() => {
                setStatusFilter("approved");
                setRiskFilter("all");
              }}
            />
          </Col>

          {/* 3. Tab TỪ CHỐI */}
          <Col xs={12} sm={8} md={4}>
            <StatCard
              title="Từ chối"
              value={stats.rejected}
              icon={<CloseCircleOutlined />}
              color="#ff4d4f"
              active={statusFilter === "rejected"}
              onClick={() => {
                setStatusFilter("rejected");
                setRiskFilter("all");
              }}
            />
          </Col>

          {/* 4. Tab ĐÃ KHÓA */}
          <Col xs={12} sm={8} md={4}>
            <StatCard
              title="Vi phạm/Khóa"
              value={stats.banned}
              icon={<StopOutlined />}
              color="#000"
              active={statusFilter === "banned"}
              onClick={() => {
                setStatusFilter("banned");
                setRiskFilter("all");
              }}
            />
          </Col>

          {/* 5. Tab NGHI VẤN REUP: Set status là pending VÀ risk là reup */}
          <Col xs={12} sm={8} md={4}>
            <StatCard
              title="Nghi vấn Reup"
              value={stats.reup}
              icon={<ReloadOutlined />}
              color="#722ed1"
              // Active khi: Đang lọc pending VÀ đang lọc Reup
              active={
                statusFilter === "action_required" && riskFilter === "reup"
              }
              onClick={() => {
                setStatusFilter("action_required");
                setRiskFilter("reup"); // Kích hoạt bộ lọc reup
              }}
            />
          </Col>

          {/* 6. Tab TẤT CẢ */}
          <Col xs={12} sm={8} md={4}>
            <StatCard
              title="Tất cả"
              value={stats.total}
              icon={<FileTextOutlined />}
              color="#1890ff"
              active={statusFilter === "all"}
              onClick={() => {
                setStatusFilter("all");
                setRiskFilter("all");
              }}
            />
          </Col>
        </Row>

        {/* FILTER BAR */}
        <Card
          bodyStyle={{ padding: 16 }}
          style={{ marginBottom: 16, borderRadius: 12 }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col flex="auto">
              <Space wrap size={12}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Tìm tên sản phẩm, shop..."
                  style={{ width: 250 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
                <Select
                  value={timeFilter}
                  onChange={handleTimeChange}
                  style={{ width: 130 }}
                >
                  <Option value="all">Mọi lúc</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="7d">7 ngày qua</Option>
                  <Option value="30d">30 ngày qua</Option>
                </Select>
                <RangePicker
                  value={dateRange}
                  onChange={(d) => {
                    setDateRange(d);
                    setTimeFilter("custom");
                  }}
                  style={{ width: 260 }}
                />
                <CategorySelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: 160 }}
                />
                <SellerSelect
                  value={sellerFilter}
                  onChange={setSellerFilter}
                  style={{ width: 160 }}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Tooltip title="Làm mới">
                  <Button icon={<ReloadOutlined />} onClick={fetchProducts} />
                </Tooltip>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    /* Export Logic */
                  }}
                >
                  Xuất Excel
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* MAIN TABLE */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        >
          {loading ? (
            <div style={{ padding: 100, textAlign: "center" }}>
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          ) : filteredData.length > 0 ? (
            <ProductManager
              data={filteredData}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              onApprove={(id) => {
                /* Approve Logic */
              }}
              onReject={(id, reason) => {
                /* Reject Logic */
              }}
              onView={(r) => {
                setSelectedProduct(r);
                setDrawerVisible(true);
              }}
              onViewShop={(s) => {
                setSelectedShopProfile(s);
                setShopDrawerVisible(true);
              }}
            />
          ) : (
            <Empty
              style={{ padding: 60 }}
              description="Không tìm thấy sản phẩm nào khớp với bộ lọc"
            />
          )}
        </Card>
      </div>

      <ProductDetailDrawer
        visible={drawerVisible}
        product={selectedProduct}
        onClose={() => setDrawerVisible(false)}
      />
      <ShopDetailDrawer
        visible={shopDrawerVisible}
        shopData={selectedShopProfile}
        onClose={() => setShopDrawerVisible(false)}
      />
    </AdminPageLayout>
  );
};

export default ApprovalProductsPage;
