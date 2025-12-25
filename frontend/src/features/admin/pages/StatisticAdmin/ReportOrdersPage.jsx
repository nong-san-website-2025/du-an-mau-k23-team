// src/features/admin/pages/reports/ReportOrdersPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Typography,
  DatePicker,
  Select,
  message,
  Table,
  Tag,
  Avatar,
} from "antd";
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  RiseOutlined,
  DollarOutlined,
  UserOutlined,
  RightOutlined,
} from "@ant-design/icons";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection"; // Đảm bảo đường dẫn đúng tới file StatsSection của bạn
import { userApi } from "../../services/userApi";
import dayjs from "dayjs";
import { intcomma } from "../../../../utils/format";
import "../../styles/ReportOrdersPage.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// --- CONFIG ---
const PIE_COLORS = ["#36A2EB", "#FFCE56", "#4CAF50", "#FF6384", "#9966FF"];

export default function ReportOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, "d"),
    dayjs(),
  ]);
  const [timeFilter, setTimeFilter] = useState("week");
  const [isMobile, setIsMobile] = useState(false);

  // State tổng hợp
  const [stats, setStats] = useState({
    totalOrders: 0,
    successOrders: 0,
    pendingOrders: 0,
    cancelRate: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  });

  const [chartData, setChartData] = useState({
    trend: [],
    status: [],
    paymentMethods: [],
  });

  const [recentOrders, setRecentOrders] = useState([]);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!dateRange || dateRange.length !== 2) return;

    setLoading(true);
    try {
      const params = {
        start_date: dateRange[0].format("YYYY-MM-DD"),
        end_date: dateRange[1].format("YYYY-MM-DD"),
      };

      const data = await userApi.getDashboardStats(params);

      if (data) {
        // --- 1. Xử lý Stats cơ bản ---
        const total = data.stats.totalOrders || 0;
        const revenue = data.stats.revenue || 0;

        const statusMap = {};
        data.chartData.status.forEach(
          (item) => (statusMap[item.name] = item.value)
        );

        const pendingCount =
          (statusMap["Chờ xác nhận"] || 0) + (statusMap["Đang giao"] || 0);
        const successCount = statusMap["Hoàn thành"] || 0;

        setStats({
          totalOrders: total,
          successOrders: successCount,
          pendingOrders: pendingCount,
          cancelRate: data.stats.cancelRate || 0,
          totalRevenue: revenue,
          avgOrderValue: data.stats.avgOrderValue || 0,
        });

        // --- 2. Chart Data ---
        setChartData({
          trend: data.chartData.trend || [],
          status: data.chartData.status || [],
          paymentMethods: data.chartData.paymentMethods || [],
        });

        // --- 4. Recent Orders ---
        setRecentOrders(data.recentOrders || []);
      }
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
      message.error("Không thể tải dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Detect mobile viewport (iPhone 14 Pro Max ~430px width)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener
      ? mql.addEventListener("change", handleChange)
      : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener("change", handleChange)
        : mql.removeListener(handleChange);
    };
  }, []);

  // --- HELPER RENDER ---
  const renderStatusTag = (status) => {
    let color = "default";
    let label = "Không rõ";
    switch (status) {
      case "completed":
        color = "success";
        label = "Hoàn thành";
        break;
      case "shipping":
        color = "processing";
        label = "Đang giao";
        break;
      case "pending":
        color = "warning";
        label = "Chờ xử lý";
        break;
      case "cancelled":
        color = "error";
        label = "Đã hủy";
        break;
      default:
        break;
    }
    return <Tag color={color}>{label}</Tag>;
  };

  const columnsRecentOrders = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: isMobile ? 80 : 100,
      render: (text) => (
        <span style={{ cursor: "pointer", color: "#1890ff" }}>{text}</span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      width: isMobile ? 160 : 220,
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />{" "}
          <span
            style={{
              display: "inline-block",
              maxWidth: isMobile ? 120 : 180,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {text}
          </span>
        </Space>
      ),
    },
    { title: "Ngày đặt", dataIndex: "date", width: isMobile ? 120 : 140, sorter: (a, b) => new Date(a.date) - new Date(b.date), },
    
    {
      title: "Tổng tiền",
      dataIndex: "total",
      width: isMobile ? 120 : 140,
      align: "right",
      sorter: (a, b) => a.total - b.total,
      render: (val) => <Text strong>{intcomma(val)} đ</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: isMobile ? 130 : 160,
      render: (status) => renderStatusTag(status),
    },
  ];

  // --- HANDLERS ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    switch (val) {
      case "today":
        setDateRange([today, today]);
        break;
      case "week":
        setDateRange([today.subtract(7, "d"), today]);
        break;
      case "month":
        setDateRange([today.startOf("month"), today]);
        break;
      default:
        break;
    }
  };

  // --- PREPARE DATA FOR STATS SECTION ---
  // Chuyển đổi state stats thành mảng items cho StatsSection
  const statsItems = [
    {
      title: "Tổng Doanh Thu",
      value: intcomma(stats.totalRevenue) + " đ",
      icon: <DollarOutlined />,
      color: "#1890ff",
    },
    {
      title: "Tổng Đơn Hàng",
      value: intcomma(stats.totalOrders),
      icon: <ShoppingCartOutlined />,
      color: "#722ed1",
    },
    {
      title: "Đang Xử Lý",
      value: intcomma(stats.pendingOrders),
      icon: <ClockCircleOutlined />,
      color: "#faad14",
    },
    {
      title: "Tỷ Lệ Hủy",
      value: stats.cancelRate + "%",
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f",
      trend: -2,
    },
  ];

  return (
    <AdminPageLayout
      title="THỐNG KÊ ĐƠN HÀNG"
      extra={
        <Space wrap>
          <Select
            value={timeFilter}
            onChange={handleTimeChange}
            style={{ width: 120 }}
          >
            <Option value="today">Hôm nay</Option>
            <Option value="week">7 ngày qua</Option>
            <Option value="month">Tháng này</Option>
            <Option value="custom">Tùy chọn</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates);
              setTimeFilter("custom");
            }}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          />
          <Button icon={<DownloadOutlined />} className="btn-export">
            Xuất Báo Cáo
          </Button>
        </Space>
      }
    >
      <Space
        direction="vertical"
        size={24}
        style={{ width: "100%", paddingBottom: 24 }}
      >
        {/* --- SECTION 1: KEY METRICS (REPLACED WITH STATS SECTION) --- */}
        <StatsSection items={statsItems} loading={loading} />

        {/* --- SECTION 2: CHARTS MAIN --- */}
        <Row gutter={[24, 24]}>
          {/* Chart 1: Xu hướng đơn hàng & Doanh thu */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <RiseOutlined />
                  <span>Phân tích xu hướng</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
              loading={loading}
            >
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.trend}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorOrders"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1890ff"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1890ff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.2}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      name="Số lượng đơn"
                      stroke="#1890ff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Chart 2: Trạng thái đơn hàng */}
          <Col xs={24} lg={8}>
            <Card
              title="Trạng thái đơn hàng"
              bordered={false}
              className="shadow-sm"
              loading={loading}
              style={{ height: "100%" }}
            >
              <div style={{ height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData.status}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.status.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        {/* --- SECTION 3: RECENT ORDERS --- */}
        <Row>
          <Col span={24}>
            <Card
              title="Đơn hàng gần đây"
              bordered={false}
              className="shadow-sm"
              loading={loading}
              extra={
                <Button type="link">
                  Đến quản lý đơn hàng <RightOutlined />
                </Button>
              }
            >
              <Table
                dataSource={recentOrders}
                columns={columnsRecentOrders}
                pagination={false}
                rowKey="id"
                size={isMobile ? "small" : "middle"}
                tableLayout="fixed"
                scroll={isMobile ? { x: 700 } : undefined}
                style={isMobile ? { whiteSpace: "nowrap" } : undefined}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </AdminPageLayout>
  );
}
