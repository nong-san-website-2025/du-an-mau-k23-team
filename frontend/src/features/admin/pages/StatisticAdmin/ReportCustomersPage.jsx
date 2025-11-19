// src/features/admin/pages/reports/ReportCustomersPage.jsx

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Table,
  Divider,
  Space,
  Spin,
  Alert,
} from "antd";

import {
  UserAddOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  StarOutlined,
} from "@ant-design/icons";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import AdminPageLayout from "../../components/AdminPageLayout";
import { fetchWithAuth } from "../../services/userApi";

const { RangePicker } = DatePicker;
const { Option } = Select;

const API_BASE_URL = "http://localhost:8000/api";

// Default empty state
const defaultSummary = {
  total: 0,
  newCustomers: 0,
  returningCustomers: 0,
  retentionRate: 0,
  avgRepeatDays: 28,
};

// Mock trend data for chart
const trendData = [
  { date: "2025-09-20", new: 12, returning: 8 },
  { date: "2025-09-21", new: 20, returning: 15 },
  { date: "2025-09-22", new: 18, returning: 12 },
  { date: "2025-09-23", new: 25, returning: 19 },
  { date: "2025-09-24", new: 30, returning: 20 },
];

const columns = [
  {
    title: "Khách hàng",
    dataIndex: "name",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Số đơn",
    dataIndex: "orders",
  },
  {
    title: "Tổng chi tiêu",
    dataIndex: "spent",
    render: (val) => val.toLocaleString() + " đ",
  },
];

export default function ReportCustomersPage() {
  const [filter, setFilter] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(defaultSummary);
  const [topCustomers, setTopCustomers] = useState([]);
  const [segmentationData, setSegmentationData] = useState([]);

  useEffect(() => {
    fetchCustomerStatistics();
  }, []);

  const fetchCustomerStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchWithAuth(
        `${API_BASE_URL}/users/statistics/customers/`
      );

      setSummary(data.summary || defaultSummary);
      setTopCustomers(data.topCustomers || []);
      setSegmentationData(data.segmentationData || []);
    } catch (err) {
      console.error("Error fetching customer statistics:", err);
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="BÁO CÁO KHÁCH HÀNG">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="BÁO CÁO KHÁCH HÀNG">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        {error && (
          <Alert
            message="Lỗi"
            description={`Không thể tải dữ liệu: ${error}`}
            type="error"
            showIcon
            closable
          />
        )}

        {/* Bộ lọc */}
        <Row justify="space-between">
          <RangePicker />
          <Select value={filter} onChange={setFilter} style={{ width: 160 }}>
            <Option value="day">Theo ngày</Option>
            <Option value="month">Theo tháng</Option>
            <Option value="year">Theo năm</Option>
          </Select>
        </Row>

        {/* Summary Cards */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Khách hàng mới"
                value={summary.newCustomers}
                prefix={<UserAddOutlined />}
                valueStyle={{ color: "green" }}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card>
              <Statistic
                title="Khách quay lại"
                value={summary.returningCustomers}
                prefix={<UserSwitchOutlined />}
                valueStyle={{ color: "blue" }}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={summary.total}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ giữ chân khách"
                value={summary.retentionRate}
                suffix="%"
                prefix={<StarOutlined />}
                valueStyle={{ color: "#f59e0b" }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Biểu đồ Trend */}
        <Card title="📈 Xu hướng khách hàng">
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="new"
                  stroke="#4ade80"
                  strokeWidth={3}
                  name="Khách mới"
                />
                <Line
                  type="monotone"
                  dataKey="returning"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  name="Khách quay lại"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Phân nhóm khách hàng */}
        <Card title="🎯 Phân nhóm khách hàng">
          <ul>
            {segmentationData.map((item, i) => (
              <li key={i} style={{ padding: 6, fontSize: 16 }}>
                <strong>{item.segment}</strong>: {item.value}
              </li>
            ))}
          </ul>
        </Card>

        {/* Top Customers */}
        <Card title="👑 Khách hàng giá trị cao nhất (Top 10)">
          <Table
            columns={columns}
            dataSource={topCustomers}
            rowKey="email"
            pagination={false}
          />
        </Card>
      </Space>
    </AdminPageLayout>
  );
}
