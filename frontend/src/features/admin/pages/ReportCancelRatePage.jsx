// src/features/admin/pages/ReportCancelRatePage.jsx
import React, { useState, useEffect } from "react";
import {
  Card, Table, Select, DatePicker, Input, Button, Tag, Space, Pagination, message,
} from "antd";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, FileText, Filter } from "lucide-react";
import dayjs from "dayjs";
import api from "../../../features/login_register/services/api";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReportCancelRatePage() {
  const [data, setData] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [category, setCategory] = useState("all");
  const [product, setProduct] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ total: 0, cancelled: 0, rate: 0, avgRate: 0 });
  const pageSize = 12;

  const fetchOrders = async (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const isAdmin = localStorage.getItem("is_admin") === "true";
    const endpoint = isAdmin ? `/orders/admin-list/` : `/orders/`;
    const url = `${endpoint}${searchParams ? `?${searchParams}` : ""}`;
    const res = await api.get(url);
    return res.data;
  };

  const transformOrdersToReport = (orders) => {
    const rows = [];
    const days = {};

    for (const o of orders) {
      const status = o.status;
      const date = dayjs(o.created_at).format("YYYY-MM-DD");
      const firstItem = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null;
      const product = firstItem?.product_name || `Order-${o.id}`;
      const category = firstItem?.product?.category_name || "Unknown";

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

    const categories = Array.from(new Set(rows.map((r) => r.category))).filter(Boolean);
    const products = Array.from(new Set(rows.map((r) => r.product))).filter(Boolean);

    return { rows, data, categories, products };
  };

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

  const handleApplyFilter = async () => {
    try {
      const query = {};
      if (search) query.search = search;
      const orders = await fetchOrders(query);
      const { rows, data } = transformOrdersToReport(orders);

      let filteredRows = rows;
      if (category !== "all") filteredRows = filteredRows.filter((r) => r.category === category);
      if (product !== "all") filteredRows = filteredRows.filter((r) => r.product === product);
      filteredRows = filteredRows.filter((r) =>
        dayjs(r.date).isBetween(dateRange[0], dateRange[1], null, "[]")
      );

      setTableRows(filteredRows);
      setData(data);
      calcSummary(filteredRows, data);
      setPage(1);
    } catch (err) {
      console.error(err);
      message.error("Lọc dữ liệu thất bại");
    }
  };

  const calcSummary = (rows, data) => {
    const total = rows.length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const rate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;
    const avgRate =
      data.length > 0
        ? (data.reduce((acc, d) => acc + parseFloat(d.rate), 0) / data.length).toFixed(1)
        : 0;
    setSummary({ total, cancelled, rate, avgRate });
  };

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
        status === "cancelled" ? <Tag color="red">Cancelled</Tag> : <Tag color="green">Completed</Tag>,
    },
    { title: "Date", dataIndex: "date", key: "date" },
  ];

  const paginatedRows = tableRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6">
      <Card title="Bộ lọc" className="shadow-md">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            format="YYYY-MM-DD"
          />
          <Select value={category} onChange={setCategory} style={{ width: 160 }}>
            {categories.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
          <Select value={product} onChange={setProduct} style={{ width: 160 }}>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><h3>Tổng số đơn</h3><p className="text-2xl">{summary.total}</p></Card>
        <Card><h3>Số đơn bị hủy</h3><p className="text-2xl text-red-500">{summary.cancelled}</p></Card>
        <Card><h3>Tỷ lệ hủy</h3><p className="text-2xl">{summary.rate}%</p></Card>
        <Card><h3>Tỷ lệ hủy TB theo ngày</h3><p className="text-2xl">{summary.avgRate}%</p></Card>
      </div>

      <div id="report-canvas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Tỷ lệ đơn bị hủy theo ngày">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rate" name="Tỷ lệ hủy" stroke="#f5222d" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Số lượng đơn bị hủy">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cancelled" name="Đơn hủy" fill="#ff4d4f" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Chi tiết đơn hàng" extra={
          <Space>
            <Button icon={<FileText />} type="default">
              <CSVLink data={tableRows} filename="cancelled-orders.csv">Xuất CSV</CSVLink>
            </Button>
            <Button icon={<Download />} onClick={exportPDF}>
              Xuất PDF
            </Button>
          </Space>
        }>
          <Table
            columns={columns}
            dataSource={paginatedRows}
            pagination={false}
            rowKey="orderNo"
            scroll={{ x: 800 }}
          />
          <div className="mt-4 text-center">
            <Pagination
              current={page}
              total={tableRows.length}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
