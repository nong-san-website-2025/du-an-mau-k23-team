import React, { useEffect, useState, useMemo } from "react";
import { Input, message, Spin } from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  RiseOutlined,
  ShopOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Components
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ActiveLockedSellersPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // --- 1. STATE MỚI: Dùng để lưu loại lọc hiện tại ---
  // Mặc định là 'all' (Hiển thị tất cả)
  const [filterType, setFilterType] = useState("all"); 

  // --- Logic tính toán Stats ---
  const statsItems = useMemo(() => {
    const totalSellers = data.length;
    const activeSellers = data.filter((item) => item.status === "active").length;
    const lockedSellers = data.filter((item) => item.status === "locked").length;

    // Tính số cửa hàng mới trong tháng này
    const newSellersThisMonth = data.filter((item) => {
      if (!item.created_at) return false;
      const createdDate = new Date(item.created_at);
      const now = new Date();
      return (
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
      );
    }).length;

    // --- 2. Thêm onClick và cursor vào từng item ---
    return [
      {
        title: t("Tổng cửa hàng"),
        value: totalSellers,
        icon: <ShopOutlined />,
        color: "#1890ff",
        // Khi click vào thì set về 'all'
        onClick: () => setFilterType("all"),
        style: { cursor: "pointer", border: filterType === 'all' ? "2px solid #1890ff" : "" } // (Tuỳ chọn) Viền để biết đang chọn
      },
      {
        title: t("Đang hoạt động"),
        value: activeSellers,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
        // Khi click vào thì set về 'active'
        onClick: () => setFilterType("active"),
        style: { cursor: "pointer", border: filterType === 'active' ? "2px solid #52c41a" : "" }
      },
      {
        title: t("Tạm ngưng hoạt động"),
        value: lockedSellers,
        icon: <LockOutlined />,
        color: "#faad14",
        // Khi click vào thì set về 'locked'
        onClick: () => setFilterType("locked"),
        style: { cursor: "pointer", border: filterType === 'locked' ? "2px solid #faad14" : "" }
      },
      {
        title: t("Mới tháng này"),
        value: newSellersThisMonth,
        icon: <RiseOutlined />,
        color: "#722ed1",
        // Khi click vào thì set về 'new_month'
        onClick: () => setFilterType("new_month"),
        style: { cursor: "pointer", border: filterType === 'new_month' ? "2px solid #722ed1" : "" }
      },
    ];
  }, [data, t, filterType]); // Nhớ thêm filterType vào dependency

  // --- Logic Fetch API ---
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sellers/group/business", {
        headers: getAuthHeaders(),
      });

      const filtered = res.data.filter((item) =>
        ["active", "locked"].includes(item.status)
      );

      const sorted = filtered.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setData(sorted);
    } catch (err) {
      console.error(err);
      message.error(t("sellers_active_locked.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // --- 3. Handlers & Filter Logic Cập Nhật ---
  const filteredData = data.filter((item) => {
    // A. Lọc theo từ khóa tìm kiếm
    const matchesSearch = 
      item.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

    // B. Lọc theo Click vào Stats (filterType)
    let matchesType = true;
    if (filterType === "active") {
      matchesType = item.status === "active";
    } else if (filterType === "locked") {
      matchesType = item.status === "locked";
    } else if (filterType === "new_month") {
      if (!item.created_at) matchesType = false;
      else {
        const createdDate = new Date(item.created_at);
        const now = new Date();
        matchesType = 
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear();
      }
    } 
    // Nếu filterType === 'all' thì matchesType luôn là true (mặc định)

    return matchesSearch && matchesType;
  });

  const handleLock = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/lock/`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchSellers();
      message.success(t("Thao tác thành công"));
    } catch (err) {
      console.error(err);
      message.error(t("sellers_active_locked.action_failed"));
    }
  };

  const handleView = (record) => {
    setSelectedSeller(record);
    setModalVisible(true);
  };

  // Xử lý Khóa/Mở khóa nhiều
  const handleBulkLock = async (ids) => {
    try {
      setLoading(true);
      const promises = ids.map((id) =>
        api.post(`/sellers/${id}/lock/`, {}, { headers: getAuthHeaders() })
      );
      await Promise.all(promises);
      message.success(t(`Thao tác thành công cho ${ids.length} cửa hàng`));
      fetchSellers();
    } catch (error) {
      console.error(error);
      message.error(t("Có lỗi xảy ra khi khóa hàng loạt"));
    } finally {
      setLoading(false);
    }
  };

  // --- Toolbar UI ---
  const toolbar = (
    <Input
      placeholder={t("Tìm kiếm tên cửa hàng, email...")}
      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ width: 300, borderRadius: 6 }}
      allowClear
    />
  );

  return (
    <AdminPageLayout title={t("QUẢN LÝ CỬA HÀNG")} extra={toolbar}>
      {/* 1. Phần StatsSection */}
      <StatsSection items={statsItems} loading={loading} />

      {/* Hiển thị tiêu đề nhỏ để biết đang lọc theo cái gì (Optional) */}
      <div style={{ marginTop: 16, marginBottom: 8, fontStyle: 'italic', color: '#666' }}>
        {filterType === 'all'}
        {filterType === 'active'}
        {filterType === 'locked'}
        {filterType === 'new_month'}
      </div>

      {/* 2. Phần Bảng dữ liệu */}
      <div style={{ marginTop: 8 }}>
        <SellerTable
          data={filteredData}
          loading={loading}
          onView={handleView}
          onLock={handleLock}
          onBulkLock={handleBulkLock}
          onRow={(record) => ({
            onClick: () => handleView(record),
          })}
        />
      </div>

      {/* 3. Modal chi tiết */}
      {selectedSeller && (
        <SellerDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          seller={selectedSeller}
          onLock={handleLock}
        />
      )}
    </AdminPageLayout>
  );
};

export default ActiveLockedSellersPage;