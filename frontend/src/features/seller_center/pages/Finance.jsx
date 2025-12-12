import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  message,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Spin,
  Alert,
} from "antd";
import {
  DownloadOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  WalletOutlined,
  SwapOutlined,
  LineChartOutlined,
  CalendarOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

const isSameOrBefore = (dateA, dateB, unit = "day") => !dayjs(dateA).isAfter(dateB, unit);
const isSameOrAfter = (dateA, dateB, unit = "day") => !dayjs(dateA).isBefore(dateB, unit);

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const TRANSACTION_TYPE_OPTIONS = [
  { label: "Thanh toán đơn hàng", value: "sale" },
  { label: "Hoàn tiền", value: "refund" },
  { label: "Phí / Điều chỉnh", value: "fee" },
  { label: "Rút tiền", value: "withdraw" },
  { label: "Khác", value: "other" },
];

const QUICK_RANGE_OPTIONS = [
  { label: "7 ngày", value: "7d" },
  { label: "14 ngày", value: "14d" },
  { label: "30 ngày", value: "30d" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Tháng trước", value: "lastMonth" },
];

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const formatCurrency = (amount = 0) =>
  toNumber(amount).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const normalizeStatus = (status) => (status || "").toString().trim().toLowerCase();

const isSuccessStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["success", "đã thanh toán", "paid", "completed", "hoàn tất"].some((key) =>
    normalized.includes(key)
  );
};

const isPendingStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["pending", "đang xử lý", "chờ", "processing"].some((key) =>
    normalized.includes(key)
  );
};

const isRefundStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["refund", "hoàn", "trả lại"].some((key) => normalized.includes(key));
};

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status);
  if (isSuccessStatus(normalized)) {
    return { color: "success", label: "Hoàn tất" };
  }
  if (isPendingStatus(normalized)) {
    return { color: "warning", label: "Đang chờ" };
  }
  if (isRefundStatus(normalized)) {
    return { color: "error", label: "Hoàn tiền" };
  }
  return { color: "default", label: "Khác" };
};

const mapTransactionType = (type, status) => {
  const cleanType = (type || "").trim().toLowerCase();
  if (cleanType) {
    if (cleanType.includes("refund") || cleanType.includes("hoàn")) return "refund";
    if (cleanType.includes("fee") || cleanType.includes("phí")) return "fee";
    if (cleanType.includes("withdraw") || cleanType.includes("rút")) return "withdraw";
    if (cleanType.includes("sale") || cleanType.includes("payment")) return "sale";
  }
  if (isRefundStatus(status)) return "refund";
  if (isPendingStatus(status)) return "sale";
  if (isSuccessStatus(status)) return "sale";
  return "other";
};

const deriveTransactionRows = (payments) =>
  (payments || []).map((payment) => {
    const orderId = payment?.order?.id || payment?.order_id || payment?.orderId;
    const transactionId = payment?.id || payment?.transaction_id || payment?.transactionId;
    const createdAt = payment?.created_at || payment?.createdAt;
    const amount = toNumber(payment?.amount);
    const status = payment?.status;
    const fees = payment?.fees || {};
    const payoutStatus = payment?.payout_status || payment?.payoutStatus || payment?.payout_status?.status;

    const platformFee = toNumber(fees?.platform_fee || payment?.platform_fee || payment?.platformFee);
    const shippingFee = toNumber(fees?.shipping_fee || payment?.shipping_fee || payment?.shippingFee);
    const paymentFee = toNumber(fees?.payment_fee || payment?.payment_fee || payment?.paymentFee);
    const serviceFee = toNumber(fees?.service_fee || payment?.service_fee || payment?.serviceFee);
    const advertisementFee = toNumber(fees?.advertisement_fee || payment?.advertisement_fee || payment?.advertisementFee);
    const discount = toNumber(fees?.discount || payment?.discount || payment?.discount_amount);
    const tax = toNumber(fees?.tax || payment?.tax || payment?.tax_amount);
    const cogs = toNumber(payment?.cogs || payment?.cost_of_goods || payment?.costOfGoods);

    const totalFees = platformFee + shippingFee + paymentFee + serviceFee + advertisementFee + tax;
    const netAmount = amount - totalFees - discount;
    const grossProfit = netAmount - cogs;

    const type = mapTransactionType(payment?.type, status);
    const description = payment?.description || payment?.note || payment?.memo || "Thanh toán đơn hàng";
    const balanceAfter = payment?.balance_after || payment?.balanceAfter;

    return {
      key: transactionId || orderId || createdAt,
      transactionId,
      orderId,
      createdAt,
      description,
      type,
      status,
      payoutStatus,
      amount,
      platformFee,
      shippingFee,
      paymentFee,
      serviceFee,
      advertisementFee,
      discount,
      tax,
      cogs,
      grossProfit,
      netAmount,
      balanceAfter,
      raw: payment,
    };
  });

