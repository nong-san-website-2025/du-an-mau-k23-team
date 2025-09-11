// src/features/admin/pages/ReportCancelRatePage.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Select,
  DatePicker,
  Input,
  Button,
  Tag,
  Space,
  Pagination,
  message,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, FileText, Filter } from "lucide-react";
import dayjs from "dayjs";

// Use shared API base + token interceptor
import api from "../../../features/login_register/services/api";

const { RangePicker } = DatePicker;
const { Option } = Select;

// ======================= API HELPERS ==========================
// Fetch orders for admin or current user (depending on role on backend)
const fetchOrders = async (params = {}) => {
  // Backend supports /api/orders/ with filters, admin may use /api/orders/admin-list/
  const searchParams = new URLSearchParams(params).toString();
  // Prefer admin endpoint if role is admin
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const endpoint = isAdmin ? `/orders/admin-list/` : `/orders/`;
  const url = `${endpoint}${searchParams ? `?${searchParams}` : ""}`;
  const res = await api.get(url); // axios from shared api client
  return res.data;
};

// Transform raw orders to rows for table and aggregate for charts
const transformOrdersToReport = (orders) => {
  const rows = [];
  const days = {}; // { 'YYYY-MM-DD': { total, cancelled } }

  for (const o of orders) {
    const status = o.status; // 'pending' | 'shipping' | 'success' | 'cancelled'
    const date = dayjs(o.created_at).format("YYYY-MM-DD");

    // Derive product/category from first item (simplify for reporting)
    const firstItem = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null;
    const product = firstItem?.product_name || `Order-${o.id}`;
    const category = firstItem?.product?.category_name || "Unknown"; // backend may not include, fallback

    rows.push({
      orderNo: `ORD-${o.id}`,
      product,
      category,
      status,
      date,
      amount: Number(o.total_price || 0),
    });

    if (!days[date]) days[date] = { total: 0, cancelled: 0 };
    days[date].total += 1;
    if (status === "cancelled") days[date].cancelled += 1;
  }

  const data = Object.keys(days)
    .sort()
    .map((d) => ({
      date: d,
      total: days[d].total,
      cancelled: days[d].cancelled,
      rate: days[d].total > 0 ? ((days[d].cancelled / days[d].total) * 100).toFixed(1) : "0.0",
    }));

  // Simple category/product lists from rows
  const categories = Array.from(new Set(rows.map((r) => r.category))).filter(Boolean);
  const products = Array.from(new Set(rows.map((r) => r.product))).filter(Boolean);

  return { rows, data, categories, products };
};

