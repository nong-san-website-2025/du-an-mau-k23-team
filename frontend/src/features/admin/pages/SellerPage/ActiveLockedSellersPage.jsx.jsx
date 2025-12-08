import React, { useEffect, useState, useMemo } from "react";
import { Input, message, Spin } from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  RiseOutlined,
  ShopOutlined,
  SearchOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Components
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection"; // Đảm bảo đường dẫn đúng đến file mới

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

  // --- Logic tính toán Stats ---
  const statsItems = useMemo(() => {
    const totalSellers = data.length;
    const activeSellers = data.filter(item => item.status === 'active').length;
    const lockedSellers = data.filter(item => item.status === 'locked').length;

    // Tính số cửa hàng mới trong tháng này
    const newSellersThisMonth = data.filter(item => {
      if (!item.created_at) return false;
      const createdDate = new Date(item.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length;

    // Cấu hình theo format mới của StatsSection
    return [
      {
        title: t("Tổng cửa hàng"),
        value: totalSellers,
        icon: <ShopOutlined />,
        color: '#1890ff', // Xanh dương
      },
      {
        title: t("Đang hoạt động"),
        value: activeSellers,
        icon: <CheckCircleOutlined />,
        color: '#52c41a', // Xanh lá
      },
      {
        title: t("Tạm ngưng hoạt động"),
        value: lockedSellers,
        icon: <LockOutlined />,
        color: '#faad14', // Cam
      },
      {
        title: t("Mới tháng này"),
        value: newSellersThisMonth,
        icon: <RiseOutlined />,
        color: '#722ed1', // Tím
      }
    ];
  }, [data, t]);

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

  // --- Handlers ---
  const filteredData = data.filter((item) => {
    return (
      item.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  // --- Toolbar UI ---
  const toolbar = (
    <Input
      placeholder={t("Tìm kiếm tên cửa hàng, email...")}
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ width: 300, borderRadius: 6 }}
      allowClear
    />
  );

  return (
    <AdminPageLayout
      title={t("QUẢN LÝ CỬA HÀNG")}
      extra={toolbar}
    >
      {/* 1. Phần StatsSection đặt ở đây thay vì prop topContent (linh hoạt hơn) */}
      <StatsSection items={statsItems} loading={loading} />

      {/* 2. Phần Bảng dữ liệu */}
      <div style={{ marginTop: 24 }}>
        <SellerTable
          data={filteredData}
          loading={loading} // Truyền loading vào table
          onView={handleView}
          onLock={handleLock}
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