// src/features/admin/pages/reports/ReportRevenuePage.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  DatePicker,
  Select,
  Space,
  Statistic,
  Row,
  Col,
  message,
} from "antd";
import {
  WalletOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../../features/login_register/services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const { RangePicker } = DatePicker;

export default function ReportRevenuePage() {
  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [filterType, setFilterType] = useState("day"); // "day", "month", "year"
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
  });
  const [chartData, setChartData] = useState([]);

  const loadData = async () => {
    try {
      const isAdmin = localStorage.getItem("is_admin") === "true";
      const endpoint = isAdmin ? "/orders/admin-list/" : "/orders/";
      const res = await api.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data);
      processStats(data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu thống kê");
    }
  };

  const processStats = (data) => {
    // lọc theo range
    let filtered = data.filter((o) => {
      const d = dayjs(o.created_at);
      return d.isAfter(dateRange[0].startOf("day")) && d.isBefore(dateRange[1].endOf("day"));
    });

    const successOrders = filtered.filter((o) => o.status === "success");
    const pendingOrders = filtered.filter((o) => o.status === "pending" || o.status === "shipping");
    const cancelledOrders = filtered.filter((o) => o.status === "cancelled");

    const totalRevenue = successOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    // Gom nhóm dữ liệu cho biểu đồ
    const grouped = {};
    filtered.forEach((o) => {
      let key;
      if (filterType === "day") key = dayjs(o.created_at).format("YYYY-MM-DD");
      if (filterType === "month") key = dayjs(o.created_at).format("YYYY-MM");
      if (filterType === "year") key = dayjs(o.created_at).format("YYYY");
      if (!grouped[key]) grouped[key] = 0;
      if (o.status === "success") grouped[key] += Number(o.total_price || 0);
    });

    const chartArr = Object.keys(grouped)
      .sort()
      .map((k) => ({
        time: k,
        revenue: grouped[k],
      }));

    setStats({
      totalRevenue,
      successOrders: successOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
    });
    setChartData(chartArr);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    processStats(orders);
    // eslint-disable-next-line
  }, [dateRange, filterType]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Bộ lọc */}
      <Card className="rounded-2xl shadow-md">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v || [])}
            format="YYYY-MM-DD"
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: "day", label: "Theo ngày" },
              { value: "month", label: "Theo tháng" },
              { value: "year", label: "Theo năm" },
            ]}
          />
        </Space>
      </Card>

      {/* Thống kê nhanh */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={stats.totalRevenue}
              suffix="đ"
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn hàng hoàn tất"
              value={stats.successOrders}
              prefix={<CheckCircleOutlined style={{ color: "green" }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn hàng đang xử lý"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined style={{ color: "orange" }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn hàng bị hủy"
              value={stats.cancelledOrders}
              prefix={<CloseCircleOutlined style={{ color: "red" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ */}
      <Card title="Xu hướng doanh thu">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toLocaleString()} đ`} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
