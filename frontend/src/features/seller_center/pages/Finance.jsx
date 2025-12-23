import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Space,
  message,
  Button,
  Result,
} from "antd";
import {
  WalletOutlined,
  BankOutlined,
  LineChartOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined, // Import icon mũi tên
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom"; // Import hook điều hướng
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

// --- IMPORTS UTILS & COMPONENTS ---
import {
  THEME,
  toNumber,
  formatCurrency,
  isSuccessStatus,
  isPendingStatus,
  normalizeStatus,
  deriveGrossProfitFromPayments,
  deriveTransactionRows,
  buildChartData,
  fetchJson,
  getDefaultDateRange,
  applyQuickRange,
  exportTransactionsToCsv,
} from "../utils/financeUtils";

import {
  StatCard,
  FinanceHeader,
  RevenueChart,
  CashFlowForecast,
  // WithdrawModal, -> Đã bỏ import này vì dùng trang riêng
} from "../components/FinanceSeller/FinanceComponents";

import TransactionHistory from "../components/FinanceSeller/TransactionHistory";

// --- MAIN PAGE COMPONENT ---

const FinancePage = () => {
  const navigate = useNavigate(); // Hook để chuyển trang
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data States
  const [summary, setSummary] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    monthlyRevenue: 0,
    monthlyWithdrawn: 0,
  });
  const [rawTransactions, setRawTransactions] = useState([]); 

  // Filter States
  const [filters, setFilters] = useState({
    dateRange: getDefaultDateRange(),
    quickRange: "thisMonth",
    types: [],
    searchText: "",
  });

  // --- 1. DATA FETCHING LOGIC ---
  const loadFinanceData = useCallback(async (toggleLoading = true) => {
    if (toggleLoading) setLoading(true);
    setError(null);
    try {
      const [balanceRes, chartRes, financeRes] = await Promise.all([
        fetchJson("/api/payments/wallet/balance/"),
        fetchJson("/api/payments/seller/revenue_chart/"),
        fetchJson("/api/payments/seller/finance/"),
      ]);

      if (balanceRes?.error) throw new Error(balanceRes.error);
      if (financeRes?.error) throw new Error(financeRes.error);

      // Xử lý dữ liệu
      const derivedSummary = deriveGrossProfitFromPayments(financeRes?.payments || []);
      const derivedTransactions = deriveTransactionRows(financeRes?.payments);

      const monthlyRevenue = (financeRes?.payments || [])
        .filter((payment) => {
          const isSuccess = isSuccessStatus(payment?.status);
          const isThisMonth = dayjs(payment?.created_at || payment?.createdAt).isSame(dayjs(), "month");
          return isSuccess && isThisMonth;
        })
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

      const monthlyWithdrawn = (financeRes?.withdraws || [])
        .filter((withdraw) => {
          const isPaid = ["paid", "approved", "success"].includes(normalizeStatus(withdraw?.status));
          const isThisMonth = dayjs(withdraw?.created_at || withdraw?.createdAt).isSame(dayjs(), "month");
          return isPaid && isThisMonth;
        })
        .reduce((sum, withdraw) => sum + toNumber(withdraw.amount), 0);

      const pendingBalance = (financeRes?.payments || [])
        .filter((payment) => isPendingStatus(payment?.status))
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

      setSummary({
        availableBalance: toNumber(balanceRes?.balance),
        pendingBalance,
        monthlyRevenue,
        monthlyWithdrawn,
        grossProfit: derivedSummary.grossProfit,
      });
      setRawTransactions(derivedTransactions);

    } catch (err) {
      console.error("Lỗi tải dữ liệu tài chính:", err);
      const errorMessage = err.message || "Không thể tải dữ liệu";
      if (errorMessage.includes("Seller not found")) setError("seller_not_found");
      else if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) setError("unauthorized");
      else setError("general");
      message.error(errorMessage);
    } finally {
      if (toggleLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // --- 2. CLIENT-SIDE FILTERING LOGIC ---
  const filteredTransactions = useMemo(() => {
    const { dateRange, types, searchText } = filters;
    const [startDate, endDate] = dateRange || [];

    return rawTransactions.filter((transaction) => {
      // Type Filter
      const matchesType = types.length > 0 ? types.includes(transaction.type) : true;

      // Search Filter
      const matchesSearch = searchText
        ? [transaction.orderId, transaction.transactionId, transaction.description]
          .filter(Boolean)
          .some((text) => text.toString().toLowerCase().includes(searchText.toLowerCase()))
        : true;

      // Date Filter
      const date = transaction.createdAt ? dayjs(transaction.createdAt) : null;
      const matchesDate = date
        ? (!startDate || isSameOrAfter(date, startDate, "day")) &&
          (!endDate || isSameOrBefore(date, endDate, "day"))
        : true;

      return matchesType && matchesSearch && matchesDate;
    });
  }, [filters, rawTransactions]);

  const chartData = useMemo(() => buildChartData(filteredTransactions), [filteredTransactions]);

  // --- 3. EVENT HANDLERS ---
  const handleQuickRangeChange = (value) => {
    const range = applyQuickRange(value);
    setFilters((prev) => ({ ...prev, quickRange: value, dateRange: range }));
  };

  const handleDateChange = (dates) => {
    setFilters((prev) => ({ ...prev, dateRange: dates, quickRange: undefined }));
  };

  const handleTypeChange = (values) => {
    setFilters((prev) => ({ ...prev, types: values }));
  };

  const handleSearch = (e) => {
    setFilters((prev) => ({ ...prev, searchText: e.target.value }));
  };

  const handleExport = () => {
    exportTransactionsToCsv(filteredTransactions, filters, message);
  };

  // --- 4. RENDER UI ---
  if (error === "unauthorized") {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
        <Result
          status="403"
          title="Vui lòng đăng nhập"
          subTitle="Bạn cần đăng nhập để xem thông tin tài chính."
          extra={<Button type="primary" href="/login">Đăng nhập ngay</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", paddingBottom: 40 }}>
      {/* Header: Giữ nguyên header để thống nhất layout */}
      <FinanceHeader
        onRefresh={() => loadFinanceData(true)}
        onExport={handleExport}
        loading={loading}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          
          {/* Card 1: Số dư khả dụng - LIÊN KẾT VỚI TRANG VÍ CỦA BẠN */}
          <Col xs={24} sm={12} lg={6}>
            <div style={{ position: 'relative', height: '100%' }}>
                <StatCard
                  loading={loading}
                  title="Số dư khả dụng"
                  value={formatCurrency(summary.availableBalance)}
                  icon={<WalletOutlined style={{ fontSize: 24 }} />}
                  color={THEME.primary}
                  subText="Có thể rút ngay lập tức"
                />
                
                {/* Nút điều hướng sang trang "Ví tiền" */}
                {!loading && (
                    <Button 
                        type="default" 
                        size="small" 
                        shape="round"
                        icon={<ArrowRightOutlined />}
                        style={{ 
                            position: 'absolute', 
                            right: 24, 
                            bottom: 24, 
                            color: THEME.primary,
                            borderColor: THEME.primary,
                            fontWeight: 500
                        }}
                        // Đường dẫn này trỏ đến trang trong ảnh bạn gửi
                        onClick={() => navigate('/seller-center/wallet')} 
                    >
                        Quản lý Ví
                    </Button>
                )}
            </div>
          </Col>

          {/* Các Card khác giữ nguyên để hiển thị chỉ số phân tích */}
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              loading={loading}
              title="Số dư chờ đối soát"
              value={formatCurrency(summary.pendingBalance)}
              icon={<BankOutlined style={{ fontSize: 24 }} />}
              color={THEME.warning}
              subText="Sẽ khả dụng sau khi hoàn tất đơn"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              loading={loading}
              title="Doanh thu tháng này"
              value={formatCurrency(summary.monthlyRevenue)}
              icon={<LineChartOutlined style={{ fontSize: 24 }} />}
              color={THEME.secondary}
              subText={<Space><ArrowUpOutlined /> Tính từ đầu tháng</Space>}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              loading={loading}
              title="Đã rút tháng này"
              value={formatCurrency(summary.monthlyWithdrawn)}
              icon={<DownloadOutlined style={{ fontSize: 24 }} />}
              color={THEME.textSecondary}
              subText="Tổng tiền đã về tài khoản ngân hàng"
            />
          </Col>
        </Row>

        {/* Charts & Forecast */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <RevenueChart data={chartData} loading={loading} />
          </Col>
          <Col xs={24} lg={8}>
            <CashFlowForecast pendingBalance={summary.pendingBalance} />
          </Col>
        </Row>

        {/* Transaction Table - Lịch sử chi tiết */}
        <TransactionHistory
          transactions={filteredTransactions}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          onQuickRangeChange={handleQuickRangeChange}
          onDateChange={handleDateChange}
          onTypeChange={handleTypeChange}
          onSearch={handleSearch}
        />
      </div>
    </div>
  );
};

export default FinancePage;