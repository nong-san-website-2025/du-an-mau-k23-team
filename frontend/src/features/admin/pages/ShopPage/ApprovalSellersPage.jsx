import React, { useEffect, useState } from "react";
import { Input, Select, message, Spin, Modal, Descriptions } from "antd";
import SellerTable from "../../components/ShopAdmin/SellerTable";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sellers/", { headers: getAuthHeaders() });
      const filtered = res.data.filter((item) =>
        ["pending", "approved", "rejected"].includes(item.status)
      );
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

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (record) => {
    try {
      await api.post(`/sellers/${record.id}/approve/`, {}, { headers: getAuthHeaders() });
      message.success(t("approval_sellers.approved", { name: record.store_name }));
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error(t("approval_sellers.approve_failed"));
    }
  };

  const handleReject = async (record) => {
    try {
      await api.post(`/sellers/${record.id}/reject/`, {}, { headers: getAuthHeaders() });
      message.success(t("approval_sellers.rejected", { name: record.store_name }));
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error(t("approval_sellers.reject_failed"));
    }
  };

  const handleView = (record) => {
    setSelectedSeller(record);
    setModalVisible(true);
  };

  return (
    <div style={{ padding: 20, background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ padding: 10 }}>{t("approval_sellers.title")}</h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Input
          placeholder={t("approval_sellers.search_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder={t("approval_sellers.filter_status")}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="pending">{t("approval_sellers.pending")}</Option>
          <Option value="approved">{t("approval_sellers.approved_status")}</Option>
          <Option value="rejected">{t("approval_sellers.rejected_status")}</Option>
        </Select>
      </div>

      {loading ? (
        <Spin />
      ) : (
        <SellerTable
          data={filteredData}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleView}
        />
      )}

      {selectedSeller && (
        <Modal
          open={modalVisible}
          title={t("approval_sellers.detail_title", { name: selectedSeller.store_name })}
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
                  {t("approval_sellers.no_image")}
                </div>
              )}
            </div>

            <div style={{ flex: "1 1 400px" }}>
              <Descriptions column={1} bordered size="middle" labelStyle={{ width: 150, fontWeight: 500 }} contentStyle={{ fontWeight: 400 }}>
                <Descriptions.Item label="ID">{selectedSeller.id}</Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.store_name")}>
                  {selectedSeller.store_name}
                </Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.owner")}>
                  {selectedSeller.owner_username}
                </Descriptions.Item>
                <Descriptions.Item label="Email">{selectedSeller.user_email}</Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.phone")}>
                  {selectedSeller.phone}
                </Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.address")}>
                  {selectedSeller.address}
                </Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.status")}>
                  {selectedSeller.status.toUpperCase()}
                </Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.created_at")}>
                  {selectedSeller.created_at}
                </Descriptions.Item>
                <Descriptions.Item label={t("approval_sellers.bio")}>
                  {selectedSeller.bio || "-"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ApprovalSellersPage;
