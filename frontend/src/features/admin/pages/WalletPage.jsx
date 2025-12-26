// src/features/admin/pages/WalletPage.jsx - Cập nhật handlers

import React, { useEffect, useState } from "react";
import { Input, message, Spin, Space, Button, Card, Tabs } from "antd";
import { ReloadOutlined, SyncOutlined } from "@ant-design/icons";
import axios from "axios";

import WalletTable from "../components/WalletAdmin/WalletTable";
import WithdrawRequestsTable from "../components/WalletAdmin/WithdrawRequestsTable";
import AdminPageLayout from "../components/AdminPageLayout";
import WalletDetailModal from "../components/WalletAdmin/WalletDetailModal";

const { Search } = Input;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const WalletPage = () => {
  const [data, setData] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Lấy danh sách ví
  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await api.get("payments/wallets/", {
        headers: getAuthHeaders(),
      });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách ví");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách yêu cầu rút tiền
  const fetchWithdrawRequests = async () => {
    try {
      const res = await api.get("payments/withdraw/requests/?status=pending", {
        headers: getAuthHeaders(),
      });
      setWithdrawRequests(res.data.results || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách yêu cầu rút tiền");
    }
  };

  // Duyệt yêu cầu rút tiền
  const handleApproveWithdraw = async (record) => {
    setWithdrawLoading(true);
    try {
      await api.post(
        `payments/withdraw/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      
      message.success({
        content: `Đã duyệt rút tiền ${record.amount?.toLocaleString('vi-VN')}₫ cho ${record.store_name}`,
        duration: 5,
      });
      
      // Reload cả 2 bảng
      fetchWithdrawRequests();
      fetchWallets();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || "Không thể duyệt yêu cầu");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // ✨ CẬP NHẬT: Từ chối với lý do
  const handleRejectWithdraw = async (record, rejectionReason) => {
    setWithdrawLoading(true);
    try {
      await api.post(
        `payments/withdraw/${record.id}/reject/`,
        { note: rejectionReason }, // ← Gửi lý do từ chối
        { headers: getAuthHeaders() }
      );
      
      message.success({
        content: `Đã từ chối yêu cầu của ${record.store_name} và hoàn tiền`,
        duration: 5,
      });
      
      fetchWithdrawRequests();
      fetchWallets();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || "Không thể từ chối yêu cầu");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Xem chi tiết ví
  const handleView = (record) => {
    setSelectedWallet(record);
    setDetailVisible(true);
  };

  const handleModalSuccess = () => {
    fetchWallets();
  };

  useEffect(() => {
    fetchWallets();
    fetchWithdrawRequests();
  }, []);

  // Filter
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.store_name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term)
    );
  });

  // Toolbar
  const toolbar = (
    <Space wrap>
      <Search
        placeholder="Tìm tên shop hoặc email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300, maxWidth: "100%" }}
        allowClear
      />
      <Button
        icon={<ReloadOutlined />}
        onClick={() => {
          fetchWallets();
          fetchWithdrawRequests();
        }}
      >
        Làm mới
      </Button>
    </Space>
  );

  // Tabs
  const tabs = [
    {
      key: "wallets",
      label: "Ví của Seller",
      children: loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <WalletTable
          data={filteredData}
          onView={handleView}
        />
      ),
    },

  ];

  return (
    <AdminPageLayout title="QUẢN LÝ VÍ NGƯỜI BÁN" extra={toolbar}>
      <Card bordered={false} className="shadow-sm">
        <Tabs items={tabs} defaultActiveKey="wallets" />
      </Card>

      {selectedWallet && (
        <WalletDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          wallet={selectedWallet}
          onSuccess={handleModalSuccess}
        />
      )}
    </AdminPageLayout>
  );
};

export default WalletPage;