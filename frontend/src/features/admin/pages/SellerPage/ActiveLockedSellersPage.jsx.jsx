import React, { useEffect, useState, useMemo } from "react";
import { Input, message, Spin } from "antd";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import axios from "axios";
import { useTranslation } from "react-i18next";
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection";
import { CheckCircleOutlined, LockOutlined, RiseOutlined, ShopOutlined } from "@ant-design/icons";

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

  const statsItems = useMemo(() => {
    const totalSellers = data.length;
    const activeSellers = data.filter(item => item.status === 'active').length;
    const lockedSellers = data.filter(item => item.status === 'locked').length;
    const newSellersThisMonth = data.filter(item => {
      const createdDate = new Date(item.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length;

    return [
      {
        title: t("Tổng cửa hàng"),
        value: totalSellers,
        icon: <ShopOutlined />,
        style: { color: '#1890ff' }
      },
      {
        title: t("Đang hoạt động"),
        value: activeSellers,
        icon: <CheckCircleOutlined />,
        style: { color: '#52c41a' }
      },
      {
        title: t("Tạm ngưng hoạt động"),
        value: lockedSellers,
        icon: <LockOutlined />,
        style: { color: '#faad14'}
      },
      {
        title: t("Mới tháng này"),
        value: newSellersThisMonth,
        icon: <RiseOutlined />,
        style: { color: '#722ed1' }
      }
    ];
  }, [data, t]);

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

  const filteredData = data.filter((item) => {
    return (
      item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email.toLowerCase().includes(searchTerm.toLowerCase())
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
    } catch (err) {
      console.error(err);
      message.error(t("sellers_active_locked.action_failed"));
    }
  };

  const handleView = (record) => {
    setSelectedSeller(record);
    setModalVisible(true);
  };

  const toolbar = (
    <Input
      placeholder={t("Tìm kiếm theo tên cửa hàng hoặc email...")}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ width: 300 }}
    />
  );

  return (
    <AdminPageLayout 
      title={t("CỬA HÀNG HOẠT ĐỘNG")} 
      extra={toolbar} 
      topContent={<StatsSection items={statsItems} loading={loading} />}
    >
      {loading ? (
        <Spin />
      ) : (
        <SellerTable
          data={filteredData}
          onView={handleView}
          onLock={handleLock}
          onRow={(record) => ({
            onClick: () => handleView(record),
          })}
        />
      )}

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
