import React, {
  useEffect,
  useState,
  useMemo,
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
  Badge,
  Button,
  DatePicker,
  Select,
} from "antd";
import {
  CloudSyncOutlined,
  WarningOutlined,
  FileTextOutlined,
  RocketOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
// Use shared axios client that injects auth token and handles refresh
import axios from "axios";
import axiosClient from "../../services/axiosClient";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom"; // [MỚI] Import để xử lý URL

// Import Components
import ProductManager from "../../components/ProductAdmin/Product/ProductManager";
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ShopDetailDrawer from "../../components/ProductAdmin/Product/ShopDetailDrawer";
import { getWSBaseUrl } from "../../../../utils/ws";
import useDebounce from "../../../../hooks/useDebounce";

// --- CONFIGURATION ---
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const api = axiosClient;

// --- HELPER LOGIC ---
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
        return { ...currentProduct, is_reup: true, reupHistory: historyMatches };
      }
    }
    return { ...currentProduct, is_reup: false, reupHistory: [] };
  });
};

const ApprovalProductsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams(); // [MỚI] Hook lấy params từ URL

  // --- STATE INIT FROM URL ---
  // Khởi tạo state dựa trên URL param, nếu không có thì lấy mặc định
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "action_required");
  const [riskFilter, setRiskFilter] = useState(searchParams.get("risk") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status_filter") || "all");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sellerFilter, setSellerFilter] = useState(searchParams.get("seller") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 10);

  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // State lọc ngày (Không lưu URL vì phức tạp khi parse lại, để mặc định)
  const [dateRange, setDateRange] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all"); 

  // Modal State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shopDrawerVisible, setShopDrawerVisible] = useState(false);
  const [selectedShopProfile, setSelectedShopProfile] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef(null);

  // --- HELPER UPDATE URL ---
  const updateURL = (key, value) => {
    setSearchParams((prev) => {
      if (value && value !== "all" && value !== "") {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    }, { replace: true });
  };

  // --- HANDLERS (Cập nhật State + URL) ---
  const handleTabChange = (key) => {
    setActiveTab(key);
    setRiskFilter("all");
    setCurrentPage(1);
    
    // Update URL
    setSearchParams((prev) => {
      prev.set("tab", key);
      prev.delete("risk");
      prev.set("page", 1);
      return prev;
    });
  };

  const handleRiskChange = (val) => {
    setRiskFilter(val);
    // reset to first page when filter changes
    setCurrentPage(1);
    setSearchParams((prev) => {
      if (val && val !== "all") prev.set("risk", val); else prev.delete("risk");
      prev.set("page", 1);
      return prev;
    }, { replace: true });
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    // reset to first page
    setCurrentPage(1);
    setSearchParams((prev) => {
      if (val && val !== "all") prev.set("status_filter", val); else prev.delete("status_filter");
      prev.set("page", 1);
      return prev;
    }, { replace: true });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    // Reset to first page when searching
    setCurrentPage(1);
    setSearchParams((prev) => {
      if (val) prev.set("search", val); else prev.delete("search");
      prev.set("page", 1);
      return prev;
    }, { replace: true });
  };

  const handleSellerChange = (val) => {
    setSellerFilter(val);
    setCurrentPage(1);
    setSearchParams((prev) => {
      if (val) prev.set("seller", val); else prev.delete("seller");
      prev.set("page", 1);
      return prev;
    }, { replace: true });
  };

  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setCurrentPage(1);
    setSearchParams((prev) => {
      if (val) prev.set("category", val); else prev.delete("category");
      prev.set("page", 1);
      return prev;
    }, { replace: true });
  };

  const handlePageChange = (page, pSize) => {
    setCurrentPage(page);
    setPageSize(pSize);
    setSearchParams((prev) => {
      prev.set("page", page);
      prev.set("pageSize", pSize);
      return prev;
    });
  };

  // --- 1. FETCH DATA WITH REACT QUERY ---
  const { data: countsData, refetch: refetchCounts } = useQuery({
    queryKey: ["adminProductCounts"],
    queryFn: async () => {
      const res = await api.get("/products/counts/");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Use a stable string key for dateRange to avoid object identity issues
  const dateRangeKey = dateRange && dateRange[0] && dateRange[1] ? `${dateRange[0].format("YYYY-MM-DD")}_${dateRange[1].format("YYYY-MM-DD")}` : "all";

  const { data: productsData, isLoading: loading, isError, refetch: refetchProducts } = useQuery({
    queryKey: ["adminProducts", activeTab, statusFilter, riskFilter, debouncedSearch, sellerFilter, categoryFilter, dateRangeKey, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        // Determine status param: if viewing 'all' and statusFilter is set, use it; otherwise use activeTab
        status: (activeTab === 'all' && statusFilter && statusFilter !== 'all') ? statusFilter : activeTab,
        // Lưu ý: Nếu risk_filter = 'reup', backend có thể không xử lý, ta xử lý ở client bên dưới
        // Vẫn gửi lên để backend biết ngữ cảnh nếu cần
        risk_filter: riskFilter, 
        search: debouncedSearch,
        seller: sellerFilter,
        category: categoryFilter,
        page: currentPage,
        page_size: pageSize,
      });
      if (dateRange?.[0] && dateRange?.[1]) {
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      }

      const res = await api.get(`/products/admin_overview/?${params.toString()}`);
      const raw = res.data.results || [];
      // Use backend-provided is_reup when available; default to false
      const processedData = raw.map((p) => ({ ...p, is_reup: p.is_reup || false }));
      return {
        products: processedData,
        total: res.data.count || processedData.length,
      };
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });

  // --- XỬ LÝ LỌC HIỂN THỊ CLIENT (Fix lỗi bấm Re-up không lọc) ---
  const products = useMemo(() => {
    let list = productsData?.products || [];

    // Nếu chọn bộ lọc Re-up, lọc danh sách hiện tại
    if (riskFilter === "reup") {
      return list.filter((item) => item.is_reup);
    }
    
    // Nếu chọn bộ lọc Shop mới
    if (riskFilter === "new_shop") {
      // Backend có thể đã lọc rồi, hoặc lọc thêm ở đây nếu cần
      // return list.filter((item) => item.seller?.is_new);
    }

    return list;
  }, [productsData, riskFilter]);

  const totalProducts = productsData?.total || 0;

  // --- HÀM LÀM MỚI (RESET & RELOAD) ---
  const handleReload = async () => {
    try {
      // Reset lại tất cả bộ lọc và trở về page 1 (hành vi ban đầu)
      setSearchTerm("");
      setSellerFilter("");
      setCategoryFilter("");
      setTimeFilter("all");
      setDateRange(null);
      setStatusFilter("all");
      setRiskFilter("all");
      setCurrentPage(1);
      setPageSize(10);
      setSelectedRowKeys([]);

      // Cập nhật URL: giữ tab hiện tại, set page=1 và xóa params khác
      setSearchParams((prev) => {
        prev.set("tab", activeTab);
        prev.set("page", 1);
        prev.delete("risk");
        prev.delete("search");
        prev.delete("seller");
        prev.delete("category");
        prev.delete("status_filter");
        prev.delete("start_date");
        prev.delete("end_date");
        prev.delete("pageSize");
        return prev;
      }, { replace: true });

      // Invalidate cache và ép refetch
      await Promise.all([
        queryClient.invalidateQueries(["adminProducts"]),
        queryClient.invalidateQueries(["adminProductCounts"]),
      ]);

      await Promise.all([refetchProducts(), refetchCounts()]);

      message.success("Đã làm mới và đặt lại bộ lọc");
    } catch (e) {
      console.error("Reload error:", e);
      message.error("Làm mới thất bại");
    }
  };

  // --- 2. WEBSOCKET ---
  useEffect(() => {
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
    let reconnectTimeout;

    const connectWS = () => {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ [ADMIN] Product WS connected");
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const action = payload.action || payload.type;
          
          queryClient.invalidateQueries(["adminProducts"]);
          queryClient.invalidateQueries(["adminProductCounts"]);

          if (["CREATE", "NEW_PRODUCT", "CREATED"].includes(action)) {
            message.info(`Có sản phẩm mới: ${payload.data?.name || ""}`);
          }
        } catch (err) {
          console.error("[ADMIN WS] error:", err);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, [queryClient]);

  // --- SYNC STATE WHEN URL PARAMS CHANGE (e.g., back/forward or external link) ---
  useEffect(() => {
    // use searchParams.toString() to trigger when query changes
    const qp = searchParams.toString();
    setActiveTab(searchParams.get("tab") || "action_required");
    setRiskFilter(searchParams.get("risk") || "all");
    setSearchTerm(searchParams.get("search") || "");
    setSellerFilter(searchParams.get("seller") || "");
    setCategoryFilter(searchParams.get("category") || "");
    setCurrentPage(Number(searchParams.get("page")) || 1);
    setPageSize(Number(searchParams.get("pageSize")) || 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // --- 3. LOGIC LỌC NGÀY ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const now = dayjs();
    
    switch (val) {
      case "all": setDateRange(null); break;
      case "today": setDateRange([now.startOf('day'), now.endOf('day')]); break;
      case "7d": setDateRange([now.subtract(6, "day").startOf('day'), now.endOf('day')]); break;
      case "30d": setDateRange([now.subtract(29, "day").startOf('day'), now.endOf('day')]); break;
      default: break;
    }
    // When changing time filter, reset to first page
    setCurrentPage(1);
    setSearchParams((prev) => {
      prev.set("page", 1);
      return prev;
    }, { replace: true });
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
    // Reset page when changing custom range
    setCurrentPage(1);
    setSearchParams((prev) => { prev.set("page", 1); return prev; }, { replace: true });
  };

  const tabCounts = useMemo(() => ({
    action: countsData?.action_required || 0,
    approved: countsData?.approved || 0,
    banned: countsData?.banned || 0,
    rejected: countsData?.rejected || 0,
    new_shop: countsData?.new_shop || 0,
  }), [countsData]);

  const handleExportExcel = () => {
    if (products.length === 0) { message.warning("Không có dữ liệu để xuất"); return; }
    const exportData = products.map((item) => ({
      ID: item.id, "Tên sản phẩm": item.name, "Người bán": item.seller?.store_name || "N/A",
      "Danh mục": item.category_name || "N/A", "Giá (VNĐ)": item.price, "Trạng thái": item.status,
      "Ngày tạo": dayjs(item.created_at).format("DD/MM/YYYY HH:mm"),
      "Re-up": item.is_reup ? "Có" : "Không",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachSanPham");
    XLSX.writeFile(workbook, `KiemDuyetSP_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  const processApproval = async (idOrIds, isReject = false, reason = "") => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const hideLoading = message.loading("Đang xử lý...", 0);
    try {
      const path = isReject ? "reject" : "approve";
      await Promise.all(ids.map((id) => api.post(`/products/${id}/${path}/`, isReject ? { reason } : {})));
      message.success("Thành công");
      refetchProducts();
      refetchCounts();
      setSelectedRowKeys([]);
    } catch (e) { message.error("Lỗi xử lý"); } finally { hideLoading(); }
  };

  const FilterStatCard = ({ title, icon, value, color, active, onClick }) => (
    <Card hoverable onClick={onClick} style={{ cursor: "pointer", borderRadius: 12, border: active ? `2px solid ${color}` : "1px solid #f0f0f0", background: active ? `${color}08` : "#fff" }}>
      <Space style={{ display: "flex", justifyContent: "space-between" }}>
        <Space><div style={{ padding: 8, borderRadius: "50%", background: `${color}20`, color: color }}>{icon}</div><Text strong>{title}</Text></Space>
        <Text strong style={{ fontSize: 20, color: color }}>{value}</Text>
      </Space>
    </Card>
  );

  return (
    <AdminPageLayout title={<Space>KIỂM DUYỆT SẢN PHẨM <Badge status={wsConnected ? "processing" : "default"} /> <CloudSyncOutlined style={{ color: wsConnected ? "#52c41a" : "#d9d9d9" }} /></Space>}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ background: "#fafafa", padding: "16px 24px 0" }}>
            <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
                { label: (<Space><WarningOutlined /> Cần xử lý <Badge count={tabCounts.action} style={{ backgroundColor: "#faad14" }} /></Space>), key: "action_required" },
                { label: `Đã duyệt (${tabCounts.approved})`, key: "approved" },
                { label: `Đã khóa (${tabCounts.banned})`, key: "banned" },
                { label: `Từ chối (${tabCounts.rejected})`, key: "rejected" },
                { label: "Tất cả", key: "all" },
              ]} />
          </div>

          <div style={{ padding: 24 }}>
            {["action_required", "pending"].includes(activeTab) && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}><FilterStatCard title="Tất cả" icon={<FileTextOutlined />} value={tabCounts.action} color="#1890ff" active={riskFilter === "all"} onClick={() => handleRiskChange("all")} /></Col>
                <Col span={8}><FilterStatCard title="Shop mới" icon={<RocketOutlined />} value={tabCounts.new_shop} color="#faad14" active={riskFilter === "new_shop"} onClick={() => handleRiskChange("new_shop")} /></Col>
                <Col span={8}><FilterStatCard title="Nghi vấn Re-up" icon={<ReloadOutlined />} value="?" color="#f5222d" active={riskFilter === "reup"} onClick={() => handleRiskChange("reup")} /></Col>
              </Row>
            )}

            <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <Space wrap align="center">
                <Input prefix={<SearchOutlined />} placeholder="Tìm sản phẩm, shop..." style={{ width: 220 }} value={searchTerm} onChange={handleSearchChange} allowClear />
                
                <Select value={timeFilter} onChange={handleTimeChange} style={{ width: 130 }}>
                  <Option value="all">Toàn bộ</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="7d">7 ngày qua</Option>
                  <Option value="30d">30 ngày qua</Option>
                  <Option value="custom">Tùy chọn</Option>
                </Select>

                <RangePicker value={dateRange} onChange={handleRangePickerChange} format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} style={{ width: 240 }} />

                <SellerSelect style={{ width: 150 }} onChange={handleSellerChange} value={sellerFilter} />
                <CategorySelect style={{ width: 150 }} onChange={handleCategoryChange} value={categoryFilter} />
                {activeTab === 'all' && (
                  <Select value={statusFilter} onChange={handleStatusFilterChange} style={{ width: 160 }}>
                    <Option value="all">Tất cả trạng thái</Option>
                    <Option value="pending">Chờ duyệt</Option>
                    <Option value="pending_update">Chờ cập nhật</Option>
                    <Option value="approved">Đã duyệt</Option>
                    <Option value="rejected">Bị từ chối</Option>
                    <Option value="banned">Bị khóa</Option>
                    <Option value="hidden">Ẩn</Option>
                  </Select>
                )}
              </Space>

              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReload} title="Làm mới">Làm mới</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
              </Space>
            </div>

            {isError ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <Text type="danger">Không thể tải dữ liệu sản phẩm.</Text>
                <Button onClick={() => refetchProducts()} icon={<ReloadOutlined />}>Thử lại</Button>
              </Card>
            ) : loading && products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
            ) : (
              <ProductManager 
                data={products} 
                selectedRowKeys={selectedRowKeys} 
                setSelectedRowKeys={setSelectedRowKeys} 
                onApprove={(ids) => processApproval(ids, false)} 
                onReject={(ids, reason) => processApproval(ids, true, reason)} 
                onView={(r) => { setSelectedProduct(r); setDrawerVisible(true); }} 
                onViewShop={(s) => { setSelectedShopProfile(s); setShopDrawerVisible(true); }}
                onCompare={(r) => { message.info("Tính năng so sánh (Mock)"); }}
                onLock={(ids, reason) => { message.info(`Khóa sản phẩm ${ids} vì: ${reason}`); }}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalProducts,
                  onChange: handlePageChange,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                loading={loading}
              />
            )}
          </div>
        </Card>
      </div>
      <ProductDetailDrawer visible={drawerVisible} product={selectedProduct} onClose={() => setDrawerVisible(false)} />
      <ShopDetailDrawer visible={shopDrawerVisible} onClose={() => setShopDrawerVisible(false)} shopData={selectedShopProfile} />
    </AdminPageLayout>
  );
};

export default ApprovalProductsPage;