// ======================= COMPONENT ==========================
const ReportCancelRatePage = () => {
  const [data, setData] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Filter state
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [category, setCategory] = useState("all");
  const [product, setProduct] = useState("all");
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Summary
  const [summary, setSummary] = useState({
    total: 0,
    cancelled: 0,
    rate: 0,
    avgRate: 0,
  });

  // ====== Fetch Data ======
  useEffect(() => {
    const load = async () => {
      try {
        const orders = await fetchOrders();
        const { rows, data, categories, products } = transformOrdersToReport(orders);
        setTableRows(rows);
        setData(data);
        setCategories(["all", ...categories]);
        setProducts(["all", ...products]);
        calcSummary(rows, data);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải dữ liệu đơn hàng");
      }
    };
    load();
  }, []);

  // ====== Filter Apply ======
  const handleApplyFilter = async () => {
    try {
      // Build query for backend filtering (status, search). Date-range filtering will also be done client-side unless backend supports it.
      const query = {};
      if (search) query.search = search;
      // Optionally include status filter; we only need cancelled vs others for stats, so keep all

      const orders = await fetchOrders(query);
      const { rows, data } = transformOrdersToReport(orders);

      // Client-side filters for category/product
      let filteredRows = rows;
      if (category !== "all") filteredRows = filteredRows.filter((r) => r.category === category);
      if (product !== "all") filteredRows = filteredRows.filter((r) => r.product === product);

      // Date range
      filteredRows = filteredRows.filter((r) =>
        dayjs(r.date).isBetween(dateRange[0], dateRange[1], null, "[]")
      );

      setTableRows(filteredRows);
      setData(data); // keep chart data as overall day aggregates for now
      calcSummary(filteredRows, data);
      setPage(1);
    } catch (err) {
      console.error(err);
      message.error("Lọc dữ liệu thất bại");
    }
  };

  // ====== Summary ======
  const calcSummary = (rows, data) => {
    const total = rows.length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const rate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;
    const avgRate =
      data.length > 0
        ? (
            data.reduce((acc, d) => acc + parseFloat(d.rate), 0) / data.length
          ).toFixed(1)
        : 0;

    setSummary({ total, cancelled, rate, avgRate });
  };

  // ====== Export PDF ======
  const exportPDF = () => {
    const input = document.getElementById("report-canvas");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("report-cancel-rate.pdf");
    });
  };

  // ====== Table Columns ======
  const columns = [
    { title: "Order", dataIndex: "orderNo", key: "orderNo" },
    { title: "Product", dataIndex: "product", key: "product" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "cancelled" ? (
          <Tag color="red">Cancelled</Tag>
        ) : (
          <Tag color="green">Completed</Tag>
        ),
    },
    { title: "Date", dataIndex: "date", key: "date" },
  ];

  // ====== Paginated Rows ======
  const paginatedRows = tableRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* FILTERS */}
      <Card title="Bộ lọc" className="shadow-md">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            format="YYYY-MM-DD"
          />
          <Select value={category} onChange={setCategory} style={{ width: 160 }}>
            <Option value="all">Tất cả loại</Option>
            {categories.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
          <Select value={product} onChange={setProduct} style={{ width: 160 }}>
            <Option value="all">Tất cả sản phẩm</Option>
            {products.map((p) => (
              <Option key={p} value={p}>
                {p}
              </Option>
            ))}
          </Select>
          <Input.Search
            placeholder="Tìm kiếm Order, Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<Filter />} onClick={handleApplyFilter}>
            Áp dụng
          </Button>
        </Space>
      </Card>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <h3 className="text-lg font-semibold">Tổng số đơn</h3>
          <p className="text-2xl">{summary.total}</p>
        </Card>
        <Card className="shadow-md">
          <h3 className="text-lg font-semibold">Số đơn bị hủy</h3>
          <p className="text-2xl text-red-500">{summary.cancelled}</p>
        </Card>
        <Card className="shadow-md">
          <h3 className="text-lg font-semibold">Tỷ lệ hủy</h3>
          <p className="text-2xl">{summary.rate}%</p>
        </Card>
        <Card className="shadow-md">
          <h3 className="text-lg font-semibold">Tỷ lệ hủy TB theo ngày</h3>
          <p className="text-2xl">{summary.avgRate}%</p>
        </Card>
      </div>

      {/* CHARTS + TABLE */}
      <div id="report-canvas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Tỷ lệ hủy theo ngày" className="shadow-md">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rate" stroke="#f87171" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Tổng đơn vs Hủy" className="shadow-md">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#60a5fa" />
                <Bar dataKey="cancelled" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* TABLE */}
        <Card
          title="Danh sách đơn"
          className="shadow-md"
          extra={
            <Space>
              <Button
                icon={<FileText />}
                onClick={exportPDF}
                type="default"
                className="border"
              >
                Xuất PDF
              </Button>
              <CSVLink data={tableRows} filename="report-cancel-rate.csv">
                <Button icon={<Download />} type="default" className="border">
                  Xuất CSV
                </Button>
              </CSVLink>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={paginatedRows}
            pagination={false}
            rowKey="orderNo"
          />
          <Pagination
            current={page}
            total={tableRows.length}
            pageSize={pageSize}
            onChange={(p) => setPage(p)}
            className="mt-4 text-center"
          />
        </Card>
      </div>
    </div>
  );
};

export default ReportCancelRatePage;
