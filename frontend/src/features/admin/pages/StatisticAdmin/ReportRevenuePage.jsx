import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  DatePicker,
  Space,
  Row,
  Col,
  Button,
  message,
  Typography,
  Skeleton,
  Segmented,
  Tooltip,
  Dropdown,
  Table,
  Progress,
  Statistic,
} from "antd";
import {
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PercentageOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  ShoppingOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../../login_register/services/api";
import AdminPageLayout from "../../components/AdminPageLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Helper: định dạng tiền VNĐ
const formatCurrency = (value) =>
  value == null
    ? "0 ₫"
    : value?.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " ₫";

// Helper: định dạng ngày biểu đồ
const formatDate = (dateStr) => dayjs(dateStr).format("DD/MM");

// Thời gian mặc định
const endOfToday = dayjs();
const startDaysAgo = (days) => dayjs().subtract(days - 1, "day");

export default function ReportRevenuePage() {
  const [dateRange, setDateRange] = useState([startDaysAgo(30), endOfToday]);
  const [stats, setStats] = useState({
    total_revenue: 0,
    platform_revenue: 0, // Doanh thu sàn (commission)
    success_orders_count: 0,
    pending_orders_count: 0,
    cancelled_orders_count: 0,
    daily_revenue: [],
    prev_total_revenue: 0,
    conversion_rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [quickRange, setQuickRange] = useState("30d");
  const applyTimeoutRef = useRef(null);

  // === FETCH DATA ===
  const fetchReport = useCallback(async (from, to) => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/admin/revenue-report/`, {
        params: {
          start_date: from.format("YYYY-MM-DD"),
          end_date: to.format("YYYY-MM-DD"),
        },
      });
      setStats(res.data || {});
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  }, []);

  // === FILTER HANDLERS ===
  const applyFilter = useCallback(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return message.warn("Vui lòng chọn khoảng thời gian hợp lệ");
    }
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      fetchReport(dateRange[0], dateRange[1]);
    }, 300);
  }, [dateRange, fetchReport]);

  const onQuickRangeChange = (val) => {
    setQuickRange(val);
    const to = endOfToday;
    let from;
    switch (val) {
      case "7d":
        from = startDaysAgo(7);
        break;
      case "30d":
        from = startDaysAgo(30);
        break;
      case "90d":
        from = startDaysAgo(90);
        break;
      case "ytd":
        from = dayjs().startOf("year");
        break;
      case "custom":
        return;
      default:
        return;
    }
    setDateRange([from, to]);
  };

  const resetFilter = () => {
    setQuickRange("30d");
    const newRange = [startDaysAgo(30), endOfToday];
    setDateRange(newRange);
    fetchReport(newRange[0], newRange[1]);
    message.success("Bộ lọc đã được đặt lại");
  };

  // === EXPORT FUNCTIONS ===
  const exportToCSV = () => {
    if (!stats.daily_revenue?.length) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }

    const csvData = stats.daily_revenue.map(item => ({
      'Ngày': item.date,
      'Doanh thu tổng': item.revenue || 0,
      'Doanh thu sàn': item.platform_revenue || 0,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-doanh-thu-${dateRange[0].format('YYYY-MM-DD')}-${dateRange[1].format('YYYY-MM-DD')}.csv`;
    link.click();
    message.success("Đã xuất file CSV thành công");
  };

  const exportToExcel = () => {
    message.info("Tính năng xuất Excel đang được phát triển");
  };

  const exportMenu = [
    {
      key: 'csv',
      icon: <FileExcelOutlined />,
      label: 'Xuất CSV',
      onClick: exportToCSV,
    },
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Xuất Excel',
      onClick: exportToExcel,
    },
  ];

  // === EFFECTS ===
  useEffect(() => {
    fetchReport(dateRange[0], dateRange[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quickRange !== "custom") {
      applyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // === TÍNH TOÁN TĂNG TRƯỞNG ===
  const revenueChangePercent = stats.prev_total_revenue
    ? ((stats.total_revenue - stats.prev_total_revenue) /
        stats.prev_total_revenue) *
      100
    : 0;

  const totalOrders = stats.success_orders_count + stats.cancelled_orders_count;
  const conversionRate =
    totalOrders > 0
      ? ((stats.success_orders_count / totalOrders) * 100).toFixed(1)
      : 0;

  // === BIỂU ĐỒ ===
  const RevenueChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart
        data={
          data?.length
            ? data.map((d) => ({ ...d, date: formatDate(d.date) }))
            : []
        }
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="platformGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#722ed1" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#722ed1" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="#f0f0f0"
          vertical={false}
        />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#666" }} />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
            if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
            return v;
          }}
          tick={{ fontSize: 12, fill: "#666" }}
          domain={[0, "auto"]}
        />
        <ReTooltip
          formatter={(value) => [formatCurrency(value)]}
          labelFormatter={(label) => `Ngày: ${label}`}
          contentStyle={{
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0ea5e9"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "#0ea5e9" }}
          name="Tổng doanh thu"
        />
        <Area
          type="monotone"
          dataKey="platform_revenue"
          stroke="#722ed1"
          strokeWidth={2}
          fill="url(#platformGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "#722ed1" }}
          name="Doanh thu sàn"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // === CARD METRIC CHUẨN PRO ===
  const MetricCard = ({ title, value, icon, color, trend, suffix }) => (
    <Card
      size="small"
      bodyStyle={{ padding: "16px" }}
      className="hover:shadow-md transition-shadow duration-200"
    >
      <Space direction="vertical" size={4}>
        <div className="flex items-center gap-2">
          <Text type="secondary" className="text-sm">
            {title}
          </Text>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <Text strong style={{ fontSize: "20px", color: "#1f2937" }}>
            {value}
          </Text>
          {suffix && <Text type="secondary">{suffix}</Text>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <ArrowUpOutlined style={{ color: "#52c41a", fontSize: "12px" }} />
            ) : (
              <ArrowDownOutlined
                style={{ color: "#ff4d4f", fontSize: "12px" }}
              />
            )}
            <Text type={trend >= 0 ? "success" : "danger"} className="text-xs">
              {Math.abs(trend).toFixed(1)}% so với kỳ trước
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );

  return (
    <AdminPageLayout
      title={
        <Space size={12}>
          <DollarCircleOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} />
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            BÁO CÁO DOANH THU
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
            <Button
              icon={<DownloadOutlined />}
              className="shadow hover:shadow-md"
            >
              Xuất dữ liệu
            </Button>
          </Dropdown>
          <Tooltip title="Làm mới dữ liệu">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchReport(dateRange[0], dateRange[1])}
              shape="circle"
              className="shadow hover:shadow-md"
            />
          </Tooltip>
        </Space>
      }
    >
      {/* Bộ lọc */}
      <Card className="mb-6 rounded-lg" bodyStyle={{ padding: "16px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Segmented
                value={quickRange}
                onChange={onQuickRangeChange}
                options={[
                  { label: "7 ngày", value: "7d" },
                  { label: "30 ngày", value: "30d" },
                  { label: "90 ngày", value: "90d" },
                  { label: "Năm nay", value: "ytd" },
                  { label: "Tùy chỉnh", value: "custom" },
                ]}
                className="rounded-md"
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setQuickRange("custom");
                  setDateRange(dates || []);
                }}
                format="DD/MM/YYYY"
                allowClear={false}
                style={{ width: 240 }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button onClick={resetFilter} className="rounded-md">
                Đặt lại
              </Button>
              <Button
                type="primary"
                onClick={applyFilter}
                className="rounded-md"
              >
                Áp dụng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tổng quan KPI */}
      <Skeleton active loading={loading} paragraph={{ rows: 0 }}>
        <Row gutter={[16, 16]}>
          {/* Tổng doanh thu */}
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Tổng doanh thu"
              value={formatCurrency(stats.total_revenue)}
              icon={<WalletOutlined style={{ color: "#0ea5e9" }} />}
              trend={revenueChangePercent}
            />
          </Col>

          {/* Doanh thu sàn (Commission) */}
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Doanh thu sàn"
              value={formatCurrency(stats.platform_revenue)}
              icon={<WalletOutlined style={{ color: "#722ed1" }} />}
              suffix="hoa hồng"
            />
          </Col>

          {/* Đơn hoàn tất */}
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Đơn hoàn tất"
              value={stats.success_orders_count}
              icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            />
          </Col>

          {/* Đơn đang xử lý */}
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Đang xử lý"
              value={stats.pending_orders_count}
              icon={<ClockCircleOutlined style={{ color: "#faad14" }} />}
            />
          </Col>

          {/* Tỷ lệ chuyển đổi */}
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Tỷ lệ chuyển đổi"
              value={`${conversionRate}%`}
              icon={<PercentageOutlined style={{ color: "#722ed1" }} />}
              suffix="đơn thành công"
            />
          </Col>
        </Row>
      </Skeleton>

      {/* Biểu đồ doanh thu */}
      <Card
        className="mt-6 rounded-lg"
        title={
          <Space size={8}>
            <BarChartOutlined className="text-sky-500" />
            <Text strong>Xu hướng doanh thu</Text>
          </Space>
        }
      >
        {loading ? (
          <div
            style={{ height: 360 }}
            className="flex items-center justify-center"
          >
            <Skeleton active paragraph={{ rows: 4, width: "100%" }} />
          </div>
        ) : stats.daily_revenue?.length > 0 ? (
          <RevenueChart data={stats.daily_revenue} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            Không có dữ liệu trong khoảng thời gian đã chọn.
          </div>
        )}
      </Card>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined />
                <Text strong>Phân tích hiệu suất</Text>
              </Space>
            }
            className="rounded-lg"
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Tổng doanh thu kỳ này</Text>
                <br />
                <Text strong style={{ fontSize: '24px', color: '#0ea5e9' }}>
                  {formatCurrency(stats.total_revenue)}
                </Text>
              </div>

              <div>
                <Text type="secondary">Doanh thu trung bình/ngày</Text>
                <br />
                <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                  {stats.daily_revenue?.length > 0
                    ? formatCurrency(stats.total_revenue / stats.daily_revenue.length)
                    : formatCurrency(0)
                  }
                </Text>
              </div>

              <div>
                <Text type="secondary">Ngày có doanh thu cao nhất</Text>
                <br />
                <Text strong>
                  {stats.daily_revenue?.length > 0
                    ? (() => {
                        const maxDay = stats.daily_revenue.reduce((max, day) =>
                          (day.revenue || 0) > (max.revenue || 0) ? day : max
                        );
                        return `${dayjs(maxDay.date).format('DD/MM/YYYY')} (${formatCurrency(maxDay.revenue)})`;
                      })()
                    : 'N/A'
                  }
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ShoppingOutlined />
                <Text strong>Chỉ số đơn hàng</Text>
              </Space>
            }
            className="rounded-lg"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Tổng đơn hàng"
                  value={stats.success_orders_count + stats.cancelled_orders_count}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Đơn thành công"
                  value={stats.success_orders_count}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Đơn đang xử lý"
                  value={stats.pending_orders_count}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tỷ lệ chuyển đổi"
                  value={`${conversionRate}%`}
                  prefix={<PercentageOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Chi tiết dữ liệu */}
      <Card className="mt-6 rounded-lg" title="Chi tiết doanh thu theo ngày">
        <Table
          dataSource={stats.daily_revenue?.map((item, index) => ({
            key: index,
            date: dayjs(item.date).format('DD/MM/YYYY'),
            revenue: item.revenue || 0,
            platform_revenue: item.platform_revenue || 0,
            day: dayjs(item.date).format('dddd'),
          })) || []}
          columns={[
            {
              title: 'Ngày',
              dataIndex: 'date',
              key: 'date',
              render: (text, record) => (
                <Space>
                  <CalendarOutlined />
                  <span>{text}</span>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ({record.day})
                  </Text>
                </Space>
              ),
            },
            {
              title: 'Doanh thu tổng',
              dataIndex: 'revenue',
              key: 'revenue',
              render: (value) => (
                <Text strong style={{ color: '#0ea5e9' }}>
                  {formatCurrency(value)}
                </Text>
              ),
              sorter: (a, b) => a.revenue - b.revenue,
            },
            {
              title: 'Doanh thu sàn',
              dataIndex: 'platform_revenue',
              key: 'platform_revenue',
              render: (value) => (
                <Text style={{ color: '#722ed1' }}>
                  {formatCurrency(value)}
                </Text>
              ),
              sorter: (a, b) => a.platform_revenue - b.platform_revenue,
            },
            {
              title: 'Tỷ lệ hoa hồng',
              key: 'commission_rate',
              render: (_, record) => {
                const rate = record.revenue > 0 ? (record.platform_revenue / record.revenue * 100) : 0;
                return (
                  <Progress
                    percent={rate.toFixed(1)}
                    size="small"
                    strokeColor="#722ed1"
                    format={(percent) => `${percent}%`}
                  />
                );
              },
            },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} ngày`,
          }}
          loading={loading}
          scroll={{ x: 600 }}
        />
      </Card>
    </AdminPageLayout>
  );
}
