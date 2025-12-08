import React, { useEffect, useState } from "react";
import { Input, message, Spin, Space, Button, Popconfirm, Card, Tabs } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import WalletTable from "../components/WalletAdmin/WalletTable";
import WithdrawRequestsTable from "../components/WalletAdmin/WithdrawRequestsTable";
import axios from "axios";
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

  const recalculateAllWallets = async (wallets) => {
    try {
      for (const wallet of wallets) {
        await api.post(
          `payments/wallets/${wallet.seller_id}/recalculate/`,
          {},
          { headers: getAuthHeaders() }
        );
      }
    } catch (err) {
      console.warn("Error recalculating some wallets:", err);
    }
  };

  // 🧠 Lấy danh sách ví seller
  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await api.get("payments/wallets/", { headers: getAuthHeaders() });
      const wallets = res.data || [];
      
      await recalculateAllWallets(wallets);
      
      const updateRes = await api.get("payments/wallets/", { headers: getAuthHeaders() });
      setData(updateRes.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách ví");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawRequests = async () => {
    try {
      const res = await api.get("payments/withdraw/requests/?status=pending", { 
        headers: getAuthHeaders() 
      });
      setWithdrawRequests(res.data.results || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách yêu cầu rút tiền");
    }
  };

  const handleApproveWithdraw = async (record) => {
    setWithdrawLoading(true);
    try {
      await api.post(
        `payments/withdraw/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt rút tiền cho ${record.store_name}`);
      fetchWithdrawRequests();
      fetchWallets();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || "Duyệt thất bại");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleRejectWithdraw = async (record) => {
    setWithdrawLoading(true);
    try {
      await api.post(
        `payments/withdraw/${record.id}/reject/`,
        { note: "Từ chối bởi admin" },
        { headers: getAuthHeaders() }
      );
      message.success(`Đã từ chối rút tiền cho ${record.store_name}`);
      fetchWithdrawRequests();
    } catch (err) {
      console.error(err);
      message.error("Từ chối thất bại");
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
    fetchWithdrawRequests();
  }, []);

  // 🔍 Lọc dữ liệu
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ✅ Duyệt số dư chờ
  const handleApprovePending = async (record) => {
    try {
      await api.post(
        `payments/wallets/${record.seller_id}/approve-pending/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt số dư chờ cho ${record.store_name}`);
      // Chỉ refetch data, không recalculate để tránh tính lại pending_balance
      const res = await api.get("payments/wallets/", { headers: getAuthHeaders() });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Duyệt thất bại");
    }
  };

  // 👁 Xem chi tiết
  const handleView = (record) => {
    setSelectedWallet(record);
    setDetailVisible(true);
  };

  const handleRecalculateAll = async () => {
    try {
      setLoading(true);
      const res = await api.get("payments/wallets/", { headers: getAuthHeaders() });
      const wallets = res.data || [];
      
      await recalculateAllWallets(wallets);
      
      const updateRes = await api.get("payments/wallets/", { headers: getAuthHeaders() });
      setData(updateRes.data || []);
      
      message.success("Đã tính lại số dư chờ cho tất cả seller");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tính lại");
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Toolbar tìm kiếm
  const toolbar = (
    <Space>
      <Search
        placeholder="Tìm kiếm theo tên cửa hàng hoặc email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300 }}
        allowClear
      />
      <Button
        icon={<ReloadOutlined />}
        onClick={handleRecalculateAll}
        loading={loading}
      >
        Tính lại tất cả
      </Button>
    </Space>
  );

  const tabs = [
    {
      key: "wallets",
      label: "Ví của Seller",
      children: loading ? (
        <Spin />
      ) : (
        <WalletTable
          data={filteredData}
          onApprovePending={handleApprovePending}
          onView={handleView}
        />
      ),
    },
    {
      key: "withdraws",
      label: `Yêu cầu rút tiền (${withdrawRequests.length})`,
      children: (
        <WithdrawRequestsTable
          data={withdrawRequests}
          onApprove={handleApproveWithdraw}
          onReject={handleRejectWithdraw}
          loading={withdrawLoading}
        />
      ),
    },
  ];

  return (
    <AdminPageLayout title="QUẢN LÝ VÍ NGƯỜI BÁN" extra={toolbar}>
      <Card>
        <Tabs items={tabs} />
      </Card>

      {selectedWallet && (
        <WalletDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          wallet={selectedWallet}
        />
      )}
    </AdminPageLayout>
  );
};

export default WalletPage;