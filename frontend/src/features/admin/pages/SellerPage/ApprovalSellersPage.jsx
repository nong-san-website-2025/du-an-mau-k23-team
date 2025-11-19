// src/pages/admin/ApprovalSellersPage.jsx
import React, { useEffect, useState } from "react";
import { Input, Select, message, Spin, Space } from "antd";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal"; // ✅ Dùng modal mới

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

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // 🧠 Lấy danh sách sellers
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

  // 🔍 Lọc dữ liệu
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // ✅ Duyệt / từ chối
  const handleApprove = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(
        t("approval_sellers.approved", { name: record.store_name })
      );
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error(t("approval_sellers.approve_failed"));
    }
  };

  const handleReject = async (record) => {
    // Modal sẽ xử lý việc gọi API, đây chỉ là callback để reload data
    fetchSellers();
  };

  // 👁 Xem chi tiết
  const handleView = (record) => {
    setSelectedSeller(record);
    setDetailVisible(true);
  };

  const pendingCount = data.filter((item) => item.status === "pending").length;

  // 🔧 Toolbar lọc + tìm kiếm
  const toolbar = (
    <Space>
      <Input
        placeholder={t("Tìm kiếm theo tên cửa hàng hoặc email...")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300 }}
      />
      <Select
        placeholder={t("Lọc trạng thái")}
        value={statusFilter || undefined}
        onChange={(value) => setStatusFilter(value)}
        style={{ width: 200 }}
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
      pendingSellers={pendingCount} // 👈 Thêm dòng này
    >
      {loading ? (
        <Spin />
      ) : (
        <SellerTable
          data={filteredData}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleView}
          onRow={(record) => ({
            onClick: () => handleView(record), // 👈 click dòng để mở chi tiết
          })}
        />
      )}

      {/* 🪟 Dùng SellerDetailModal thay cho Modal cũ */}
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
