// SellerWallet.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Spin,
  message,
  Button,
  Space,
  Alert,
} from "antd";
import { BankOutlined, WalletOutlined } from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";
import WalletStats from "../components/WalletSeller/WalletStats";
import BankAccounts from "../components/WalletSeller/BankAccounts";
import WalletTransactions from "../components/WalletSeller/WalletTransactions";

export default function SellerWallet() {
  const { api } = useAuth();
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);

  // State cho bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

  // Thông tin tài khoản ngân hàng
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

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceRes, financeRes] = await Promise.all([
        api.get("/payments/wallet/balance/"),
        api.get("/payments/seller/finance/"),
      ]);

      setBalance(balanceRes.data.balance || 0);
      setPendingBalance(balanceRes.data.pending_balance || 0);

      const payments = financeRes.data.payments || [];
      const withdraws = financeRes.data.withdraws || [];

      let txns = [
        ...payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          transaction_type: p.status === "success" ? "payment" : "pending",
          description: `Thanh toán đơn hàng #${p.order}`,
          created_at: p.created_at,
        })),
        ...withdraws.map((w) => ({
          id: `RT${String(w.id).padStart(4, "0")}`, // ➜ RT0001, RT0123...
          amount: w.amount,
          transaction_type: "withdraw",
          description: `Rút tiền - ${w.status}`,
          created_at: w.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Áp dụng bộ lọc ở phía client
      if (searchTerm) {
        txns = txns.filter(
          (tx) =>
            tx.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter) {
        txns = txns.filter((tx) => tx.transaction_type === statusFilter);
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].startOf("day").toISOString();
        const end = dateRange[1].endOf("day").toISOString();
        txns = txns.filter((tx) => {
          const txDate = new Date(tx.created_at).toISOString();
          return txDate >= start && txDate <= end;
        });
      }

      setTransactions(txns);

      let income = financeRes.data.total_revenue || 0;
      let withdrawn = withdraws.reduce((sum, w) => {
        if (w.status === "paid" || w.status === "approved") {
          return sum + parseFloat(w.amount);
        }
        return sum;
      }, 0);

      setTotalIncome(income);
      setTotalWithdrawn(withdrawn);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      message.error("Lỗi tải dữ liệu ví tiền");
    } finally {
      setLoading(false);
    }
  }, [api, searchTerm, statusFilter, dateRange]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleWithdraw = async (values) => {
    try {
      await api.post("/payments/withdraw/request/", { amount: values.amount });

      message.success(
        "Yêu cầu rút tiền thành công. Tiền sẽ được chuyển trong 1-3 ngày làm việc."
      );
      setWithdrawModalVisible(false);
      form.resetFields();
      fetchWalletData();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Lỗi khi rút tiền";
      message.error(errorMsg);
    }
  };

  // Hàm xử lý từ base layout
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleFilterStatus = (value) => {
    setStatusFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  return (
    <Spin spinning={loading}>
      <div
        style={{ background: "#fff", padding: "24px", minHeight: "100vh" }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            padding: "16px 24px",
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <h2
              style={{
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <WalletOutlined /> VÍ TIỀN
            </h2>
            <p style={{ marginBottom: 0, color: "rgba(0,0,0,0.45)" }}>
              Quản lý số dư và giao dịch của bạn
            </p>
          </div>
          <Button type="primary" onClick={fetchWalletData}>
            Làm mới
          </Button>
        </div>

        {/* Thống kê tổng quan */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <WalletStats
            balance={balance}
            pendingBalance={pendingBalance}
            totalIncome={totalIncome}
            totalWithdrawn={totalWithdrawn}
            onWithdrawClick={() => setWithdrawModalVisible(true)}
          />
        </div>

        {/* Tài khoản ngân hàng */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <BankAccounts bankAccounts={bankAccounts} />
        </div>

        {/* Lịch sử giao dịch */}
        <div style={{ background: "#fff", borderRadius: 8 }}>
          <WalletTransactions
            loading={loading}
            transactions={transactions}
            onSearch={handleSearch}
            onFilterStatus={handleFilterStatus}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Modal rút tiền */}
        <Modal
          title={
            <Space>
              <BankOutlined />
              <span>Yêu cầu rút tiền</span>
            </Space>
          }
          open={withdrawModalVisible}
          onCancel={() => {
            setWithdrawModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleWithdraw}>
            <Form.Item label="Số dư khả dụng" style={{ marginBottom: 16 }}>
              <div
                style={{
                  padding: "12px",
                  background: "#f0f2f5",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{ fontSize: 24, color: "#3f8600", fontWeight: "bold" }}
                >
                  {parseFloat(balance).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </Form.Item>

            <Form.Item
              label="Tài khoản ngân hàng"
              name="bankAccount"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn tài khoản ngân hàng",
                },
              ]}
            >
              <Select placeholder="Chọn tài khoản ngân hàng" size="large">
                {bankAccounts.map((account) => (
                  <Select.Option key={account.key} value={account.key}>
                    {account.bankName} - {account.accountNumber} (
                    {account.accountName})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Số tiền rút"
              name="amount"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const numValue = parseFloat(value);
                    if (numValue < 100000) {
                      return Promise.reject("Số tiền tối thiểu là 100,000 ₫");
                    }
                    if (numValue > balance) {
                      return Promise.reject("Số tiền vượt quá số dư khả dụng");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                type="number"
                placeholder="Nhập số tiền"
                suffix="₫"
                size="large"
              />
            </Form.Item>

            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea
                rows={3}
                placeholder="Nhập ghi chú (không bắt buộc)"
              />
            </Form.Item>

            <Alert
              message="Thời gian xử lý: 1-3 ngày làm việc"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={() => setWithdrawModalVisible(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" size="large">
                  Xác nhận rút tiền
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
}
