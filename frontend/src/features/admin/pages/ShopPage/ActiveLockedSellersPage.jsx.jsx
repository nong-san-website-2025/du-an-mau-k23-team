import React, { useEffect, useState } from "react";
import { Input, message, Spin, Modal, Descriptions } from "antd";
import SellerTable from "../../components/ShopAdmin/SellerTable";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ActiveLockedSellersPage = () => {
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
      // chỉ lấy seller có trạng thái active và locked
      const filtered = res.data.filter((item) =>
        ["active", "locked"].includes(item.status)
      );
      setData(filtered);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách người bán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // filter theo từ khóa tìm kiếm
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
          ? `Đã khóa tài khoản: ${record.store_name}`
          : `Đã mở khóa tài khoản: ${record.store_name}`
      );
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error("Thao tác thất bại");
    }
  };

  const handleView = (record) => {
    setSelectedSeller(record);
    setModalVisible(true);
  };

  return (
    <div style={{ padding: 20, background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ padding: 10 }}>Tài khoản đang hoạt động / bị khóa</h2>
      {/* Toolbar tìm kiếm */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm theo tên cửa hàng hoặc email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </div>
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
          title={`Chi tiết cửa hàng: ${selectedSeller.store_name}`}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* Phần ảnh */}
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
                  Không có hình
                </div>
              )}
            </div>

            {/* Thông tin chi tiết */}
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
                <Descriptions.Item label="Tên cửa hàng">
                  {selectedSeller.store_name}
                </Descriptions.Item>
                <Descriptions.Item label="Chủ sở hữu">
                  {selectedSeller.owner_username}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedSeller.user_email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedSeller.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {selectedSeller.address}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {selectedSeller.status.toUpperCase()}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {selectedSeller.created_at}
                </Descriptions.Item>
                <Descriptions.Item label="Bio">
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

export default ActiveLockedSellersPage;