const getDefaultDateRange = () => [dayjs().startOf("month"), dayjs()];

const applyQuickRange = (value) => {
  const today = dayjs();
  switch (value) {
    case "7d":
      return [today.subtract(6, "day").startOf("day"), today.endOf("day")];
    case "14d":
      return [today.subtract(13, "day").startOf("day"), today.endOf("day")];
    case "30d":
      return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
    case "thisMonth":
      return [today.startOf("month"), today.endOf("day")];
    case "lastMonth":
      return [today.subtract(1, "month").startOf("month"), today.subtract(1, "month").endOf("month")];
    default:
      return getDefaultDateRange();
  }
};

const buildChartData = (rows, dateKey = "createdAt") => {
  const grouped = new Map();
  rows.forEach((row) => {
    const dateValue = row[dateKey];
    if (!dateValue) return;
    const date = dayjs(dateValue).format("YYYY-MM-DD");
    const current = grouped.get(date) || {
      date,
      DoanhThu: 0,
      LoiNhuanGop: 0,
      TongPhi: 0,
    };
    current.DoanhThu += toNumber(row.amount);
    current.LoiNhuanGop += toNumber(row.grossProfit);
    current.TongPhi +=
      toNumber(row.platformFee) +
      toNumber(row.shippingFee) +
      toNumber(row.paymentFee) +
      toNumber(row.serviceFee) +
      toNumber(row.advertisementFee) +
      toNumber(row.tax);
    grouped.set(date, current);
  });
  return Array.from(grouped.values())
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
    .flatMap((item) => [
      {
        date: item.date,
        metric: "Doanh thu",
        value: item.DoanhThu,
      },
      {
        date: item.date,
        metric: "Lợi nhuận gộp",
        value: item.LoiNhuanGop,
      },
      {
        date: item.date,
        metric: "Tổng phí",
        value: item.TongPhi,
      },
    ]);
};

const buildCashFlowForecast = (rows) => {
  const forecastDays = [7, 14, 30];
  const today = dayjs().startOf("day");
  return forecastDays.map((days) => {
    const endDate = today.add(days, "day");
    const expected = rows
      .filter((row) =>
        row?.payoutStatus
          ? normalizeStatus(row.payoutStatus).includes("pending") ||
          normalizeStatus(row.status).includes("pending")
          : normalizeStatus(row.status).includes("pending")
      )
      .filter((row) => {
        if (!row.createdAt) return false;
        const created = dayjs(row.createdAt).startOf("day");
        return isSameOrAfter(endDate, created, "day");
      })
      .reduce((sum, row) => sum + toNumber(row.netAmount), 0);

    return {
      key: days,
      label: `${days} ngày tới`,
      expected,
    };
  });
};

