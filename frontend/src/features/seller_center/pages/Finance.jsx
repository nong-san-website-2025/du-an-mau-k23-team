import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Row, Col, Space, message, Button, Result } from "antd";
import {
  WalletOutlined,
  BankOutlined,
  LineChartOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

// Utils & Components
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
} from "../components/FinanceSeller/FinanceComponents";

import TransactionHistory from "../components/FinanceSeller/TransactionHistory";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const FinancePage = () => {
  const navigate = useNavigate();

  // --- 1. TÁCH STATE LOADING ---
  // Loading cho số dư (nhẹ)
  const [balanceLoading, setBalanceLoading] = useState(true);
  // Loading cho dữ liệu lịch sử/biểu đồ (nặng)
  const [dataLoading, setDataLoading] = useState(true);

  const [error, setError] = useState(null);

  // Data States
  const [balanceInfo, setBalanceInfo] = useState({
    availableBalance: 0,
    pendingBalance: 0, // Nếu API balance trả về cái này thì tốt, nếu không sẽ update sau ở luồng nặng
  });

  const [analyticalData, setAnalyticalData] = useState({
    monthlyRevenue: 0,
    monthlyWithdrawn: 0,
    grossProfit: 0,
    pendingFromHistory: 0, // Fallback nếu API balance không trả về pending
  });

  const [rawTransactions, setRawTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Filter States
  const [filters, setFilters] = useState({
    dateRange: getDefaultDateRange(),
    quickRange: "thisMonth",
    types: [],
    searchText: "",
  });

  // --- 2. API CALLS (TÁCH BIỆT) ---

  // A. Luồng nhanh: Chỉ lấy Balance
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const balanceRes = await fetchJson("/api/payments/wallet/balance/");
      if (balanceRes?.error) throw new Error(balanceRes.error);

      setBalanceInfo({
        availableBalance: toNumber(balanceRes?.balance),
        // Ưu tiên lấy pending từ API balance nếu có (nhanh hơn)
        pendingBalance: toNumber(balanceRes?.pending_balance || 0),
      });
    } catch (err) {
      console.error("Lỗi tải số dư:", err);
      // Không set error global để tránh chặn UI phần khác
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // B. Luồng nặng: Lấy Chart & Transaction History
  const fetchHeavyData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [chartRes, financeRes] = await Promise.all([
        fetchJson("/api/payments/seller/revenue_chart/"),
        fetchJson("/api/payments/seller/finance/"),
      ]);

      if (financeRes?.error) throw new Error(financeRes.error);

      // --- XỬ LÝ DỮ LIỆU NẶNG ---
      const payments = financeRes?.payments || [];
      const withdraws = financeRes?.withdraws || [];

      // 1. Tính toán Chart
      const derivedTransactions = deriveTransactionRows(payments);
      const fallbackChartData = buildChartData(derivedTransactions);
      const apiChartData = Array.isArray(chartRes?.data) ? chartRes.data : [];
      const normalizedChartData = apiChartData.length
        ? apiChartData.map((point) => ({
            date: point?.date,
            metric: point?.metric,
            value: toNumber(point?.value),
          }))
        : fallbackChartData;

      setChartData(normalizedChartData);
      setRawTransactions(derivedTransactions);

      // 2. Tính toán các chỉ số thống kê (Revenue, Withdraw, Profit)
      const currentMonth = dayjs();

      const monthlyRevenue = payments
        .filter(
          (p) =>
            isSuccessStatus(p?.status) &&
            dayjs(p?.created_at).isSame(currentMonth, "month")
        )
        .reduce((sum, p) => sum + toNumber(p.amount), 0);

      const monthlyWithdrawn = withdraws
        .filter(
          (w) =>
            ["paid", "approved", "success"].includes(
              normalizeStatus(w?.status)
            ) && dayjs(w?.created_at).isSame(currentMonth, "month")
        )
        .reduce((sum, w) => sum + toNumber(w.amount), 0);

      const pendingCalc = payments
        .filter((p) => isPendingStatus(p?.status))
        .reduce((sum, p) => sum + toNumber(p.amount), 0);

      const derivedSummary = deriveGrossProfitFromPayments(payments);

      setAnalyticalData({
        monthlyRevenue,
        monthlyWithdrawn,
        grossProfit: derivedSummary.grossProfit,
        pendingFromHistory: pendingCalc,
      });
    } catch (err) {
      console.error("Lỗi tải dữ liệu chi tiết:", err);
      const errorMessage = err.message || "Không thể tải dữ liệu";
      if (errorMessage.includes("Unauthorized")) setError("unauthorized");
      else message.warning("Không thể tải lịch sử giao dịch lúc này");
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Gọi cả 2 luồng khi mount hoặc refresh
  const handleRefresh = useCallback(() => {
    setError(null);
    fetchBalance();
    fetchHeavyData();
  }, [fetchBalance, fetchHeavyData]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // --- 3. FILTER LOGIC (Giữ nguyên useMemo để tối ưu render) ---
  const filteredTransactions = useMemo(() => {
    const { dateRange, types, searchText } = filters;
    const [startDate, endDate] = dateRange || [];

    // Nếu chưa có data thì return mảng rỗng ngay
    if (!rawTransactions.length) return [];

    return rawTransactions.filter((transaction) => {
      const matchesType =
        types.length > 0 ? types.includes(transaction.type) : true;
      const matchesSearch = searchText
        ? [
            transaction.orderId,
            transaction.transactionId,
            transaction.description,
          ]
            .filter(Boolean)
            .some((text) =>
              text.toString().toLowerCase().includes(searchText.toLowerCase())
            )
        : true;

      const date = transaction.createdAt ? dayjs(transaction.createdAt) : null;
      const matchesDate = date
        ? (!startDate || dayjs(date).isSameOrAfter(startDate, "day")) &&
          (!endDate || dayjs(date).isSameOrBefore(endDate, "day"))
        : true;

      return matchesType && matchesSearch && matchesDate;
    });
  }, [filters, rawTransactions]);

  // --- HANDLERS (Giữ nguyên) ---
  const handleQuickRangeChange = (value) =>
    setFilters((prev) => ({
      ...prev,
      quickRange: value,
      dateRange: applyQuickRange(value),
    }));
  const handleDateChange = (dates) =>
    setFilters((prev) => ({
      ...prev,
      dateRange: dates,
      quickRange: undefined,
    }));
  const handleTypeChange = (values) =>
    setFilters((prev) => ({ ...prev, types: values }));
  const handleSearch = (e) =>
    setFilters((prev) => ({ ...prev, searchText: e.target.value }));
  const handleExport = () =>
    exportTransactionsToCsv(filteredTransactions, filters, message);

  // --- 4. RENDER UI ---
  if (error === "unauthorized") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f0f2f5",
        }}
      >
        <Result
          status="403"
          title="Vui lòng đăng nhập"
          subTitle="Bạn cần đăng nhập để xem thông tin tài chính."
          extra={
            <Button type="primary" href="/login">
              Đăng nhập ngay
            </Button>
          }
        />
      </div>
    );
  }

  // Sử dụng pendingBalance từ API Balance (nếu có), nếu không dùng từ tính toán lịch sử
  const displayPending =
    balanceInfo.pendingBalance || analyticalData.pendingFromHistory;

  return (
    <div
      style={{ minHeight: "100vh", background: "#f0f2f5", paddingBottom: 40 }}
    >
      <FinanceHeader
        onRefresh={handleRefresh}
        onExport={handleExport}
        // Button loading chỉ quay khi cả 2 chưa xong, hoặc chỉ cần dataLoading là đủ
        loading={balanceLoading || dataLoading}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        {/* --- KHU VỰC STATS --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Card 1: Load SIÊU NHANH (balanceLoading) */}
          <Col xs={24} sm={12} lg={6}>
            <div style={{ position: "relative", height: "100%" }}>
              <StatCard
                loading={balanceLoading} // Chỉ phụ thuộc vào API balance
                title="Số dư khả dụng"
                value={formatCurrency(balanceInfo.availableBalance)}
                icon={<WalletOutlined style={{ fontSize: 24 }} />}
                color={THEME.primary}
                subText="Có thể rút ngay lập tức"
              />
              {!balanceLoading && (
                <Button
                  type="default"
                  size="small"
                  shape="round"
                  icon={<ArrowRightOutlined />}
                  style={{
                    position: "absolute",
                    right: 24,
                    bottom: 24,
                    color: THEME.primary,
                    borderColor: THEME.primary,
                    fontWeight: 500,
                  }}
                  onClick={() => navigate("/seller-center/wallet")}
                >
                  Quản lý Ví
                </Button>
              )}
            </div>
          </Col>

          {/* Các Card sau: Load CHẬM HƠN (dataLoading) vì cần tính toán từ lịch sử */}
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              // Nếu API balance trả về pending thì dùng balanceLoading (nhanh), không thì dùng dataLoading
              loading={
                balanceInfo.pendingBalance ? balanceLoading : dataLoading
              }
              title="Số dư chờ đối soát"
              value={formatCurrency(displayPending)}
              icon={<BankOutlined style={{ fontSize: 24 }} />}
              color={THEME.warning}
              subText="Sẽ khả dụng sau khi hoàn tất"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              loading={dataLoading}
              title="Doanh thu tháng này"
              value={formatCurrency(analyticalData.monthlyRevenue)}
              icon={<LineChartOutlined style={{ fontSize: 24 }} />}
              color={THEME.secondary}
              subText={
                <Space>
                  <ArrowUpOutlined /> Tính từ đầu tháng
                </Space>
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              loading={dataLoading}
              title="Đã rút tháng này"
              value={formatCurrency(analyticalData.monthlyWithdrawn)}
              icon={<DownloadOutlined style={{ fontSize: 24 }} />}
              color={THEME.textSecondary}
              subText="Tổng tiền đã về ngân hàng"
            />
          </Col>
        </Row>

        {/* --- KHU VỰC CHARTS (Load Chậm) --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* Truyền dataLoading vào để hiển thị Skeleton/Spinner riêng khu vực này */}
            <RevenueChart data={chartData} loading={dataLoading} />
          </Col>
          <Col xs={24} lg={8}>
            <CashFlowForecast
              pendingBalance={displayPending}
              loading={dataLoading}
            />
          </Col>
        </Row>

        {/* --- KHU VỰC TABLE (Load Chậm) --- */}
        <TransactionHistory
          transactions={filteredTransactions}
          loading={dataLoading}
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
