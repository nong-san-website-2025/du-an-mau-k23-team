// src/pages/admin/ApprovalSellersPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Input, Select, message, Space } from "antd";
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClockCircleOutlined, // Icon cho Chờ duyệt
  CheckCircleOutlined, // Icon cho Đã duyệt
  CloseCircleOutlined, // Icon cho Từ chối
  ShopOutlined         // Icon Tổng
} from '@ant-design/icons';
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Components
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection"; 
const { Option } = Select;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ApprovalSellersPage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // --- State ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // --- 1. Logic tính toán Stats ---
  const statsItems = useMemo(() => {
    const total = data.length;
    const pending = data.filter(item => item.status === 'pending').length;
    const approved = data.filter(item => item.status === 'approved').length;
    const rejected = data.filter(item => item.status === 'rejected').length;

    // Tính % Chờ duyệt so với tổng (Ví dụ để Admin biết khối lượng việc tồn đọng)
    // Nếu không có dữ liệu trend thực tế, ta có thể bỏ qua hoặc hiển thị tỉ lệ
    const pendingRate = total > 0 ? ((pending / total) * 100).toFixed(1) : 0;

    return [
      {
        title: t("Tổng hồ sơ"),
        value: total,
        icon: <ShopOutlined />,
        color: '#1890ff', // Xanh dương
      },
      {
        title: t("Đang chờ duyệt"),
        value: pending,
        icon: <ClockCircleOutlined />, // Đồng hồ báo hiệu cần xử lý
        color: '#faad14', // Màu Cam (Cảnh báo/Chờ đợi)
        // Hoặc bạn có thể dùng một note nhỏ thay vì trend nếu muốn
      },
      {
        title: t("Đã phê duyệt"),
        value: approved,
        icon: <CheckCircleOutlined />,
        color: '#52c41a', // Xanh lá
      },
      {
        title: t("Đã từ chối"),
        value: rejected,
        icon: <CloseCircleOutlined />,
        color: '#ff4d4f', // Đỏ (Từ chối)
      }
    ];
  }, [data, t]);

  // --- 2. Fetch Data ---
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sellers/", { headers: getAuthHeaders() });

      const filtered = res.data
        .filter((item) =>
          ["pending", "approved", "rejected"].includes(item.status)
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setData(filtered);
    } catch (err) {
      console.error(err);
      message.error(t("approval_sellers.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.newSeller) {
      setData((prev) => [location.state.newSeller, ...prev]);
    }
    fetchSellers();
  }, []);

  // --- 3. Handlers ---
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(t("approval_sellers.approved", { name: record.store_name }));
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error(t("approval_sellers.approve_failed"));
    }
  };

  const handleReject = async (record) => {
    fetchSellers();
  };

  const handleView = (record) => {
    setSelectedSeller(record);
    setDetailVisible(true);
  };

  const pendingCount = data.filter((item) => item.status === "pending").length;

  // --- 4. UI Toolbar ---
  const toolbar = (
    <Space>
      <Input
        placeholder={t("Tìm kiếm tên cửa hàng, email...")}
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300, borderRadius: 6 }}
        allowClear
      />
      <Select
        placeholder={t("Lọc trạng thái")}
        value={statusFilter || undefined}
        onChange={(value) => setStatusFilter(value)}
        style={{ width: 180, borderRadius: 6 }}
        suffixIcon={<FilterOutlined />}
        allowClear
      >
        <Option value="pending">{t("Chờ duyệt")}</Option>
        <Option value="approved">{t("Đã phê duyệt")}</Option>
        <Option value="rejected">{t("Từ chối")}</Option>
      </Select>
    </Space>
  );

  return (
    <AdminPageLayout
      title={t("DUYỆT CỬA HÀNG")}
      extra={toolbar}
      // pendingSellers={pendingCount} // Bạn có thể bỏ prop này nếu AdminPageLayout không dùng badge nữa
    >
      {/* 5. Thêm StatsSection vào đây */}
      <StatsSection items={statsItems} loading={loading} />

      {/* Bảng dữ liệu */}
      <div style={{ marginTop: 24 }}>
        <SellerTable
          data={filteredData}
          loading={loading} // Truyền prop loading vào table để hiển thị spin/skeleton
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleView}
          onRow={(record) => ({
            onClick: () => handleView(record),
          })}
        />
      </div>

      {/* Modal chi tiết */}
      {selectedSeller && (
        <SellerDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          seller={selectedSeller}
          onApprove={handleApprove}
          onReject={handleReject}
          onActionSuccess={fetchSellers}
        />
      )}
    </AdminPageLayout>
  );
};

export default ApprovalSellersPage;