const exportTransactionsToCsv = async (rows, filters) => {
  try {
    const header = [
      "Thời gian",
      "Mã đơn hàng",
      "Mã giao dịch",
      "Loại giao dịch",
      "Mô tả",
      "Số tiền",
      "Phí nền tảng",
      "Phí vận chuyển",
      "Phí thanh toán",
      "Phí dịch vụ",
      "Chi phí quảng cáo",
      "Giảm giá",
      "Thuế",
      "Giá vốn",
      "Lợi nhuận gọp",
      "Số dư cuối",
    ];

    const body = rows.map((row) => [
      row.createdAt ? dayjs(row.createdAt).format("YYYY-MM-DD HH:mm") : "",
      row.orderId || "",
      row.transactionId || "",
      row.type,
      row.description,
      toNumber(row.amount),
      toNumber(row.platformFee),
      toNumber(row.shippingFee),
      toNumber(row.paymentFee),
      toNumber(row.serviceFee),
      toNumber(row.advertisementFee),
      toNumber(row.discount),
      toNumber(row.tax),
      toNumber(row.cogs),
      toNumber(row.grossProfit),
      toNumber(row.balanceAfter),
    ]);

    const csvContent = [header, ...body]
      .map((row) =>
        row
          .map((value) =>
            typeof value === "string"
              ? `"${value.replace(/"/g, '""')}` + "\""
              : value
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const label = filters?.dateRange
      ? `${filters.dateRange[0]}_to_${filters.dateRange[1]}`
      : dayjs().format("YYYYMMDD_HHmmss");
    link.setAttribute("download", `seller-transactions-${label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success("Đã xuất sao kê giao dịch!");
  } catch (error) {
    console.error(error);
    message.error("Không thể xuất sao kê, vui lòng thử lại sau");
  }
};

const fetchJson = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const deriveGrossProfitFromPayments = (payments) =>
  (payments || [])
    .filter((payment) => payment?.order)
    .reduce(
      (result, payment) => {
        const order = payment.order;
        const orderItems = order?.items || order?.order_items || [];
        const fees = payment?.fees || {};
        const totalAmount = toNumber(payment.amount);
        const platformFee = toNumber(fees?.platform_fee || payment?.platform_fee);
        const shippingFee = toNumber(fees?.shipping_fee || payment?.shipping_fee);
        const paymentFee = toNumber(fees?.payment_fee || payment?.payment_fee);
        const serviceFee = toNumber(fees?.service_fee || payment?.service_fee);
        const advertisementFee = toNumber(fees?.advertisement_fee || payment?.advertisement_fee);
        const discount = toNumber(fees?.discount || payment?.discount || payment?.discount_amount);
        const tax = toNumber(fees?.tax || payment?.tax || payment?.tax_amount);

        const cogs = orderItems.reduce((sum, item) => {
          const price = toNumber(item?.price || item?.unit_price || 0);
          const cost = toNumber(item?.cogs || item?.cost_of_goods || 0);
          return sum + cost * (item?.quantity || item?.qty || 1);
        }, 0);

        const totalFees = platformFee + shippingFee + paymentFee + serviceFee + advertisementFee + tax;
        const netAmount = totalAmount - totalFees - discount;
        const grossProfit = netAmount - cogs;

        result.totalRevenue += totalAmount;
        result.totalFees += totalFees + discount;
        result.totalCogs += cogs;
        result.grossProfit += grossProfit;
        return result;
      },
      {
        totalRevenue: 0,
        totalFees: 0,
        totalCogs: 0,
        grossProfit: 0,
      }
    );

const Finance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: getDefaultDateRange(),
    quickRange: "thisMonth",
    types: TRANSACTION_TYPE_OPTIONS.map((option) => option.value),
    searchText: "",
  });
  const [withdrawAmount, setWithdrawAmount] = useState();
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [summary, setSummary] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    monthlyRevenue: 0,
    monthlyWithdrawn: 0,
  });
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const loadFinanceData = useCallback(async (toggleLoading = true) => {
    if (toggleLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const [balanceRes, chartRes, financeRes] = await Promise.all([
        fetchJson("/api/payments/wallet/balance/"),
        fetchJson("/api/payments/seller/revenue_chart/"),
        fetchJson("/api/payments/seller/finance/"),
      ]);

      // Kiểm tra lỗi từ API
      if (balanceRes?.error) {
        throw new Error(balanceRes.error);
      }
      if (chartRes?.error) {
        throw new Error(chartRes.error);
      }
      if (financeRes?.error) {
        throw new Error(financeRes.error);
      }

      const derivedSummary = deriveGrossProfitFromPayments(financeRes?.payments || []);

      // Tính doanh thu tháng này từ payments có status SUCCESS trong tháng hiện tại
      const monthlyRevenue = (financeRes?.payments || [])
        .filter((payment) => {
          const isSuccess = isSuccessStatus(payment?.status);
          const isThisMonth = dayjs(payment?.created_at || payment?.createdAt).isSame(dayjs(), "month");
          return isSuccess && isThisMonth;
        })
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

      // Tính số tiền đã rút trong tháng này (chỉ tính các withdraw đã paid/approved)
      const monthlyWithdrawn = (financeRes?.withdraws || [])
        .filter((withdraw) => {
          const isPaid = ["paid", "approved", "success"].includes(
            normalizeStatus(withdraw?.status)
          );
          const isThisMonth = dayjs(withdraw?.created_at || withdraw?.createdAt).isSame(dayjs(), "month");
          return isPaid && isThisMonth;
        })
        .reduce((sum, withdraw) => sum + toNumber(withdraw.amount), 0);

      // Tính số dư đang chờ xử lý (payments có status PENDING)
      const pendingBalance = (financeRes?.payments || [])
        .filter((payment) =>
          isPendingStatus(payment?.status)
        )
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

      const derivedTransactions = deriveTransactionRows(financeRes?.payments);


      setSummary({
        availableBalance: toNumber(balanceRes?.balance),
        pendingBalance,
        monthlyRevenue,
        monthlyWithdrawn,
        grossProfit: derivedSummary.grossProfit,
        totalFees: derivedSummary.totalFees,
        totalCogs: derivedSummary.totalCogs,
      });
      setPayments(financeRes?.payments || []);
      setTransactions(derivedTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Finance data loading error:", err);
      const errorMessage = err.message || "Không thể tải dữ liệu tài chính";

      // Kiểm tra xem có token không
      const token = localStorage.getItem("token");

      // Lưu lỗi vào state để hiển thị UI phù hợp
      if (errorMessage.includes("Seller not found")) {
        setError("seller_not_found");
        message.error("Bạn chưa đăng ký làm người bán. Vui lòng đăng ký trước khi sử dụng tính năng này.");
      } else if (!token || errorMessage.includes("Authentication credentials were not provided") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        setError("unauthorized");
        message.error("Vui lòng đăng nhập để xem thông tin tài chính.");
      } else {
        setError("general");
        message.error(errorMessage);
      }
    } finally {
      if (toggleLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadFinanceData(false);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, loadFinanceData]);

  const filteredTransactions = useMemo(() => {
    const { dateRange, types, searchText } = filters;
    const [startDate, endDate] = dateRange || [];
    return transactions.filter((transaction) => {
      const matchesType = types.includes(transaction.type);
      const matchesSearch = searchText
        ? [transaction.orderId, transaction.transactionId, transaction.description]
          .filter(Boolean)
          .some((text) => text.toString().toLowerCase().includes(searchText.toLowerCase()))
        : true;

      const date = transaction.createdAt ? dayjs(transaction.createdAt) : null;
      const matchesDate = date
        ? (!startDate || isSameOrAfter(date, startDate, "day")) &&
        (!endDate || isSameOrBefore(date, endDate, "day"))
        : true;

      return matchesType && matchesSearch && matchesDate;
    });
  }, [filters, transactions]);

  const tableColumns = useMemo(
    () => [
      {
        title: "Thời gian",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
        sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
        defaultSortOrder: "descend",
      },
      {
        title: "Mã đơn hàng / giao dịch",
        dataIndex: "orderId",
        key: "orderId",
        render: (_, record) => (
          <Space direction="vertical" size={4}>
            {record.orderId && (
              <a href={`/seller/orders/${record.orderId}`} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
                #{record.orderId}
              </a>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              Txn: {record.transactionId || "-"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Loại giao dịch",
        dataIndex: "type",
        key: "type",
        render: (value, record) => (
          <Space direction="vertical" size={4}>
            <Tag color="blue" style={{ marginRight: 0 }}>
              {TRANSACTION_TYPE_OPTIONS.find((option) => option.value === value)?.label || "Khác"}
            </Tag>
            <Tag
              color={getStatusMeta(record.status).color}
              style={{ marginRight: 0 }}
            >
              {getStatusMeta(record.status).label}
            </Tag>
          </Space>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        render: (value) => <Text>{value || "-"}</Text>,
      },
      {
        title: "Số tiền thay đổi",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        render: (value, record) => (
          <Space direction="vertical" size={0} align="end">
            <Text style={{ color: value >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
              {formatCurrency(value)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Lợi nhuận gộp: {formatCurrency(record.grossProfit)}
            </Text>
          </Space>
        ),
      },
      {
        title: "Số dư cuối",
        dataIndex: "balanceAfter",
        key: "balanceAfter",
        align: "right",
        render: (value) => <Text>{formatCurrency(value)}</Text>,
      },
    ],
    []
  );

  const feeColumns = useMemo(
    () => [
      {
        title: "Loại phí",
        dataIndex: "label",
        key: "label",
      },
      {
        title: "Giá trị",
        dataIndex: "value",
        key: "value",
        align: "right",
        render: (value) => formatCurrency(value),
      },
      {
        title: "Tỷ lệ / Cơ sở",
        dataIndex: "ratio",
        key: "ratio",
      },
    ],
    []
  );

  const feeData = useMemo(() => {
    const totalRevenue = summary?.monthlyRevenue || 0;
    return [
      {
        key: "platformFee",
        label: "Phí nền tảng",
        value: summary?.platformFee || 0,
        ratio: totalRevenue ? `${((summary.platformFee || 0) / totalRevenue * 100).toFixed(2)}%` : "-",
      },
      {
        key: "shippingFee",
        label: "Phí vận chuyển",
        value: summary?.shippingFee || 0,
        ratio: totalRevenue ? `${((summary.shippingFee || 0) / totalRevenue * 100).toFixed(2)}%` : "-",
      },
      {
        key: "paymentFee",
        label: "Phí thanh toán",
        value: summary?.paymentFee || 0,
        ratio: totalRevenue ? `${((summary.paymentFee || 0) / totalRevenue * 100).toFixed(2)}%` : "-",
      },
      {
        key: "serviceFee",
        label: "Phí dịch vụ",
        value: summary?.serviceFee || 0,
        ratio: totalRevenue ? `${((summary.serviceFee || 0) / totalRevenue * 100).toFixed(2)}%` : "-",
      },
      {
        key: "advertisementFee",
        label: "Chi phí quảng cáo",
        value: summary?.advertisementFee || 0,
        ratio: totalRevenue ? `${((summary.advertisementFee || 0) / totalRevenue * 100).toFixed(2)}%` : "-",
      },
      {
        key: "tax",
        label: "Thuế",
        value: summary?.tax || 0,
        ratio: totalRevenue ? `${((summary.tax || 0) / totalRevenue * 100).toFixed(2)}%` : "-",
      },
    ];
  }, [summary]);

  const cashFlowForecast = useMemo(() => buildCashFlowForecast(filteredTransactions), [filteredTransactions]);

  const chartData = useMemo(() => buildChartData(filteredTransactions), [filteredTransactions]);

  const chartConfig = useMemo(
    () => ({
      data: chartData,
      xField: "date",
      yField: "value",
      animation: {
        appear: {
          animation: "path-in",
          duration: 3000,
        },
      },
      seriesField: "metric",
      height: 260,
      padding: "auto",
      smooth: true,
      xAxis: {
        tickCount: 6,
        label: {
          autoRotate: true,
        },
      },
      yAxis: {
        label: {
          formatter: (value) => `${Number(value) / 1000}K`,
        },
      },
      legend: {
        position: "top",
      },
      tooltip: {
        formatter: (datum) => ({
          name: datum.metric,
          value: formatCurrency(datum.value),
        }),
      },
    }),
    [filteredTransactions]
  );

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount < 10000) {
      message.warning("Nhập số tiền muốn rút (tối thiểu 10.000 VNĐ)");
      return;
    }
    setWithdrawLoading(true);
    try {
      await fetchJson("/api/payments/withdraw/request/", {
        method: "POST",
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      message.success("Yêu cầu rút tiền đã được gửi!");
      setWithdrawAmount(undefined);
      loadFinanceData();
    } catch (error) {
      message.error("Lỗi khi gửi yêu cầu rút tiền");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleQuickRangeChange = (value) => {
    const range = applyQuickRange(value);
    setFilters((prev) => ({
      ...prev,
      quickRange: value,
      dateRange: range,
    }));
  };

  const handleSearch = (event) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, searchText: value }));
  };

  const handleDateChange = (dates) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: dates,
      quickRange: undefined,
    }));
  };

  const handleTypeChange = (values) => {
    setFilters((prev) => ({ ...prev, types: values }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: getDefaultDateRange(),
      quickRange: "thisMonth",
      types: TRANSACTION_TYPE_OPTIONS.map((option) => option.value),
      searchText: "",
    });
  };

  const withdrawDisabled = toNumber(withdrawAmount) > summary.availableBalance;

  // Hiển thị UI lỗi nếu có
  if (error === "seller_not_found") {
    return (
      <div style={{ background: "#fafbfc", minHeight: "100vh", padding: 32 }}>
        <Card style={{ maxWidth: 600, margin: "100px auto", textAlign: "center", borderRadius: 16 }}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <InfoCircleOutlined style={{ fontSize: 64, color: "#faad14" }} />
            <Title level={3}>Bạn chưa đăng ký làm người bán</Title>
            <Text type="secondary">
              Để sử dụng tính năng quản lý tài chính, bạn cần đăng ký trở thành người bán trên hệ thống.
            </Text>
            <Space>
              <Button type="primary" size="large" href="/seller/register">
                Đăng ký làm người bán
              </Button>
              <Button size="large" onClick={loadFinanceData} icon={<ReloadOutlined />}>
                Thử lại
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div style={{ background: "#fafbfc", minHeight: "100vh", padding: 32 }}>
        <Card style={{ maxWidth: 600, margin: "100px auto", textAlign: "center", borderRadius: 16 }}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <InfoCircleOutlined style={{ fontSize: 64, color: "#ff4d4f" }} />
            <Title level={3}>Vui lòng đăng nhập</Title>
            <Text type="secondary">
              Bạn cần đăng nhập để xem thông tin tài chính của mình.
            </Text>
            <Space>
              <Button type="primary" size="large" href="/login">
                Đăng nhập
              </Button>
              <Button size="large" onClick={loadFinanceData} icon={<ReloadOutlined />}>
                Thử lại
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "24px" }}>
        <Space direction="vertical" size={24} style={{ width: "100%" }}>

          {/* Header Section */}
          <div style={{
            background: "linear-gradient(135deg, #1890ff 0%, #0050b3 100%)",
            borderRadius: "12px",
            padding: "32px",
            color: "white",
            boxShadow: "0 4px 16px rgba(24, 144, 255, 0.15)"
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical" size={8}>
                  <Space size={12} align="center">
                    <DollarOutlined style={{ fontSize: 32 }} />
                    <Title level={2} style={{ margin: 0, color: "white" }}>
                      Quản lý tài chính
                    </Title>
                  </Space>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                    Theo dõi doanh thu, chi phí và dòng tiền của cửa hàng
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadFinanceData} style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
                    Tải lại
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    type="primary"
                    style={{ background: "white", color: "#1890ff", border: "none" }}
                    onClick={() =>
                      exportTransactionsToCsv(filteredTransactions, {
                        dateRange: filters.dateRange?.map((date) => date?.format("YYYYMMDD")),
                      })
                    }
                  >
                    Xuất sao kê
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Main Statistics Cards */}
          <Row gutter={[16, 16]}>
            {/* Available Balance */}


            {/* Pending Balance */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  height: "100%",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: "20px", position: "relative" }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0) 100%)",
                  borderRadius: "0 0 0 80px"
                }} />
                <Space direction="vertical" size={12} style={{ width: "100%", position: "relative", zIndex: 1 }}>
                  <Space align="center">
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(249, 115, 22, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f97316"
                    }}>
                      <SwapOutlined style={{ fontSize: 20 }} />
                    </div>
                    <Space size={4}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Số dư chờ xử lý</Text>
                      <Tooltip title="Doanh thu đã ghi nhận nhưng đang tạm giữ">
                        <InfoCircleOutlined style={{ color: "#f97316", fontSize: 12 }} />
                      </Tooltip>
                    </Space>
                  </Space>
                  <Statistic
                    value={summary.pendingBalance}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#f97316", fontSize: 24, fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chuyển sang khả dụng sau khi hoàn tất đối soát
                  </Text>
                </Space>
              </Card>
            </Col>

            {/* Monthly Revenue */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  height: "100%",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: "20px", position: "relative" }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0) 100%)",
                  borderRadius: "0 0 0 80px"
                }} />
                <Space direction="vertical" size={12} style={{ width: "100%", position: "relative", zIndex: 1 }}>
                  <Space align="center">
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(14, 165, 233, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0ea5e9"
                    }}>
                      <LineChartOutlined style={{ fontSize: 20 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 13 }}>Doanh thu tháng này</Text>
                  </Space>
                  <Statistic
                    value={summary.monthlyRevenue}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#0ea5e9", fontSize: 24, fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tính từ đầu tháng đến nay
                  </Text>
                </Space>
              </Card>
            </Col>

            {/* Monthly Withdrawn */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  height: "100%",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: "20px", position: "relative" }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 100%)",
                  borderRadius: "0 0 0 80px"
                }} />
                <Space direction="vertical" size={12} style={{ width: "100%", position: "relative", zIndex: 1 }}>
                  <Space align="center">
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(99, 102, 241, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6366f1"
                    }}>
                      <BankOutlined style={{ fontSize: 20 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 13 }}>Đã rút tháng này</Text>
                  </Space>
                  <Statistic
                    value={summary.monthlyWithdrawn}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#6366f1", fontSize: 24, fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Các lệnh rút đã thành công
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                bodyStyle={{ padding: "20px" }}
                title={
                  <Space>
                    <LineChartOutlined style={{ color: "#1890ff" }} />
                    <span>Biểu đồ doanh thu & lợi nhuận</span>
                  </Space>
                }
              >
                {chartData.length > 0 ? (
                  <Line {...chartConfig} />
                ) : (
                  <Alert message="Chưa có dữ liệu để hiển thị" type="info" />
                )}
              </Card>
            </Col>

            {/* Cash Flow Forecast */}
            <Col xs={24} lg={10}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                bodyStyle={{ padding: "20px" }}
                title={
                  <Space>
                    <CalendarOutlined style={{ color: "#1890ff" }} />
                    <span>Dự báo dòng tiền</span>
                  </Space>
                }
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {cashFlowForecast.map((item) => (
                    <div key={item.key} style={{
                      padding: "12px",
                      background: "#f5f7fa",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #e5e7eb"
                    }}>
                      <Text>{item.label}</Text>
                      <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                        {formatCurrency(item.expected)}
                      </Text>
                    </div>
                  ))}
                  <Alert
                    message="Dự báo dựa trên giao dịch đang chờ hoàn tất"
                    type="info"
                    showIcon
                    style={{ marginTop: "8px" }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Fee Analysis */}
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "20px" }}
            title={
              <Space>
                <DollarOutlined style={{ color: "#1890ff" }} />
                <span>Phân tích chi phí</span>
              </Space>
            }
          >
            <Table
              columns={feeColumns}
              dataSource={feeData}
              pagination={false}
              rowKey="key"
              size="small"
              style={{ borderRadius: "8px" }}
            />
          </Card>

          {/* Transaction History */}
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "20px" }}
            title={
              <Space>
                <SwapOutlined style={{ color: "#1890ff" }} />
                <span>Lịch sử giao dịch</span>
              </Space>
            }
          >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {/* Filters */}
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} md={6}>
                  <Segmented
                    block
                    options={QUICK_RANGE_OPTIONS}
                    value={filters.quickRange}
                    onChange={handleQuickRangeChange}
                    size="small"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <RangePicker
                    style={{ width: "100%" }}
                    value={filters.dateRange}
                    format="DD/MM/YYYY"
                    onChange={handleDateChange}
                    allowClear={false}
                    size="small"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Loại giao dịch"
                    value={filters.types}
                    onChange={handleTypeChange}
                    options={TRANSACTION_TYPE_OPTIONS}
                    size="small"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Tìm kiếm..."
                    prefix={<SearchOutlined />}
                    value={filters.searchText}
                    onChange={handleSearch}
                    allowClear
                    size="small"
                  />
                </Col>
              </Row>
              <Row justify="space-between">
                <Col>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tìm thấy {filteredTransactions.length} giao dịch
                  </Text>
                </Col>
                <Col>
                  <Button type="text" size="small" onClick={handleResetFilters}>
                    Đặt lại bộ lọc
                  </Button>
                </Col>
              </Row>

              {/* Table */}
              <Table
                columns={tableColumns}
                dataSource={filteredTransactions}
                loading={loading}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                rowKey="key"
                size="middle"
                scroll={{ x: "max-content" }}
                summary={(pageData) => {
                  let sumAmount = 0;
                  let sumGrossProfit = 0;
                  let sumFees = 0;
                  pageData.forEach(({ amount, grossProfit, platformFee, shippingFee, paymentFee, serviceFee, advertisementFee, tax }) => {
                    sumAmount += toNumber(amount);
                    sumGrossProfit += toNumber(grossProfit);
                    sumFees +=
                      toNumber(platformFee) +
                      toNumber(shippingFee) +
                      toNumber(paymentFee) +
                      toNumber(serviceFee) +
                      toNumber(advertisementFee) +
                      toNumber(tax);
                  });
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <Text strong>Tổng trang hiện tại</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Space direction="vertical" size={0} align="end">
                          <Text strong>{formatCurrency(sumAmount)}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Phí: {formatCurrency(sumFees)}
                          </Text>
                        </Space>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>{formatCurrency(sumGrossProfit)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Space>
          </Card>
        </Space>
      </div>
    </Spin>
  );
};

export default Finance;