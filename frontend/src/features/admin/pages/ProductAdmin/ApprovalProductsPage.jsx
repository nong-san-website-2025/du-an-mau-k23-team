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
import { getWSBaseUrl } from "../../../../utils/ws";
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
    fetchProducts();

    const token = localStorage.getItem("token");
    if (!token) return;

    let wsUrl;
    try {
      const base = getWSBaseUrl();
      wsUrl = `${base}/ws/admin/products/?token=${token}`;
    } catch (e) {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const hostFallback = process.env.REACT_APP_WS_URL || window.location.host;
      wsUrl = `${protocol}://${hostFallback.replace(/^https?:\/\//, "")}/ws/admin/products/?token=${token}`;
    }

    let socket;
    let isStopped = false;
    let reconnectTimeout;

    const connectWS = () => {
      if (isStopped) return;
      console.debug("[ADMIN WS] connecting to", wsUrl);

      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isStopped) {
          socket.close();
          return;
        }
        console.log("✅ [ADMIN] Product WS connected");
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        if (isStopped) return;
        try {
          const raw = event.data;
          console.debug("[ADMIN WS] raw message:", raw);
          const payload = JSON.parse(raw);

          const action = payload.action || payload.type;
          const incoming = payload.data;
          if (!incoming || !incoming.id) return;

          setData((prev) => {
            switch (action) {
              case "CREATE":
              case "NEW_PRODUCT":
              case "CREATED": {
                const productWithFlags = {
                  ...incoming,
                  is_new: true,
                  isForcedVisible: true,
                };
                // avoid duplicate entries
                if (prev.some((p) => p.id === productWithFlags.id)) {
                  const next = detectReupAttempts(
                    prev.map((p) =>
                      p.id === productWithFlags.id
                        ? { ...p, ...productWithFlags }
                        : p
                    )
                  ).sort(
                    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
                  );
                  console.debug(
                    "[ADMIN WS] setData (dup-update) length:",
                    next.length
                  );
                  return next;
                }
                const next = detectReupAttempts([
                  productWithFlags,
                  ...prev,
                ]).sort(
                  (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
                );
                console.debug(
                  "[ADMIN WS] setData (prepend) length:",
                  next.length
                );
                return next;
              }
              case "UPDATE":
              case "UPDATE_PRODUCT":
              case "UPDATED": {
                const next = detectReupAttempts(
                  prev.map((p) => (p.id === incoming.id ? incoming : p))
                ).sort(
                  (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
                );
                console.debug(
                  "[ADMIN WS] setData (update) length:",
                  next.length
                );
                return next;
              }
              case "DELETE":
              case "DELETED":
                const next = prev.filter((p) => p.id !== incoming.id);
                console.debug(
                  "[ADMIN WS] setData (delete) length:",
                  next.length
                );
                return next;
              default:
                return prev;
            }
          });

          if (
            action === "CREATE" ||
            action === "NEW_PRODUCT" ||
            action === "CREATED"
          ) {
            message.success(`🆕 Sản phẩm mới: ${incoming.name}`);

            // Keep the new item visible regardless of active filters for a short time.
            // Remove the highlight/forced visibility after 8 seconds.
            setTimeout(() => {
              setData((prev) =>
                prev.map((p) =>
                  p.id === incoming.id
                    ? { ...p, is_new: false, isForcedVisible: false }
                    : p
                )
              );
            }, 8000);
          }
        } catch (err) {
          console.error("[ADMIN WS] message parse/error:", err, event.data);
        }
      };

      socket.onerror = (err) => {
        if (isStopped) return;
        console.error("[ADMIN WS] error", err);
        setWsConnected(false);
      };

      socket.onclose = (ev) => {
        if (isStopped) return;
        console.warn("[ADMIN WS] closed", ev);
        setWsConnected(false);
        socketRef.current = null;
        
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      isStopped = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
      socketRef.current = null;
    };
  }, []); // Bỏ fetchProducts khỏi mảng phụ thuộc để tránh loop

  // --- 3. FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // If an item was force-inserted from WS, always show it regardless of filters
      if (item.isForcedVisible) return true;
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
