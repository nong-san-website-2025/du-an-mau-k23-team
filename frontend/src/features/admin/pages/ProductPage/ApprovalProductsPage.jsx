import React, { useEffect, useState, useMemo } from "react";
import {
  Input,
  message,
  Spin,
  Button,
  Popconfirm,
  Space,
  Tabs,
  Badge,
  Card,
  Row,
  Col
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import axios from "axios";

// Components
import ProductTable from "../../components/ProductAdmin/Product/ProductTable"; // Giả sử cùng thư mục hoặc chỉnh lại đường dẫn
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";
import AdminPageLayout from "../../components/AdminPageLayout";
import ProductDetailDrawer from "../../components/ProductAdmin/Product/ProductDetailModal";
import ProductComparisonModal from "../../components/ProductAdmin/Product/ProductComparisonModal";
import { productApi } from "../../services/productApi";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ApprovalProductsPage = () => {
  // --- Data States ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // --- UI/UX States ---
  const [activeTab, setActiveTab] = useState("action_required"); // Mặc định vào tab 'Cần xử lý'

  // --- Filter States (Local search within tabs) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // --- Modal/Drawer States ---
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedComparisonProduct, setSelectedComparisonProduct] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // --- Fetch Data ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      // Sort: Ưu tiên pending lên đầu, sau đó đến mới cập nhật
      const sorted = raw.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
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

  // --- Helper: Categorize Data for Badges ---
  const counts = useMemo(() => {
    return {
      action_required: data.filter(i => ["pending", "pending_update"].includes(i.status)).length,
      approved: data.filter(i => i.status === "approved").length,
      rejected: data.filter(i => i.status === "rejected").length,
      banned: data.filter(i => i.status === "banned").length,
      all: data.length
    };
  }, [data]);

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Tab Logic (Quan trọng nhất)
      let matchesTab = false;
      switch (activeTab) {
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

      // 2. Search Text
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.seller_name || "").toLowerCase().includes(searchTerm.toLowerCase());

      // 3. Filters
      const matchesSeller = sellerFilter ? String(item.seller) === String(sellerFilter) : true;
      const matchesCategory = categoryFilter ? String(item.category_id) === String(categoryFilter) : true;

      return matchesSearch && matchesSeller && matchesCategory;
    });
  }, [data, activeTab, searchTerm, sellerFilter, categoryFilter]);

  // --- Handlers (Giữ nguyên logic cũ) ---
  const handleApprove = async (record) => {
    try {
      const endpoint = record.status === 'pending_update' ? 'approve_update' : 'approve';
      await api.post(`/products/${record.id}/${endpoint}/`, {}, { headers: getAuthHeaders() });
      message.success(`Đã duyệt: ${record.name}`);
      fetchProducts();
      if (selectedProduct?.id === record.id) setDrawerVisible(false);
      if (selectedComparisonProduct?.id === record.id) setComparisonModalVisible(false);
    } catch {
      message.error("Duyệt thất bại");
    }
  };

  const handleReject = async (record) => {
    try {
      const endpoint = record.status === 'pending_update' ? 'reject_update' : 'reject';
      await api.post(`/products/${record.id}/${endpoint}/`, {}, { headers: getAuthHeaders() });
      message.success(`Đã từ chối: ${record.name}`);
      fetchProducts();
      if (selectedProduct?.id === record.id) setDrawerVisible(false);
      if (selectedComparisonProduct?.id === record.id) setComparisonModalVisible(false);
    } catch {
      message.error("Từ chối thất bại");
    }
  };

  const handleCompare = async (record) => {
    try {
      setComparisonLoading(true);
      const response = await productApi.getPendingUpdateDetail(record.id);
      setSelectedComparisonProduct(response.data);
      setComparisonModalVisible(true);
    } catch (error) {
      console.error('Error:', error);
      message.error("Không thể tải dữ liệu so sánh");
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleToggleBan = async (record) => {
    try {
      const url = record.status === "banned" ? "unban" : "ban";
      await api.post(`/products/${record.id}/${url}/`, {}, { headers: getAuthHeaders() });
      message.success(record.status === "banned" ? "Đã mở khoá" : "Đã khoá sản phẩm");
      fetchProducts();
    } catch {
      message.error("Lỗi thay đổi trạng thái");
    }
  };

  const handleView = (record) => {
    setSelectedProduct(record);
    setDrawerVisible(true);
  };

  const handleBatchAction = async (action) => {
    if (!selectedRowKeys.length) return;
    try {
      setLoading(true);
      for (const id of selectedRowKeys) {
        if (action === "approve") await api.post(`/products/${id}/approve/`, {}, { headers: getAuthHeaders() });
        else if (action === "reject") await api.post(`/products/${id}/reject/`, {}, { headers: getAuthHeaders() });
      }
      message.success("Thao tác hàng loạt thành công");
      setSelectedRowKeys([]);
      fetchProducts();
    } catch {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // --- Tabs Configuration ---
  const tabItems = [
    {
      key: "action_required",
      label: (
        <Space>
          <ClockCircleOutlined /> Cần duyệt
          {/* Số lượng để trong ngoặc, màu xám cho tinh tế */}
          <span style={{ color: '#999' }}>({counts.action_required})</span>
        </Space>
      ),
    },
    {
      key: "approved",
      label: (
        <Space>
          <CheckCircleOutlined /> Đã duyệt <span style={{ color: '#999' }}>({counts.approved})</span>
        </Space>
      ),
    },
    {
      key: "rejected",
      label: (
        <Space>
          <CloseCircleOutlined /> Từ chối <span style={{ color: '#999' }}>({counts.rejected})</span>
        </Space>
      ),
    },
    {
      key: "banned",
      label: (
        <Space>
          <StopOutlined /> Đã khóa <span style={{ color: '#999' }}>({counts.banned})</span>
        </Space>
      ),
    },
    {
      key: "all",
      label: (
        <Space>
          <AppstoreOutlined /> Tất cả <span style={{ color: '#999' }}>({counts.all})</span>
        </Space>
      ),
    },
  ];

  // --- Toolbar Filter ---
  const filterToolbar = (
    <div style={{ marginBottom: 16, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Input
            placeholder="Tìm tên SP, người bán..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            prefix={<AppstoreOutlined style={{ color: '#ccc' }} />}
          />
        </Col>
        <Col xs={24} md={5}>
          <SellerSelect onChange={setSellerFilter} placeholder="Lọc theo Shop" style={{ width: '100%' }} />
        </Col>
        <Col xs={24} md={5}>
          <CategorySelect onChange={setCategoryFilter} placeholder="Lọc theo danh mục" style={{ width: '100%' }} />
        </Col>

        {/* Batch Actions: Chỉ hiện khi có row được chọn */}
        <Col xs={24} md={6} style={{ textAlign: 'right' }}>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Popconfirm title={`Duyệt ${selectedRowKeys.length} sản phẩm?`} onConfirm={() => handleBatchAction("approve")}>
                <Button type="primary">Duyệt ({selectedRowKeys.length})</Button>
              </Popconfirm>
              <Popconfirm title={`Từ chối ${selectedRowKeys.length} sản phẩm?`} onConfirm={() => handleBatchAction("reject")}>
                <Button danger>Từ chối ({selectedRowKeys.length})</Button>
              </Popconfirm>
            </Space>
          )}
        </Col>
      </Row>
    </div>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ & DUYỆT SẢN PHẨM">
      <Card bordered={false} bodyStyle={{ padding: "0px" }}>

        {/* 1. TABS NAVIGATION */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="large"
          style={{ marginBottom: 0 }}
          tabBarStyle={{ marginBottom: 0 }}
        />

        {/* 2. BODY CONTENT (Toolbar + Table) */}
        <div style={{
          border: '1px solid #f0f0f0',
          borderTop: 'none',
          padding: '12px',
          background: '#fff',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}>
          {filterToolbar}

          {loading ? (
            <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>
          ) : (
            <ProductTable
              data={filteredData}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              onApprove={handleApprove}
              onReject={handleReject}
              onView={handleView}
              onToggleBan={handleToggleBan}
              onCompare={handleCompare}
              onRow={(record) => ({ onClick: () => handleView(record) })}
            />
          )}
        </div>
      </Card>

      {/* Drawer & Modal */}
      <ProductDetailDrawer
        visible={drawerVisible}
        product={selectedProduct}
        onClose={() => setDrawerVisible(false)}
        onApprove={() => handleApprove(selectedProduct)}
        onReject={() => handleReject(selectedProduct)}
      />

      <ProductComparisonModal
        visible={comparisonModalVisible}
        onCancel={() => setComparisonModalVisible(false)}
        product={selectedComparisonProduct}
        onApprove={(product) => handleApprove(product)}
        onReject={(product) => handleReject(product)}
        loading={comparisonLoading}
      />
    </AdminPageLayout>
  );
};

export default ApprovalProductsPage;