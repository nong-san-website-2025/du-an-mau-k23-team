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
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  ReloadOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined, // Thay cho 🎯
  FileTextOutlined, // Thay cho 📋
  RocketOutlined, // Thay cho 🆕
  HistoryOutlined, // Thay cho ♻️
  ExclamationCircleOutlined, // Thay cho ⚠️
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

// Import components
import ProductTable from "../../components/ProductAdmin/Product/ProductTable";
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ProductComparisonModal from "../../components/ProductAdmin/Product/ProductComparisonModal";
import ShopDetailDrawer from "../../components/ProductAdmin/Product/ShopDetailDrawer";

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
  backgroundColor: isActive ? `${color}10` : "#fff",
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
  const [activeTab, setActiveTab] = useState("action_required");
  const [riskFilter, setRiskFilter] = useState("all");

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

  // --- Fetch Data & Logic Thám Tử ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });

      // ==================================================================
      // 🕵️‍♂️ LOGIC THÁM TỬ: PHÁT HIỆN RE-UP (ĐÃ SỬA)
      // ==================================================================
      let rawData = [
        // 1. Sản phẩm Lịch sử (Đã bị từ chối trước đây)
        {
          id: 9991,
          name: "Kem Trộn Trắng Cấp Tốc",
          price: "150000",
          status: "rejected", // Đã bị từ chối
          updated_at: "2023-10-01T10:00:00Z",
          seller: { id: 101, store_name: "Shop Mỹ Phẩm Ảo", avatar: null },
          images: [{ image: "https://via.placeholder.com/150" }],
        },
        {
          id: 9992,
          name: "Kem Trộn Trắng Cấp Tốc",
          price: "140000",
          status: "banned", // Đã bị cấm
          updated_at: "2023-10-05T14:30:00Z",
          seller: { id: 101, store_name: "Shop Mỹ Phẩm Ảo", avatar: null },
          images: [{ image: "https://via.placeholder.com/150" }],
        },

        // 2. Sản phẩm Mới (Đang chờ duyệt - Cố tình đăng lại)
        {
          id: 1005, // ID mới
          name: "Kem Trộn Trắng Cấp Tốc", // Tên TRÙNG Y HỆT
          price: "160000",
          status: "pending", // Đang chờ duyệt
          updated_at: "2023-10-25T09:00:00Z",
          seller: { id: 101, store_name: "Shop Mỹ Phẩm Ảo", avatar: null }, // Cùng Seller ID
          images: [{ image: "https://via.placeholder.com/150" }],
          ai_score: 95, // Giả lập điểm rủi ro cao
        },

        // Giữ lại dữ liệu thật nếu muốn (hoặc comment dòng dưới để chỉ hiện data test)
        ...(Array.isArray(res.data) ? res.data : res.data.results || []),
      ];
      // A. Tạo danh sách đen: Các SP đã bị xóa/từ chối trước đây
      const blacklistHistory = rawData.filter((p) =>
        ["deleted", "banned", "rejected"].includes(p.status)
      );

      // B. Duyệt qua từng sản phẩm để kiểm tra
      const processedData = rawData.map((currentProduct) => {
        // Chỉ kiểm tra những sản phẩm đang chờ duyệt
        if (["pending", "pending_update"].includes(currentProduct.status)) {
          // --- SỬA ĐỔI QUAN TRỌNG: Dùng filter để tìm TẤT CẢ các lần trùng ---
          const historyMatches = blacklistHistory.filter((oldProduct) => {
            // 1. Phải cùng Shop
            const isSameSeller =
              oldProduct.seller?.id === currentProduct.seller?.id;

            // 2. Không so sánh với chính nó
            const isNotSelf = oldProduct.id !== currentProduct.id;

            // 3. Trùng Tên (Xử lý chữ hoa/thường và khoảng trắng)
            const cleanNameCurrent = currentProduct.name?.trim().toLowerCase();
            const cleanNameOld = oldProduct.name?.trim().toLowerCase();
            const isSameName = cleanNameCurrent === cleanNameOld;

            // 4. (Tùy chọn) Trùng Giá - Nếu bạn muốn chặt chẽ hơn
            // const isSamePrice = Number(oldProduct.price) === Number(currentProduct.price);

            // Điều kiện cuối cùng: Cùng người bán, khác ID, và trùng tên
            return isSameSeller && isNotSelf && isSameName;
          });

          // Nếu tìm thấy lịch sử trùng
          if (historyMatches.length > 0) {
            console.log(
              `⚠️ Phát hiện Re-up: ${currentProduct.name} trùng ${historyMatches.length} lần.`
            );
            return {
              ...currentProduct,
              is_reup: true, // Cờ đánh dấu để lọc
              reupHistory: historyMatches, // Lưu danh sách trùng để hiển thị chi tiết
            };
          }
        }
        // Không trùng thì trả về nguyên bản
        return { ...currentProduct, is_reup: false, reupHistory: [] };
      });

      // 2. Sắp xếp lại (Ưu tiên Re-up lên đầu)
      const sorted = processedData.sort((a, b) => {
        if (a.is_reup && !b.is_reup) return -1;
        if (!a.is_reup && b.is_reup) return 1;
        // Sau đó đến điểm AI (nếu có)
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

  const isNewShop = (item) => {
    if (!item.seller || !item.seller.created_at) return false;
    try {
      const createdDate = new Date(item.seller.created_at);
      const today = new Date();
      const diffTime = Math.abs(today - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch (e) {
      return false;
    }
  };

  // Logic check Re-up dựa trên flag đã tính ở fetchProducts
  const isReappearing = (item) => item.is_reup === true;

  // --- Thống kê ---
  const riskCounts = useMemo(() => {
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

  // --- Logic Lọc Dữ Liệu ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Tab Status
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

      // 2. Risk Filter
      if (["action_required", "pending"].includes(activeTab)) {
        if (riskFilter === "suspicious" && !isSuspicious(item)) return false;
        if (riskFilter === "new_shop" && !isNewShop(item)) return false;
        if (riskFilter === "reup" && !isReappearing(item)) return false;
      }

      // 3. Search
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
  // src/pages/ProductAdmin/Approval/ApprovalProductsPage.jsx

  const processApproval = async (idOrIds, isReject = false, reason = "") => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    setLoading(true);

    try {
      // Dùng Promise.all để xử lý nhiều sản phẩm cùng lúc (nếu chọn nhiều)
      await Promise.all(
        ids.map(async (id) => {
          // --- LOGIC GỌI API THẬT ---
          // Bạn hãy kiểm tra lại đường dẫn API của bạn.
          // Dưới đây là 2 trường hợp phổ biến, hãy chọn 1 cái đúng với Backend của bạn:

          // TRƯỜNG HỢP 1: API dạng PATCH cập nhật status
          /*
          const payload = isReject 
            ? { status: "rejected", reject_reason: reason } 
            : { status: "approved" };
          
          return api.patch(`/products/${id}/`, payload, { headers: getAuthHeaders() });
          */

          // TRƯỜNG HỢP 2: API có endpoint riêng để reject (Thường dùng hơn)
          if (isReject) {
            // Gửi lý do từ chối lên server
            return api.post(
              `/products/${id}/reject/`, // <-- Đường dẫn API Reject của bạn
              { reason: reason }, // <-- Body gửi lên
              { headers: getAuthHeaders() }
            );
          } else {
            // API Approve
            return api.post(
              `/products/${id}/approve/`, // <-- Đường dẫn API Approve của bạn
              {},
              { headers: getAuthHeaders() }
            );
          }
        })
      );

      // Thông báo và reload lại trang
      message.success(
        isReject
          ? `Đã từ chối ${ids.length} sản phẩm.`
          : `Đã duyệt ${ids.length} sản phẩm.`
      );

      // Reset lại các state
      fetchProducts(); // Load lại dữ liệu mới nhất từ server
      setSelectedRowKeys([]); // Xóa danh sách đã chọn
      setDrawerVisible(false); // Đóng drawer xem chi tiết
      setComparisonModalVisible(false); // Đóng modal so sánh
    } catch (e) {
      console.error("Lỗi duyệt/từ chối:", e);
      // Hiển thị lỗi chi tiết từ Server nếu có
      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.detail ||
        "Có lỗi xảy ra khi xử lý.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id) => processApproval(id, false);
  const handleReject = (id, reason) => processApproval(id, true, reason);
  const handleView = (record) => {
    setSelectedProduct(record);
    setDrawerVisible(true);
  };

  const handleViewShopProfile = (shopData) => {
    setSelectedShopProfile(shopData);
    setShopDrawerVisible(true);
  };

  // --- Tabs ---
  const counts = useMemo(
    () => ({
      action_required: data.filter((i) =>
        ["pending", "pending_update"].includes(i.status)
      ).length,
      approved: data.filter((i) => i.status === "approved").length,
      rejected: data.filter((i) => i.status === "rejected").length,
    }),
    [data]
  );

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

  // Helper cho Grid View
  const groupProductsBySeller = (productList) => {
    const groups = {};
    productList.forEach((product) => {
      const shopName = product.seller?.store_name || "Chưa đặt tên Shop";
      if (!groups[shopName]) {
        groups[shopName] = {
          shopName: shopName,
          avatar: product.seller?.avatar,
          products: [],
          ...product.seller, // Copy seller info
        };
      }
      groups[shopName].products.push(product);
    });
    return Object.values(groups);
  };

  return (
    <AdminPageLayout title="QUẢN LÝ & DUYỆT SẢN PHẨM">
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
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
          {/* --- FILTER CARDS --- */}
          {/* --- FILTER CARDS --- */}
          {["action_required", "pending"].includes(activeTab) && (
            <div style={{ marginBottom: 20 }}>
              <Text
                strong
                style={{ display: "block", marginBottom: 12, fontSize: 16 }}
              >
                <Space>
                  <DashboardOutlined style={{ color: "#1890ff" }} /> Phân loại
                  rủi ro:
                </Space>
              </Text>

              <Row gutter={[16, 16]}>
                {/* 1. THẺ TẤT CẢ */}
                <Col xs={24} md={8}>
                  <Card
                    hoverable
                    bodyStyle={{ padding: 20 }}
                    style={filterCardStyle(riskFilter === "all", "#1890ff")}
                    onClick={() => setRiskFilter("all")}
                  >
                    <Statistic
                      title={
                        <Space>
                          <FileTextOutlined /> <Text strong>Tất cả</Text>
                        </Space>
                      }
                      value={riskCounts.all}
                      prefix={<SafetyCertificateOutlined />}
                    />
                  </Card>
                </Col>

                {/* 2. THẺ SHOP MỚI */}
                <Col xs={24} md={8}>
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
                        <Space>
                          <RocketOutlined style={{ color: "#faad14" }} />
                          <Tag icon={<RocketOutlined />} color="green">
                            Shop mới
                          </Tag>
                        </Space>
                      }
                      value={riskCounts.new_shop}
                      prefix={<ShopOutlined style={{ color: "#faad14" }} />}
                      valueStyle={{ color: "#faad14" }}
                    />
                  </Card>
                </Col>

                {/* 3. THẺ RE-UP (SPAM) */}
                <Col xs={24} md={8}>
                  <Card
                    hoverable
                    bodyStyle={{ padding: 20 }}
                    style={filterCardStyle(riskFilter === "reup", "#722ed1")}
                    onClick={() => setRiskFilter("reup")}
                  >
                    <Statistic
                      title={
                        <Space>
                          <HistoryOutlined style={{ color: "#722ed1" }} />
                          <Text style={{ color: "#722ed1" }} strong>
                            Tái xuất hiện (Spam)
                          </Text>
                        </Space>
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

          {/* --- TOOLBAR --- */}
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

          {/* --- CONTENT AREA --- */}
          {loading && !data.length ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* VIEW 1: GRID CHO SHOP MỚI */}
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
                          {/* Shop Avatar & Name Logic Here (Copy from your original code) */}
                          <Title level={5} style={{ margin: 0 }}>
                            {shop.shopName}
                          </Title>
                        </div>
                        <Tag color="green">Shop mới</Tag>
                      </div>
                      {/* List products inside shop card */}
                      <div
                        style={{
                          padding: "0 16px",
                          maxHeight: "250px",
                          overflowY: "auto",
                        }}
                      >
                        {shop.products.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: "10px 0",
                              borderBottom: "1px solid #f5f5f5",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text style={{ maxWidth: 180 }} ellipsis>
                              {p.name}
                            </Text>
                            <Text type="danger">
                              {parseInt(p.price).toLocaleString()}đ
                            </Text>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#fafafa",
                          textAlign: "right",
                        }}
                      >
                        <a onClick={() => handleViewShopProfile(shop)}>
                          Xem hồ sơ Shop &rarr;
                        </a>
                      </div>
                    </Card>
                  ))}
                  {filteredData.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center" }}>
                      Không có dữ liệu.
                    </div>
                  )}
                </div>
              ) : (
                // VIEW 2: TABLE CHO CÁC TRƯỜNG HỢP KHÁC
                <div>
                  {riskFilter === "reup" && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "10px 16px",
                        background: "#fff1f0",
                        border: "1px solid #ffa39e",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {/* Thay icon Reload bằng Warning hoặc Exclamation */}
                      <ExclamationCircleOutlined
                        style={{ color: "#cf1322", fontSize: 18 }}
                      />
                      <Text type="danger" strong>
                        Cảnh báo: Danh sách sản phẩm nghi ngờ cố tình đăng lại
                        (Re-up) sau khi bị xóa/từ chối.
                      </Text>
                    </div>
                  )}
                  {/* TRUYỀN DATA ĐÃ XỬ LÝ VÀO TABLE */}
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

      {/* Drawers & Modals */}
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
