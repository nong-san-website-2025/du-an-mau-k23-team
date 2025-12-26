// SellerWallet.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  message,
  Layout,
  Breadcrumb,
  Alert,
  Divider,
} from "antd";
import { HomeOutlined, WalletOutlined } from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";

// Import components
import WalletStats from "../components/WalletSeller/WalletStats";
import BankAccounts from "../components/WalletSeller/BankAccounts";
import WalletTransactions from "../components/WalletSeller/WalletTransactions";

const { Content } = Layout;
const { Option } = Select;

export default function SellerWallet() {
  const { api } = useAuth();
  const [form] = Form.useForm();

  // States dữ liệu
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingBalance: 0,
    totalIncome: 0,
    totalWithdrawn: 0,
    rawTransactions: [], // Lưu trữ toàn bộ giao dịch gốc
  });

  // State giao diện
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State bộ lọc (Filter)
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    dateRange: null,
  });

  // Mock data tài khoản ngân hàng (Trong thực tế nên gọi API lấy danh sách)
  const bankAccounts = [
    {
      key: "1",
      bankName: "Vietcombank",
      accountNumber: "1234567890",
      accountName: "NGUYEN VAN A",
      isDefault: true,
    },
    {
      key: "2",
      bankName: "Techcombank",
      accountNumber: "0987654321",
      accountName: "NGUYEN VAN A",
      isDefault: false,
    },
  ];

  // 1. Fetch Data
  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceRes, financeRes, transactionsRes] = await Promise.all([
        api.get("/payments/wallet/balance/"),
        api.get("/payments/seller/finance/"),
        api.get("/payments/wallet/transactions/"),
      ]);

      const payments = financeRes.data.payments || [];
      const withdraws = financeRes.data.withdraws || [];
      const walletTransactions = transactionsRes.data.transactions || [];

      // Sử dụng wallet transactions thay vì tự build
      const normalizedTransactions = walletTransactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        description: tx.description || tx.note || "",
        created_at: tx.created_at,
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Tính toán tổng
      const withdrawn = withdraws.reduce((sum, w) => {
        return (w.status === "paid" || w.status === "approved") ? sum + parseFloat(w.amount) : sum;
      }, 0);

      setWalletData({
        balance: balanceRes.data.balance || 0,
        pendingBalance: balanceRes.data.pending_balance || 0,
        totalIncome: financeRes.data.total_revenue || 0,
        totalWithdrawn: withdrawn,
        rawTransactions: normalizedTransactions,
      });

    } catch (error) {
      console.error("Error fetching wallet data:", error);
      message.error("Không thể tải dữ liệu ví. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // 2. Client-side Filtering Logic (Dùng useMemo để tối ưu hiệu năng)
  const filteredTransactions = useMemo(() => {
    let result = [...walletData.rawTransactions];
    const { search, status, dateRange } = filters;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.id.toString().toLowerCase().includes(lowerSearch) ||
          tx.description.toLowerCase().includes(lowerSearch)
      );
    }

    if (status) {
      result = result.filter((tx) => tx.transaction_type === status);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day").valueOf();
      const end = dateRange[1].endOf("day").valueOf();
      result = result.filter((tx) => {
        const txTime = new Date(tx.created_at).getTime();
        return txTime >= start && txTime <= end;
      });
    }

    return result;
  }, [walletData.rawTransactions, filters]);

  // Hàm handle thay đổi filter
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 3. Xử lý Rút tiền
  const handleWithdraw = async (values) => {
    setSubmitting(true);
    try {
      await api.post("/payments/withdraw/request/", { amount: values.amount, note: values.note });
      message.success("Gửi yêu cầu rút tiền thành công!");
      setWithdrawModalVisible(false);
      form.resetFields();
      fetchWalletData(); // Reload lại số dư
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Có lỗi xảy ra khi rút tiền.";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content style={{ margin: "24px" }}>
        {/* Breadcrumb */}


        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header Area */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <WalletOutlined style={{ color: '#1890ff' }} /> QUẢN LÝ VÍ TIỀN
            </h2>
            <span style={{ color: '#8c8c8c' }}>Theo dõi dòng tiền và yêu cầu rút tiền nhanh chóng</span>
          </div>

          <WalletStats
            loading={loading}
            balance={walletData.balance}
            pendingBalance={walletData.pendingBalance}
            totalIncome={walletData.totalIncome}
            totalWithdrawn={walletData.totalWithdrawn}
            onWithdrawClick={() => setWithdrawModalVisible(true)}
          />

          <Divider style={{ margin: "32px 0" }} />

          <BankAccounts bankAccounts={bankAccounts} />

          <div style={{ marginTop: 24 }}>
            <WalletTransactions
              loading={loading}
              transactions={filteredTransactions}
              filterValues={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {/* --- MODAL RÚT TIỀN --- */}
        <Modal
          title="Yêu cầu rút tiền"
          open={withdrawModalVisible}
          onCancel={() => {
            if (!submitting) {
              setWithdrawModalVisible(false);
              form.resetFields();
            }
          }}
          okText="Xác nhận rút"
          cancelText="Hủy bỏ"
          onOk={() => form.submit()}
          confirmLoading={submitting}
          width={500}
          centered
        >
          <Alert
            message="Thông tin quan trọng"
            description="Thời gian xử lý giao dịch từ 1-3 ngày làm việc (không tính T7, CN). Phí rút tiền: Miễn phí."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form form={form} layout="vertical" onFinish={handleWithdraw}>
            <Form.Item label="Số dư khả dụng" style={{ marginBottom: 12 }}>
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                padding: '10px 16px',
                borderRadius: 6,
                color: '#389e0d',
                fontWeight: 'bold',
                fontSize: 18
              }}>
                {parseFloat(walletData.balance).toLocaleString("vi-VN")} ₫
              </div>
            </Form.Item>

            <Form.Item
              label="Tài khoản nhận tiền"
              name="bankAccount"
              initialValue={bankAccounts.find(x => x.isDefault)?.key}
              rules={[{ required: true, message: "Vui lòng chọn tài khoản!" }]}
            >
              <Select placeholder="Chọn tài khoản ngân hàng">
                {bankAccounts.map((acc) => (
                  <Option key={acc.key} value={acc.key}>
                    {acc.bankName} - {acc.accountNumber}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Số tiền muốn rút"
              name="amount"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền!" },
                {
                  validator: (_, value) => {
                    const num = parseFloat(value);
                    if (!value) return Promise.resolve();
                    if (num < 100000) return Promise.reject("Số tiền tối thiểu 100,000₫");
                    if (num > walletData.balance) return Promise.reject("Số dư không đủ!");
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                type="number"
                suffix="₫"
                placeholder="Nhập số tiền (VD: 500000)"
                size="large"
              />
            </Form.Item>

            <Form.Item label="Ghi chú (Tùy chọn)" name="note">
              <Input.TextArea rows={2} placeholder="Nhập ghi chú cho quản trị viên..." />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}