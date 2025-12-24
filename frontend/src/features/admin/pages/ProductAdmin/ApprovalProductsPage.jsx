import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  message,
  Tabs,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Input,
  Spin,
  Empty,
  Badge,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  FileTextOutlined,
  RocketOutlined,
  SearchOutlined,
  LockOutlined,
  CloudSyncOutlined,
} from "@ant-design/icons";
import axios from "axios";

// Import Components
import ProductManager from "../../components/ProductAdmin/Product/ProductManager";
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ProductComparisonModal from "../../components/ProductAdmin/Product/ProductComparisonModal";
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
        const isSameSeller =
          oldProduct.seller?.id === currentProduct.seller?.id;
        const isNotSelf = oldProduct.id !== currentProduct.id;
        const cleanNameCurrent = currentProduct.name?.trim().toLowerCase();
        const cleanNameOld = oldProduct.name?.trim().toLowerCase();
        return isSameSeller && isNotSelf && cleanNameCurrent === cleanNameOld;
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("action_required");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shopDrawerVisible, setShopDrawerVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedComparisonProduct, setSelectedComparisonProduct] =
    useState(null);

  // --- 1. SỬ DỤNG REF ĐỂ QUẢN LÝ SOCKET (CHỐNG LẶP) ---
  const socketRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });
      const rawData = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      const processedData = detectReupAttempts(rawData);
      setData(
        processedData.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )
      );
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      message.error("Không tải được dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. QUẢN LÝ WEBSOCKET VỚI CƠ CHẾ DỌN DẸP AN TOÀN ---
  useEffect(() => {
    fetchProducts(); // Tải dữ liệu lần đầu

    const token = localStorage.getItem("token");
    if (!token) return;

    // QUAN TRỌNG: Kiểm tra kĩ backend dùng /ws/ hay /api/ws/
    // Dựa trên log của bạn, URL là: ws://192.168.1.35:8000/api/ws/admin/products/
    const wsUrl = `ws://192.168.1.35:8000/api/ws/admin/products/?token=${token}`;

    const connectWS = () => {
      // Nếu socket hiện tại đang kết nối hoặc đã mở, không tạo mới
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.CONNECTING ||
          socketRef.current.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      console.log("🚀 Đang khởi tạo kết nối Realtime...");
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("✅ Đã kết nối Realtime Product Stream");
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (
            response.type === "PRODUCT_CHANGED" ||
            response.type === "NEW_PRODUCT"
          ) {
            const updatedProduct = response.data;
            setData((prevData) => {
              const index = prevData.findIndex(
                (p) => p.id === updatedProduct.id
              );
              let newData =
                index !== -1
                  ? prevData.map((p, i) => (i === index ? updatedProduct : p))
                  : [updatedProduct, ...prevData];
              return detectReupAttempts(newData);
            });
            if (response.type === "NEW_PRODUCT")
              message.info(`Sản phẩm mới: ${updatedProduct.name}`);
          }
        } catch (e) {
          console.error("Lỗi xử lý dữ liệu WS:", e);
        }
      };

      socket.onerror = (err) => console.error("❌ Lỗi WebSocket:", err);

      socket.onclose = (e) => {
        console.log("ℹ️ Đã ngắt kết nối Realtime:", e.code);
        setWsConnected(false);
      };

      socketRef.current = socket;
    };

    connectWS();

    return () => {
      // Dọn dẹp: Chỉ đóng nếu socket đang thực sự mở
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bỏ fetchProducts khỏi mảng phụ thuộc để tránh loop

  // --- 3. FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      let matchesTab =
        activeTab === "all" ||
        (activeTab === "action_required"
          ? ["pending", "pending_update"].includes(item.status)
          : activeTab === "banned"
            ? ["banned", "locked"].includes(item.status)
            : item.status === activeTab);

      if (!matchesTab) return false;

      if (["action_required", "pending"].includes(activeTab)) {
        if (
          riskFilter === "suspicious" &&
          !(item.ai_score >= 80 || item.is_flagged)
        )
          return false;
        if (riskFilter === "new_shop") {
          const days =
            (new Date() - new Date(item.seller?.created_at || 0)) / 86400000;
          if (days > 7) return false;
        }
        if (riskFilter === "reup" && !item.is_reup) return false;
      }

      const searchKey = searchTerm.toLowerCase();
      const matchesSearch =
        (item.name || "").toLowerCase().includes(searchKey) ||
        (item.seller?.store_name || "").toLowerCase().includes(searchKey);
      const matchesSeller =
        !sellerFilter || String(item.seller?.id) === String(sellerFilter);
      const matchesCategory =
        !categoryFilter || String(item.category_id) === String(categoryFilter);

      return matchesSearch && matchesSeller && matchesCategory;
    });
  }, [data, activeTab, riskFilter, searchTerm, sellerFilter, categoryFilter]);

  // --- ACTIONS ---
  const processApproval = async (idOrIds, isReject = false, reason = "") => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const hideLoading = message.loading("Đang xử lý...", 0);
    try {
      const path = isReject ? "reject" : "approve";
      await Promise.all(
        ids.map((id) =>
          api.post(`/products/${id}/${path}/`, isReject ? { reason } : {}, {
            headers: getAuthHeaders(),
          })
        )
      );
      message.success("Thành công");
      fetchProducts();
      setSelectedRowKeys([]);
    } catch (e) {
      message.error("Lỗi xử lý");
    } finally {
      hideLoading();
    }
  };

  const tabCounts = useMemo(
    () => ({
      action: data.filter((i) =>
        ["pending", "pending_update"].includes(i.status)
      ).length,
      approved: data.filter((i) => i.status === "approved").length,
      banned: data.filter((i) => ["banned", "locked"].includes(i.status))
        .length,
      rejected: data.filter((i) => i.status === "rejected").length,
    }),
    [data]
  );

  const FilterStatCard = ({ title, icon, value, color, active, onClick }) => (
    <Card
      hoverable
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: 12,
        border: active ? `2px solid ${color}` : "1px solid #f0f0f0",
        background: active ? `${color}08` : "#fff",
      }}
    >
      <Space style={{ display: "flex", justifyContent: "space-between" }}>
        <Space>
          <div
            style={{
              padding: 8,
              borderRadius: "50%",
              background: `${color}20`,
              color: color,
            }}
          >
            {icon}
          </div>
          <Text strong>{title}</Text>
        </Space>
        <Text strong style={{ fontSize: 20, color: color }}>
          {value}
        </Text>
      </Space>
    </Card>
  );

  return (
    <AdminPageLayout
      title={
        <Space>
          KIỂM DUYỆT SẢN PHẨM{" "}
          <Badge status={wsConnected ? "processing" : "default"} />{" "}
          <CloudSyncOutlined
            style={{ color: wsConnected ? "#52c41a" : "#d9d9d9" }}
          />
        </Space>
      }
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <Card
          bordered={false}
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <div style={{ background: "#fafafa", padding: "16px 24px 0" }}>
            <Tabs
              activeKey={activeTab}
              onChange={(k) => {
                setActiveTab(k);
                setRiskFilter("all");
              }}
              items={[
                {
                  label: (
                    <Space>
                      <WarningOutlined /> Cần xử lý{" "}
                      <Badge
                        count={tabCounts.action}
                        style={{ backgroundColor: "#faad14" }}
                      />
                    </Space>
                  ),
                  key: "action_required",
                },
                { label: `Đã duyệt (${tabCounts.approved})`, key: "approved" },
                { label: `Đã khóa (${tabCounts.banned})`, key: "banned" },
                { label: `Từ chối (${tabCounts.rejected})`, key: "rejected" },
                { label: "Tất cả", key: "all" },
              ]}
            />
          </div>

          <div style={{ padding: 24 }}>
            {["action_required", "pending"].includes(activeTab) && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <FilterStatCard
                    title="Tất cả"
                    icon={<FileTextOutlined />}
                    value={tabCounts.action}
                    color="#1890ff"
                    active={riskFilter === "all"}
                    onClick={() => setRiskFilter("all")}
                  />
                </Col>
                <Col span={8}>
                  <FilterStatCard
                    title="Shop mới"
                    icon={<RocketOutlined />}
                    value={
                      data.filter(
                        (i) =>
                          (new Date() - new Date(i.seller?.created_at || 0)) /
                            86400000 <=
                          7
                      ).length
                    }
                    color="#faad14"
                    active={riskFilter === "new_shop"}
                    onClick={() => setRiskFilter("new_shop")}
                  />
                </Col>
                <Col span={8}>
                  <FilterStatCard
                    title="Nghi vấn Re-up"
                    icon={<ReloadOutlined />}
                    value={data.filter((i) => i.is_reup).length}
                    color="#f5222d"
                    active={riskFilter === "reup"}
                    onClick={() => setRiskFilter("reup")}
                  />
                </Col>
              </Row>
            )}

            <Space style={{ marginBottom: 20 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm sản phẩm, shop..."
                style={{ width: 300 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <SellerSelect style={{ width: 200 }} onChange={setSellerFilter} />
              <CategorySelect
                style={{ width: 200 }}
                onChange={setCategoryFilter}
              />
            </Space>

            {loading ? (
              <Spin
                size="large"
                style={{ display: "block", margin: "50px auto" }}
              />
            ) : filteredData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <ProductManager
                data={filteredData}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                onApprove={(ids) => processApproval(ids, false)}
                onReject={(ids, reason) => processApproval(ids, true, reason)}
                onView={(r) => {
                  setSelectedProduct(r);
                  setDrawerVisible(true);
                }}
                onViewShop={(s) => {
                  setSelectedShopProfile(s);
                  setShopDrawerVisible(true);
                }}
              />
            )}
          </div>
        </Card>
      </div>

      <ProductDetailDrawer
        visible={drawerVisible}
        product={selectedProduct}
        onClose={() => setDrawerVisible(false)}
        onApprove={() => processApproval(selectedProduct?.id, false)}
        onReject={() =>
          processApproval(selectedProduct?.id, true, "Từ chối từ Drawer")
        }
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
