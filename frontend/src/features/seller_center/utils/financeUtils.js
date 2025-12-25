import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

// --- CONFIGURATION ---
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// --- CONSTANTS ---
export const THEME = {
  primary: "#389e0d", // Green-7
  primaryLight: "#f6ffed", // Green-1
  primaryBorder: "#b7eb8f", // Green-3
  secondary: "#13c2c2", // Cyan
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  textSecondary: "#8c8c8c",
};

export const TRANSACTION_TYPE_OPTIONS = [
  { label: "Thanh toán đơn hàng", value: "sale", color: "green" },
  { label: "Hoàn tiền", value: "refund", color: "red" },
  { label: "Phí / Điều chỉnh", value: "fee", color: "gold" },
  { label: "Rút tiền", value: "withdraw", color: "cyan" },
  { label: "Khác", value: "other", color: "default" },
];

export const QUICK_RANGE_OPTIONS = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Tháng trước", value: "lastMonth" },
];

// --- HELPER FUNCTIONS ---

export const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

export const formatCurrency = (amount = 0) =>
  toNumber(amount).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const normalizeStatus = (status) => (status || "").toString().trim().toLowerCase();

export const isSuccessStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["success", "đã thanh toán", "paid", "completed", "hoàn tất"].some((key) =>
    normalized.includes(key)
  );
};

export const isPendingStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["pending", "đang xử lý", "chờ", "processing"].some((key) =>
    normalized.includes(key)
  );
};

export const isRefundStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ["refund", "hoàn", "trả lại"].some((key) => normalized.includes(key));
};

export const mapTransactionType = (type, status) => {
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

// --- DATA PROCESSING LOGIC ---

export const deriveTransactionRows = (payments) =>
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

export const deriveGrossProfitFromPayments = (payments) =>
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

export const buildChartData = (rows, dateKey = "createdAt") => {
  const grouped = new Map();
  rows.forEach((row) => {
    const dateValue = row[dateKey];
    if (!dateValue) return;
    const date = dayjs(dateValue).format("YYYY-MM-DD");
    const current = grouped.get(date) || {
      date,
      DoanhThu: 0,
      LoiNhuanGop: 0,
    };
    current.DoanhThu += toNumber(row.amount);
    current.LoiNhuanGop += toNumber(row.grossProfit);
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
    ]);
};

export const getDefaultDateRange = () => [dayjs().startOf("month"), dayjs()];

export const applyQuickRange = (value) => {
  const today = dayjs();
  switch (value) {
    case "7d": return [today.subtract(6, "day").startOf("day"), today.endOf("day")];
    case "30d": return [today.subtract(29, "day").startOf("day"), today.endOf("day")];
    case "thisMonth": return [today.startOf("month"), today.endOf("day")];
    case "lastMonth": return [today.subtract(1, "month").startOf("month"), today.subtract(1, "month").endOf("month")];
    default: return getDefaultDateRange();
  }
};

const RAW_API_URL = process.env.REACT_APP_API_URL || "";
const API_BASE_URL = RAW_API_URL.replace(/\/$/, "").replace(/\/api$/, "");
const resolveApiUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedUrl}` : normalizedUrl;
};

// --- API HELPER ---
export const fetchJson = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  const requestUrl = resolveApiUrl(url);
  const res = await fetch(requestUrl, {
    credentials: "include",
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const exportTransactionsToCsv = (rows, filters, messageApi) => {
  try {
    const header = [
      "Thời gian", "Mã đơn hàng", "Mã giao dịch", "Loại giao dịch", "Mô tả",
      "Số tiền", "Phí nền tảng", "Phí vận chuyển", "Phí thanh toán", "Phí dịch vụ",
      "Chi phí quảng cáo", "Giảm giá", "Thuế", "Giá vốn", "Lợi nhuận gộp", "Số dư cuối"
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
      .map((row) => row.map((val) => (typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const label = filters?.dateRange
      ? `${filters.dateRange[0]?.format("YYYYMMDD")}_to_${filters.dateRange[1]?.format("YYYYMMDD")}`
      : dayjs().format("YYYYMMDD_HHmmss");
    link.setAttribute("download", `seller-transactions-${label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if(messageApi) messageApi.success("Đã xuất sao kê giao dịch!");
  } catch (error) {
    console.error(error);
    if(messageApi) messageApi.error("Không thể xuất sao kê.");
  }
};