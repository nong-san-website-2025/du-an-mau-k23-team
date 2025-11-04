import React, { useEffect, useState } from "react";
import { Input, message, Spin, Modal, Descriptions } from "antd";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import axios from "axios";
import { useTranslation } from "react-i18next";
import AdminPageLayout from "../../components/AdminPageLayout"; // ← Đảm bảo đường dẫn đúng
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";

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
      message.success(
        record.status === "active"
          ? t("sellers_active_locked.locked", { name: record.store_name })
          : t("sellers_active_locked.unlocked", { name: record.store_name })
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

  // ✅ Toolbar cho extra
  const toolbar = (
    <Input
      placeholder={t("Tìm kiếm theo tên cửa hàng hoặc email...")}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ width: 300 }}
    />
  );

  return (
    <AdminPageLayout title={t("CỬA HÀNG HOẠT ĐỘNG")} extra={toolbar}>
      {loading ? (
        <Spin />
      ) : (
        <SellerTable
          data={filteredData}
          onView={handleView}
          onLock={handleLock}
          onRow={(record) => ({
            onClick: () => handleView(record), // 👈 click dòng để mở chi tiết
          })}
        />
      )}

      {selectedSeller && (
        <SellerDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          seller={selectedSeller}
        />
      )}
    </AdminPageLayout>
  );
};

export default ActiveLockedSellersPage;
