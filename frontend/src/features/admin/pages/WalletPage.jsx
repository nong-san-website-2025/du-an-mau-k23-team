import React, { useEffect, useState } from "react";
import { Input, message, Spin, Space, Button, Card, Tabs } from "antd";
import { ReloadOutlined, SyncOutlined } from "@ant-design/icons";
import axios from "axios";

// Import các components con
import WalletTable from "../components/WalletAdmin/WalletTable";
import WithdrawRequestsTable from "../components/WalletAdmin/WithdrawRequestsTable";
import AdminPageLayout from "../components/AdminPageLayout";
import WalletDetailModal from "../components/WalletAdmin/WalletDetailModal"; // Component Modal mới

const { Search } = Input;

// Cấu hình API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const WalletPage = () => {
  // --- States ---
  const [data, setData] = useState([]); // Dữ liệu ví sellers
  const [withdrawRequests, setWithdrawRequests] = useState([]); // Dữ liệu yêu cầu rút tiền
  
  const [loading, setLoading] = useState(false); // Loading cho ví
  const [withdrawLoading, setWithdrawLoading] = useState(false); // Loading cho rút tiền
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // State quản lý Modal chi tiết
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  // --- API Functions ---

  // 1. Lấy danh sách ví seller
  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await api.get("payments/wallets/", { headers: getAuthHeaders() });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách ví");
    } finally {
      setLoading(false);
    }
  };

  // 2. Lấy danh sách yêu cầu rút tiền
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

  // 3. Tính lại số dư (Phòng trường hợp lỗi dữ liệu)
  const handleRecalculateAll = async () => {
    try {
      setLoading(true);
      const wallets = data;
      // Gọi API recalculate cho từng ví (hoặc viết 1 API bulk backend nếu có)
      for (const wallet of wallets) {
          await api.post(
            `payments/wallets/${wallet.seller_id}/recalculate/`,
            {},
            { headers: getAuthHeaders() }
          );
      }
      message.success("Đã đồng bộ lại dữ liệu tất cả ví");
      fetchWallets(); // Load lại bảng sau khi tính xong
    } catch (err) {
      console.warn("Lỗi khi tính lại:", err);
      message.error("Có lỗi xảy ra khi tính lại số liệu");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers cho Rút tiền ---

  const handleApproveWithdraw = async (record) => {
    setWithdrawLoading(true);
    try {
      await api.post(
        `payments/withdraw/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt rút tiền cho ${record.store_name}`);
      fetchWithdrawRequests(); // Reload bảng rút tiền
      fetchWallets();          // Reload bảng ví (vì số dư bị trừ)
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
      message.success(`Đã từ chối yêu cầu của ${record.store_name}`);
      fetchWithdrawRequests();
    } catch (err) {
      console.error(err);
      message.error("Từ chối thất bại");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // --- Handlers cho Modal Chi tiết ---

  // Mở modal khi bấm vào dòng trong bảng
  const handleView = (record) => {
    setSelectedWallet(record);
    setDetailVisible(true);
  };

  // Callback này được gọi khi Modal thực hiện xong hành động (VD: Duyệt đơn hàng)
  // Giúp bảng bên ngoài cập nhật số dư Pending giảm xuống và Balance tăng lên ngay lập tức
  const handleModalSuccess = () => {
    fetchWallets();
  };

  // --- Effects ---
  useEffect(() => {
    fetchWallets();
    fetchWithdrawRequests();
  }, []);

  // --- Filters ---
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.store_name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term)
    );
  });

  // --- UI Components ---

  const toolbar = (
    <Space>
      <Search
        placeholder="Tìm tên shop hoặc email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300 }}
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
      <Button
        icon={<SyncOutlined />}
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
        <div style={{ textAlign: "center", padding: "50px" }}><Spin size="large" /></div>
      ) : (
        <WalletTable
          data={filteredData}
          onView={handleView}
          // Lưu ý: Không truyền onApprovePending nữa 
          // vì giờ chúng ta duyệt chi tiết trong Modal
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
      <Card bordered={false} className="shadow-sm">
        <Tabs items={tabs} defaultActiveKey="wallets" />
      </Card>

      {/* Modal chi tiết ví */}
      {selectedWallet && (
        <WalletDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          wallet={selectedWallet}
          onSuccess={handleModalSuccess} // 👈 QUAN TRỌNG: Truyền hàm update xuống modal
        />
      )}
    </AdminPageLayout>
  );
};

export default WalletPage;