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
  Row,
  Col,
} from "antd";
import { WalletOutlined } from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";
import { debounce } from "lodash"; // Cần cài: npm i lodash
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
  // State cho Thống kê (Load nhanh)
  const [statsLoading, setStatsLoading] = useState(false);
  const [walletStats, setWalletStats] = useState({
    balance: 0,
    pendingBalance: 0,
    totalIncome: 0,
    totalWithdrawn: 0,
  });

  // State cho Danh sách giao dịch (Load chậm hơn/Phân trang)
  const [tableLoading, setTableLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // State cho Bộ lọc
  const [filters, setFilters] = useState({
    search: "",
    status: null, // 'income', 'withdraw', 'pending'
    dateRange: null,
  });

  // State Modal Rút tiền
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- 2. API CALLS ---

  // A. Lấy thông tin số dư (Chạy ngay khi vào trang)
  const fetchWalletStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Giả sử API balance trả về cả tổng thu/tổng rút.
      // Nếu không, bạn có thể gọi 2 API nhẹ ở đây.
      const res = await api.get("/payments/wallet/balance/");

      // Map dữ liệu từ API vào State
      setWalletStats({
        balance: res.data.balance || 0,
        pendingBalance: res.data.pending_balance || 0,
        totalIncome: res.data.total_revenue || 0, // Cần backend trả về field này
        totalWithdrawn: res.data.total_withdrawn || 0, // Cần backend trả về field này
      });
    } catch (error) {
      console.error("Lỗi tải số dư:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [api]);

  // B. Lấy danh sách giao dịch (Chạy sau hoặc khi đổi trang/filter)
  const fetchTransactions = useCallback(
    async (page = 1, pageSize = 10, currentFilters = filters) => {
      setTableLoading(true);
      try {
        // Tạo query params chuẩn server-side pagination
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("page_size", pageSize);

        if (currentFilters.search)
          params.append("search", currentFilters.search);
        if (currentFilters.status) params.append("type", currentFilters.status);
        if (currentFilters.dateRange) {
          params.append(
            "start_date",
            dayjs(currentFilters.dateRange[0]).format("YYYY-MM-DD")
          );
          params.append(
            "end_date",
            dayjs(currentFilters.dateRange[1]).format("YYYY-MM-DD")
          );
        }

        // Gọi API Finance (Lưu ý: Backend cần hỗ trợ nhận params phân trang)
        const res = await api.get(
          `/payments/seller/finance/?${params.toString()}`
        );

        // Xử lý dữ liệu trả về (Giả sử backend trả về { results: [], count: 100 })
        // Nếu backend trả về mảng full, ta sẽ phải slice ở client (fallback)
        const rawData = res.data.results || res.data.payments || [];
        const totalCount = res.data.count || res.data.total || rawData.length;

        // Chuẩn hóa dữ liệu hiển thị
        const normalizedData = rawData.map((item) => ({
          id: item.id,
          key: item.id,
          // Logic mapping tùy thuộc vào cấu trúc JSON thực tế của bạn
          amount: item.amount,
          transaction_type:
            item.type || (item.status === "success" ? "income" : "withdraw"),
          description: item.description || `Giao dịch #${item.id}`,
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
  ); // Phụ thuộc vào filters

  // --- 3. EFFECTS & HANDLERS ---

  // Khởi tạo: Gọi cả 2, nhưng Stats sẽ xong trước
  useEffect(() => {
    fetchWalletStats();
    fetchTransactions(1, 10, filters);
  }, []); // Chỉ chạy 1 lần mount

  // Debounce Search: Chỉ gọi API sau khi ngừng gõ 0.5s
  const handleSearchDebounced = useCallback(
    debounce((value) => {
      const newFilters = { ...filters, search: value };
      setFilters(newFilters);
      fetchTransactions(1, pagination.pageSize, newFilters);
    }, 500),
    [filters, pagination.pageSize]
  );

  // Handle Filter Change (Status, Date)
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTransactions(1, pagination.pageSize, newFilters);
  };

  // Handle Table Pagination Change
  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize, filters);
  };

  // Handle Rút tiền
  const handleWithdraw = async (values) => {
    setSubmitting(true);
    try {
      await api.post("/payments/withdraw/request/", {
        amount: values.amount,
        note: values.note,
        bank_account_id: values.bankAccount, // Gửi ID tài khoản
      });
      message.success("Gửi yêu cầu rút tiền thành công!");
      setWithdrawModalVisible(false);
      form.resetFields();

      // Reload lại dữ liệu để cập nhật số dư mới và lịch sử
      fetchWalletStats();
      fetchTransactions(1, pagination.pageSize, filters);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Có lỗi xảy ra";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Mock Bank Accounts (Nên chuyển thành API call nếu có)
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

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content style={{ margin: "24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* HEADER */}
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <WalletOutlined style={{ color: "#1890ff" }} /> QUẢN LÝ VÍ TIỀN
            </h2>
          </div>

          {/* SECTION 1: STATS (Load độc lập) */}
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

          {/* SECTION 3: TRANSACTIONS (Load độc lập với Pagination) */}
          <div style={{ marginTop: 24 }}>
            <WalletTransactions
              loading={tableLoading}
              transactions={transactions}
              // Truyền filter props
              filterValues={filters}
              onSearch={handleSearchDebounced} // Dùng hàm debounce
              onFilterChange={handleFilterChange}
              // Truyền pagination props
              pagination={pagination}
              onChange={handleTableChange}
            />
          </div>
        </div>

        {/* --- MODAL RÚT TIỀN (Giữ nguyên logic) --- */}
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
              <span
                style={{ color: "#389e0d", fontWeight: "bold", fontSize: 16 }}
              >
                {parseFloat(walletStats.balance).toLocaleString("vi-VN")} ₫
              </span>
            </Form.Item>

            <Form.Item
              label="Tài khoản nhận"
              name="bankAccount"
              initialValue={bankAccounts.find((x) => x.isDefault)?.key}
              rules={[{ required: true }]}
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
                { required: true, message: "Nhập số tiền" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      (value >= 50000 && value <= walletStats.balance)
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Số tiền không hợp lệ (Min 50k, Max <= Số dư)")
                    );
                  },
                }),
              ]}
            >
              <Input type="number" suffix="₫" placeholder="VD: 1000000" />
            </Form.Item>
            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
