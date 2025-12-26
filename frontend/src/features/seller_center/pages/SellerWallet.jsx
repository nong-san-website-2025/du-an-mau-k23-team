// src/features/seller/pages/SellerWallet.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  message,
  Layout,
  Alert,
  Divider,
} from "antd";
import { WalletOutlined } from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";
import { debounce } from "lodash";
import dayjs from "dayjs";

// Import components
import WalletStats from "../components/WalletSeller/WalletStats";
import BankAccounts from "../components/WalletSeller/BankAccounts";
import WalletTransactions from "../components/WalletSeller/WalletTransactions";

const { Content } = Layout;
const { Option } = Select;

export default function SellerWallet() {
  const { api } = useAuth();
  const [form] = Form.useForm();

  // --- 1. STATES ---
  const [statsLoading, setStatsLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  const [walletStats, setWalletStats] = useState({
    balance: 0,
    pendingBalance: 0,
    totalIncome: 0,
    totalWithdrawn: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: null,
    dateRange: null,
  });

  // --- 2. API CALLS ---

  // A. Lấy thông tin thống kê ví (Balance, Income, Withdrawn)
  const fetchWalletStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Gọi đồng thời cả balance và finance để lấy đủ thông tin
      const [balanceRes, financeRes] = await Promise.all([
        api.get("/payments/wallet/balance/"),
        api.get("/payments/seller/finance/"),
      ]);

      const withdraws = financeRes.data.withdraws || [];
      const withdrawnTotal = withdraws.reduce((sum, w) => {
        return (w.status === "paid" || w.status === "approved") ? sum + parseFloat(w.amount) : sum;
      }, 0);

      setWalletStats({
        balance: balanceRes.data.balance || 0,
        pendingBalance: balanceRes.data.pending_balance || 0,
        totalIncome: financeRes.data.total_revenue || 0,
        totalWithdrawn: withdrawnTotal || financeRes.data.total_withdrawn || 0,
      });
    } catch (error) {
      console.error("Lỗi tải thống kê ví:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [api]);

  // B. Lấy danh sách giao dịch (Server-side Pagination & Filtering)
  const fetchTransactions = useCallback(
    async (page = 1, pageSize = 10, currentFilters = filters) => {
      setTableLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("page_size", pageSize);

        if (currentFilters.search) params.append("search", currentFilters.search);
        if (currentFilters.status) params.append("type", currentFilters.status);
        if (currentFilters.dateRange) {
          params.append("start_date", dayjs(currentFilters.dateRange[0]).format("YYYY-MM-DD"));
          params.append("end_date", dayjs(currentFilters.dateRange[1]).format("YYYY-MM-DD"));
        }

        const res = await api.get(`/payments/seller/finance/?${params.toString()}`);

        // Chuẩn hóa dữ liệu từ API (kết hợp logic từ cả 2 version)
        const rawData = res.data.results || res.data.payments || [];
        const totalCount = res.data.count || res.data.total || rawData.length;

        const normalizedData = rawData.map((item) => ({
          id: item.id,
          key: item.id,
          amount: item.amount,
          transaction_type: item.transaction_type || item.type || (item.amount > 0 ? "income" : "withdraw"),
          description: item.description || item.note || `Giao dịch #${item.id}`,
          created_at: item.created_at,
          status: item.status,
        }));

        setTransactions(normalizedData);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: totalCount,
        }));
      } catch (error) {
        message.error("Không thể tải lịch sử giao dịch");
      } finally {
        setTableLoading(false);
      }
    },
    [api, filters]
  );

  // --- 3. EFFECTS & HANDLERS ---

  useEffect(() => {
    fetchWalletStats();
    fetchTransactions(1, 10);
  }, [fetchWalletStats]);

  // Debounce tìm kiếm để tránh gọi API liên tục
  const handleSearchDebounced = useCallback(
    debounce((value) => {
      const newFilters = { ...filters, search: value };
      setFilters(newFilters);
      fetchTransactions(1, pagination.pageSize, newFilters);
    }, 500),
    [filters, pagination.pageSize, fetchTransactions]
  );

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTransactions(1, pagination.pageSize, newFilters);
  };

  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize, filters);
  };

  const handleWithdraw = async (values) => {
    setSubmitting(true);
    try {
      await api.post("/payments/withdraw/request/", {
        amount: values.amount,
        note: values.note,
        bank_account_id: values.bankAccount,
      });
      message.success("Gửi yêu cầu rút tiền thành công!");
      setWithdrawModalVisible(false);
      form.resetFields();
      
      // Refresh dữ liệu
      fetchWalletStats();
      fetchTransactions(1, pagination.pageSize, filters);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Có lỗi xảy ra khi rút tiền.";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Tài khoản ngân hàng (Mock data - nên lấy từ API nếu có)
  const bankAccounts = [
    { key: "1", bankName: "Vietcombank", accountNumber: "1234567890", accountName: "NGUYEN VAN A", isDefault: true },
    { key: "2", bankName: "Techcombank", accountNumber: "0987654321", accountName: "NGUYEN VAN A", isDefault: false },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content style={{ margin: "24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* HEADER */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <WalletOutlined style={{ color: "#1890ff" }} /> QUẢN LÝ VÍ TIỀN
            </h2>
          </div>

          {/* SECTION 1: STATS */}
          <WalletStats
            loading={statsLoading}
            balance={walletStats.balance}
            pendingBalance={walletStats.pendingBalance}
            totalIncome={walletStats.totalIncome}
            totalWithdrawn={walletStats.totalWithdrawn}
            onWithdrawClick={() => setWithdrawModalVisible(true)}
          />

          <Divider style={{ margin: "24px 0" }} />

          {/* SECTION 2: BANK ACCOUNTS */}
          <BankAccounts bankAccounts={bankAccounts} />

          <Divider style={{ margin: "24px 0" }} />

          {/* SECTION 3: TRANSACTIONS */}
          <WalletTransactions
            loading={tableLoading}
            transactions={transactions}
            filterValues={filters}
            onSearch={handleSearchDebounced}
            onFilterChange={handleFilterChange}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </div>

        {/* MODAL RÚT TIỀN */}
        <Modal
          title="Yêu cầu rút tiền"
          open={withdrawModalVisible}
          onCancel={() => !submitting && setWithdrawModalVisible(false)}
          okText="Xác nhận rút"
          cancelText="Hủy bỏ"
          onOk={() => form.submit()}
          confirmLoading={submitting}
          centered
        >
          <Alert
            message="Lưu ý"
            description="Thời gian xử lý 1-3 ngày làm việc. Số dư khả dụng sẽ bị trừ ngay lập tức."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={form} layout="vertical" onFinish={handleWithdraw}>
            <Form.Item label="Số dư khả dụng">
              <span style={{ color: "#389e0d", fontWeight: "bold", fontSize: 16 }}>
                {parseFloat(walletStats.balance).toLocaleString("vi-VN")} ₫
              </span>
            </Form.Item>

            <Form.Item
              label="Tài khoản nhận"
              name="bankAccount"
              initialValue={bankAccounts.find((x) => x.isDefault)?.key}
              rules={[{ required: true, message: "Vui lòng chọn tài khoản nhận" }]}
            >
              <Select>
                {bankAccounts.map((acc) => (
                  <Option key={acc.key} value={acc.key}>
                    {acc.bankName} - {acc.accountNumber}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Số tiền rút"
              name="amount"
              rules={[
                { required: true, message: "Nhập số tiền cần rút" },
                () => ({
                  validator(_, value) {
                    if (!value || (value >= 50000 && value <= walletStats.balance)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Số tiền không hợp lệ (Min 50k, Max <= Số dư)"));
                  },
                }),
              ]}
            >
              <Input type="number" suffix="₫" placeholder="VD: 1000000" />
            </Form.Item>
            
            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea rows={2} placeholder="Nhập ghi chú nếu có" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}