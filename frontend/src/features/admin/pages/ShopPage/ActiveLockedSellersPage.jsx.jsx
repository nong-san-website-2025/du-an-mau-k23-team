import React, { useEffect, useState } from "react";
import { Input, message, Spin, Modal, Descriptions } from "antd";
import SellerTable from "../../components/ShopAdmin/SellerTable";
import axios from "axios";
import { useTranslation } from "react-i18next";
import AdminPageLayout from "../../components/AdminPageLayout"; // ← Đảm bảo đường dẫn đúng

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
    <AdminPageLayout
      title={t("CỬA HÀNG HOẠT ĐỘNG")}
      extra={toolbar}
    >
      {loading ? (
        <Spin />
      ) : (
        <SellerTable
          data={filteredData}
          onView={handleView}
          onLock={handleLock}
        />
      )}

      {selectedSeller && (
        <Modal
          open={modalVisible}
          title={t("Chi tiết cửa hàng hoạt động / khóa", {
            name: selectedSeller.store_name,
          })}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 250px", textAlign: "center" }}>
              {selectedSeller.image ? (
                <img
                  src={selectedSeller.image}
                  alt={selectedSeller.store_name}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    objectFit: "cover",
                    maxHeight: 250,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f0f0f0",
                    color: "#999",
                    borderRadius: "8px",
                    fontStyle: "italic",
                  }}
                >
                  {t("Không hình ảnh")}
                </div>
              )}
            </div>

            <div style={{ flex: "1 1 400px" }}>
              <Descriptions
                column={1}
                bordered
                size="middle"
                labelStyle={{ width: 150, fontWeight: 500 }}
                contentStyle={{ fontWeight: 400 }}
              >
                <Descriptions.Item label="ID">
                  {selectedSeller.id}
                </Descriptions.Item>
                <Descriptions.Item label={t("Tên cửa hàng")}>
                  {selectedSeller.store_name}
                </Descriptions.Item>
                <Descriptions.Item label={t("Chủ sở hữu")}>
                  {selectedSeller.owner_username}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedSeller.user_email}
                </Descriptions.Item>
                <Descriptions.Item label={t("Số điện thoại")}>
                  {selectedSeller.phone}
                </Descriptions.Item>
                <Descriptions.Item label={t("Địa chỉ")}>
                  {selectedSeller.address}
                </Descriptions.Item>
                <Descriptions.Item label={t("Trạng thái")}>
                  {selectedSeller.status.toUpperCase()}
                </Descriptions.Item>
                <Descriptions.Item label={t("Ngày tạo")}>
                  {selectedSeller.created_at}
                </Descriptions.Item>
                <Descriptions.Item label={t("Tiểu sử")}>
                  {selectedSeller.bio || "-"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Modal>
      )}
    </AdminPageLayout>
  );
};

export default ActiveLockedSellersPage;