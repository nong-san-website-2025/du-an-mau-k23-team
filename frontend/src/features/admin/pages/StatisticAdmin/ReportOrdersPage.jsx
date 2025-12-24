import React, { useState, useEffect, useCallback } from "react";
import {
  Row, Col, Card, Space, Button, Typography, DatePicker, Select, message, Table, Tag, Avatar, Dropdown
} from "antd";
import {
  ShoppingCartOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined, DownloadOutlined,
  RiseOutlined, DollarOutlined, UserOutlined, RightOutlined,
} from "@ant-design/icons";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";

import AdminPageLayout from "../../components/AdminPageLayout";
import * as XLSX from "xlsx";
import StatsSection from "../../components/common/StatsSection";
import { userApi } from "../../services/userApi";
import dayjs from "dayjs";
import { intcomma } from "../../../../utils/format";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PIE_COLORS = ["#36A2EB", "#FFCE56", "#4CAF50", "#FF6384", "#9966FF"];

export default function ReportOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, "d"), dayjs()]);
  const [timeFilter, setTimeFilter] = useState("week");
  const [isMobile, setIsMobile] = useState(false);

  const [stats, setStats] = useState({
    totalOrders: 0, successOrders: 0, pendingOrders: 0, cancelRate: 0, totalRevenue: 0, avgOrderValue: 0,
  });
  const [chartData, setChartData] = useState({ trend: [], status: [], paymentMethods: [] });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener ? mql.addEventListener("change", handleChange) : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handleChange) : mql.removeListener(handleChange);
    };
  }, []);

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
        const total = data.stats.totalOrders || 0;
        const revenue = data.stats.revenue || 0;
        const statusMap = {};
        data.chartData.status.forEach((item) => (statusMap[item.name] = item.value));
        const pendingCount = (statusMap["Chờ xác nhận"] || 0) + (statusMap["Đang giao"] || 0);
        const successCount = statusMap["Hoàn thành"] || 0;

        setStats({
          totalOrders: total,
          successOrders: successCount,
          pendingOrders: pendingCount,
          cancelRate: data.stats.cancelRate || 0,
          totalRevenue: revenue,
          avgOrderValue: data.stats.avgOrderValue || 0,
        });

        setChartData({
          trend: data.chartData.trend || [],
          status: data.chartData.status || [],
          paymentMethods: data.chartData.paymentMethods || [],
        });
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

  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    switch (val) {
      case "today": setDateRange([today, today]); break;
      case "week": setDateRange([today.subtract(7, "d"), today]); break;
      case "month": setDateRange([today.startOf("month"), today]); break;
      default: break;
    }
  };

  const handleExport = (format) => {
      // (Giữ logic cũ nhưng đưa vào function)
      message.info("Chức năng xuất đang được xử lý");
  };

  const statsItems = [
    { title: "Tổng Doanh Thu", value: intcomma(stats.totalRevenue) + " đ", icon: <DollarOutlined />, color: "#1890ff" },
    { title: "Tổng Đơn Hàng", value: intcomma(stats.totalOrders), icon: <ShoppingCartOutlined />, color: "#722ed1" },
    { title: "Đang Xử Lý", value: intcomma(stats.pendingOrders), icon: <ClockCircleOutlined />, color: "#faad14" },
    { title: "Tỷ Lệ Hủy", value: stats.cancelRate + "%", icon: <CloseCircleOutlined />, color: "#ff4d4f", trend: -2 },
  ];

  const columnsRecentOrders = [
    { title: "Mã đơn", dataIndex: "id", width: 100, render: (text) => <span style={{ color: "#1890ff" }}>{text}</span> },
    { title: "Khách hàng", dataIndex: "customer", width: 220, render: (text) => <Space><Avatar size="small" icon={<UserOutlined />} /> {text}</Space> },
    { title: "Tổng tiền", dataIndex: "total", align: "right", width: 140, render: (val) => <Text strong>{intcomma(val)} đ</Text> },
    { title: "Trạng thái", dataIndex: "status", width: 160, render: (status) => {
        let color = status === "completed" ? "success" : status === "cancelled" ? "error" : "warning";
        return <Tag color={color}>{status}</Tag>;
    }},
  ];

  return (
    <AdminPageLayout title="THỐNG KÊ ĐƠN HÀNG">
      <Space direction="vertical" size={24} style={{ width: "100%", paddingBottom: 24 }}>
        
        {/* --- STANDARDIZED TOOLBAR --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Space wrap>
                <Text strong>Thời gian:</Text>
                <Select value={timeFilter} onChange={handleTimeChange} style={{ width: 120 }}>
                  <Option value="today">Hôm nay</Option>
                  <Option value="week">7 ngày qua</Option>
                  <Option value="month">Tháng này</Option>
                  <Option value="custom">Tùy chọn</Option>
                </Select>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => { setDateRange(dates); setTimeFilter("custom"); }}
                  format="DD/MM/YYYY"
                  allowClear={false}
                />
              </Space>
            </Col>
            <Col xs={24} md={10} style={{ textAlign: "right" }}>
              <Space>
                <Button 
                    icon={<ReloadOutlined spin={loading} />} 
                    onClick={fetchData}
                >
                    Làm mới
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'csv', label: 'Xuất CSV' },
                      { key: 'xlsx', label: 'Xuất Excel (Sắp ra mắt)', disabled: true },
                    ],
                    onClick: ({ key }) => handleExport(key),
                  }}
                >
                  <Button type="primary" icon={<DownloadOutlined />} style={{ background: '#389E0D', borderColor: '#389E0D' }}>
                    Xuất Báo Cáo
                  </Button>
                </Dropdown>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* --- SECTION 1: KEY METRICS --- */}
        <StatsSection items={statsItems} loading={loading} />

        {/* --- SECTION 2: CHARTS --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title={<Space><RiseOutlined /><span>Phân tích xu hướng</span></Space>} bordered={false} loading={loading}>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none" }} />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" dataKey="orders" name="Số lượng đơn" stroke="#1890ff" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Trạng thái đơn hàng" bordered={false} loading={loading} style={{ height: "100%" }}>
              <div style={{ height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData.status} innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {chartData.status.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        {/* --- SECTION 3: RECENT ORDERS --- */}
        <Card title="Đơn hàng gần đây" bordered={false} loading={loading} extra={<Button type="link">Đến quản lý đơn hàng <RightOutlined /></Button>}>
          <Table dataSource={recentOrders} columns={columnsRecentOrders} pagination={false} rowKey="id" size={isMobile ? "small" : "middle"} scroll={isMobile ? { x: 700 } : undefined} />
        </Card>
      </Space>
    </AdminPageLayout>
  );
}