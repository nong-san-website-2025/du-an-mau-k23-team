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
  Tag, // Thêm Tag để làm nổi bật trạng thái
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
  LineChartOutlined, // Icon phù hợp hơn cho biểu đồ đường
} from "@ant-design/icons";
import dayjs from "dayjs";
import vi from 'dayjs/locale/vi'; // Import locale Việt Nam cho dayjs
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
import { intcomma } from "../../../../utils/format";

dayjs.locale(vi); // Thiết lập ngôn ngữ Việt Nam
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Helper: định dạng ngày biểu đồ (Giữ nguyên)
const formatDate = (dateStr) => dayjs(dateStr).format("DD/MM");

// Thời gian mặc định
const endOfToday = dayjs().endOf("day"); // Đảm bảo lấy cuối ngày
const startDaysAgo = (days) => dayjs().subtract(days - 1, "day").startOf("day"); // Đảm bảo lấy đầu ngày

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
    conversion_rate: 0, // Đã bị loại bỏ vì tính lại bên dưới
  });
  const [loading, setLoading] = useState(false);
  const [quickRange, setQuickRange] = useState("30d");
  const applyTimeoutRef = useRef(null);

  // === FETCH DATA === (Giữ nguyên)
  const fetchReport = useCallback(async (from, to) => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/admin/revenue-report/`, {
        params: {
          // Gửi ngày với format chính xác
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
    // UX: Dùng setTimeout để tránh gọi API liên tục khi RangePicker thay đổi
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      fetchReport(dateRange[0], dateRange[1]);
    }, 300);
  }, [dateRange, fetchReport]);

  const onQuickRangeChange = (val) => {
    setQuickRange(val);
    const to = dayjs().endOf("day");
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
        from = dayjs().startOf("year").startOf("day"); // Lấy từ đầu năm
        break;
      case "custom":
        // Khi chọn "Tùy chỉnh", không tự động gọi API, chờ người dùng chọn xong và nhấn Áp dụng
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
    // Gọi fetchReport ngay lập tức sau khi reset
    fetchReport(newRange[0], newRange[1]);
    message.success("Bộ lọc đã được đặt lại về 30 ngày gần nhất");
  };

  // === EXPORT FUNCTIONS ===
  const exportToCSV = () => {
    // ... (Giữ nguyên logic CSV, nhưng dùng Blob chuẩn hơn)
    if (!stats.daily_revenue?.length) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }

    // Thêm Byte Order Mark (BOM) để đảm bảo hiển thị tiếng Việt có dấu trong Excel/Sheets
    const BOM = "\uFEFF";
    const csvData = stats.daily_revenue.map(item => ({
      'Ngày': item.date,
      'Doanh thu tổng': item.revenue || 0,
      'Doanh thu sàn': item.platform_revenue || 0,
    }));

    const csvContent = [
      Object.keys(csvData[0]).map(header => `"${header}"`).join(','),
      ...csvData.map(row =>
        Object.values(row).map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-doanh-thu-${dateRange[0].format('YYYY-MM-DD')}-${dateRange[1].format('YYYY-MM-DD')}.csv`;
    link.click();
    message.success("Đã xuất file CSV thành công");
  };

  const exportToExcel = () => {
    message.info("Tính năng xuất Excel (.xlsx) đang được phát triển");
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
      label: 'Xuất Excel (Sắp ra mắt)',
      onClick: exportToExcel,
      disabled: true, // Tắt tính năng đang phát triển
    },
  ];

  // === EFFECTS === (Giữ nguyên)
  useEffect(() => {
    fetchReport(dateRange[0], dateRange[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Chỉ tự động gọi applyFilter khi người dùng chọn QuickRange (không phải Custom)
    if (quickRange !== "custom" && dateRange.every(d => d)) {
      applyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);


  // === TÍNH TOÁN CÁC CHỈ SỐ KPI ĐỘNG ===
  const revenueChangePercent = stats.prev_total_revenue
    ? ((stats.total_revenue - stats.prev_total_revenue) /
      Math.abs(stats.prev_total_revenue)) * // Sử dụng Math.abs để tránh chia cho 0 hoặc giá trị âm nếu có lỗi data
    100
    : stats.total_revenue > 0 ? 100 : 0; // Nếu kỳ trước bằng 0, tăng 100% (hoặc 0 nếu kỳ này cũng bằng 0)

  const totalOrders = stats.success_orders_count + stats.cancelled_orders_count + stats.pending_orders_count;
  const conversionRate =
    totalOrders > 0
      ? ((stats.success_orders_count / totalOrders) * 100)
      : 0;

  const getConversionTag = (rate) => {
    if (rate >= 50) return { color: "success", text: "Tuyệt vời" };
    if (rate >= 20) return { color: "processing", text: "Tốt" };
    return { color: "error", text: "Cần cải thiện" };
  };

  // === BIỂU ĐỒ === (Tối ưu hóa UX của Tooltip)
  const CustomReTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card size="small" className="shadow-lg border-none">
          <Text strong className="block mb-1">
            Ngày: {label}
          </Text>
          {payload.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span style={{ color: item.stroke }}>{item.name}:</span>
              <Text strong style={{ color: item.stroke }} className="ml-4">
                {intcomma(item.value)}
              </Text>
            </div>
          ))}
        </Card>
      );
    }
    return null;
  };

  const RevenueChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart
        data={
          data?.length
            ? data.map((d) => ({ ...d, date: formatDate(d.date) }))
            : []
        }
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          {/* Tối ưu màu gradient (màu xanh dương đậm hơn) */}
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
          </linearGradient>
          {/* Tối ưu màu gradient (màu tím/magenta đậm hơn) */}
          <linearGradient id="platformGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c026d3" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#c026d3" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3" // Dùng dash array tinh tế hơn
          stroke="#e0e0e0"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#666" }}
          tickLine={false} // Loại bỏ tick line
          axisLine={{ stroke: "#e0e0e0" }} // Thêm axis line nhẹ
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`; // B cho Tỷ (Billion)
            if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`; // M cho Triệu (Million)
            if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
            return v;
          }}
          tick={{ fontSize: 12, fill: "#666" }}
          tickLine={false}
          axisLine={false}
          domain={[0, "auto"]}
        />
        {/* Sử dụng CustomReTooltip */}
        <ReTooltip content={<CustomReTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 6, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }}
          name="Tổng doanh thu"
        />
        <Area
          type="monotone"
          dataKey="platform_revenue"
          stroke="#c026d3"
          strokeWidth={2}
          fill="url(#platformGradient)"
          dot={false}
          activeDot={{ r: 6, fill: "#fff", stroke: "#c026d3", strokeWidth: 2 }}
          name="Doanh thu sàn"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // === CARD METRIC CHUẨN PRO (Tối ưu hóa: dùng Statistic của Ant Design cho các chỉ số chính) ===
  const MetricCard = ({ title, value, icon, color, trend, suffix }) => {
    const trendText = Math.abs(trend).toFixed(1);
    const TrendIcon = trend > 0 ? ArrowUpOutlined : ArrowDownOutlined;
    const trendColor = trend > 0 ? "#52c41a" : trend < 0 ? "#ff4d4f" : "#666";

    return (
      <Card
        size="small"
        bordered={false} // Loại bỏ border để hiện đại hơn
        className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-lg"
      >
        <Statistic
          title={
            <Space size={6}>
              <span className="text-sm font-medium text-gray-500">{title}</span>
              {React.cloneElement(icon, { style: { color: color } })}
            </Space>
          }
          value={value}
          suffix={suffix}
          valueStyle={{ fontSize: "24px", fontWeight: "600", color: "#1f2937" }}
        />
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <TrendIcon style={{ color: trendColor, fontSize: "14px" }} />
            <Text
              style={{ color: trendColor, fontSize: "12px" }}
              className="font-medium"
            >
              {trendText}% so với kỳ trước
            </Text>
          </div>
        )}
      </Card>
    );
  };

  // === TÍNH TOÁN THÔNG SỐ PHỤ ===
  const maxRevenueDay = stats.daily_revenue?.length > 0
    ? stats.daily_revenue.reduce((max, day) =>
      (day.revenue || 0) > (max.revenue || 0) ? day : max
    )
    : null;

  const avgDailyRevenue = stats.daily_revenue?.length > 0
    ? stats.total_revenue / stats.daily_revenue.length
    : 0;

  const conversionTag = getConversionTag(conversionRate);


  // === RENDER COMPONENT ===
  return (
    <AdminPageLayout
      title=

      "THỐNG KÊ DOANH THU"


      extra={
        <Space>
          <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
            <Button
              icon={<DownloadOutlined />}
              className="shadow-sm hover:shadow-md rounded-md"
            >
              Xuất dữ liệu
            </Button>
          </Dropdown>
          <Tooltip title="Làm mới dữ liệu">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchReport(dateRange[0], dateRange[1])}
              shape="circle"
              className="shadow-sm hover:shadow-md"
              loading={loading} // Thêm loading cho nút Reload
            />
          </Tooltip>
        </Space>
      }
    >
      {/* Bộ lọc */}
      <Card className="mb-6 rounded-lg shadow-sm" bodyStyle={{ padding: "16px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={18}>
            <Space wrap size={16}>
              {/* Segmented Control nổi bật hơn */}
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
                className="rounded-lg bg-gray-50 p-1"
              />
              {/* RangePicker trực quan hơn */}
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setQuickRange("custom");
                  setDateRange(dates || []);
                }}
                format="DD/MM/YYYY"
                allowClear={false}
                style={{ width: 260 }}
                popupStyle={{ zIndex: 1100 }}
              />
            </Space>
          </Col>
          <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={resetFilter} className="rounded-md">
                Đặt lại
              </Button>
              <Button
                type="primary"
                onClick={applyFilter}
                className="rounded-md"
                disabled={quickRange !== "custom" || loading} // Chỉ cho phép áp dụng khi ở Custom và không loading
              >
                {quickRange === "custom" ? "Áp dụng" : "Đã chọn"}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tổng quan KPI */}
      <Skeleton active loading={loading} paragraph={{ rows: 0 }}>
        <Row gutter={[24, 24]}>
          {/* Tổng doanh thu */}
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Tổng doanh thu"
              value={intcomma(stats.total_revenue)}
              icon={<WalletOutlined />}
              color="#2563eb"
              trend={revenueChangePercent}
            />
          </Col>

          {/* Doanh thu sàn (Commission) */}
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Doanh thu sàn"
              value={intcomma(stats.platform_revenue)}
              icon={<DollarCircleOutlined />}
              color="#c026d3"
            // Không hiển thị trend nếu không có prev_platform_revenue
            />
          </Col>

          {/* Đơn hoàn tất */}
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Đơn hoàn tất"
              value={stats.success_orders_count}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
            />
          </Col>

          {/* Đơn đang xử lý */}
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Đang xử lý / Hủy"
              value={stats.pending_orders_count + stats.cancelled_orders_count}
              icon={<ClockCircleOutlined />}
              color="#faad14"
            />
          </Col>
        </Row>
      </Skeleton>

      {/* Biểu đồ doanh thu */}
      <Card
        className="mt-6 rounded-lg shadow-sm"
        title={
          <Space size={8}>
            <LineChartOutlined className="text-blue-600" />
            <Text strong className="text-base">
              Xu hướng doanh thu
            </Text>
            <Tag color="blue" className="ml-2">
              {dayjs(dateRange[0]).format('DD/MM/YYYY')} - {dayjs(dateRange[1]).format('DD/MM/YYYY')}
            </Tag>
          </Space>
        }
        loading={loading}
      >
        {stats.daily_revenue?.length > 0 ? (
          <RevenueChart data={stats.daily_revenue} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            Không có dữ liệu trong khoảng thời gian đã chọn.
          </div>
        )}
      </Card>


      {/* Thống kê tổng quan */}
      <Row gutter={[24, 24]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined className="text-green-600" />
                <Text strong className="text-base">Phân tích hiệu suất</Text>
              </Space>
            }
            className="rounded-lg shadow-sm"
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Tổng doanh thu kỳ này"
                  value={intcomma(stats.total_revenue)}
                  valueStyle={{ color: '#2563eb', fontSize: '22px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Doanh thu kỳ trước"
                  value={intcomma(stats.prev_total_revenue)}
                  valueStyle={{ color: '#4b5563', fontSize: '22px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Doanh thu trung bình/ngày"
                  value={intcomma(avgDailyRevenue)}
                  valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Ngày doanh thu cao nhất"
                  value={maxRevenueDay ? dayjs(maxRevenueDay.date).format('DD/MM/YYYY') : 'N/A'}
                  suffix={maxRevenueDay ? `(${intcomma(maxRevenueDay.revenue)})` : ''}
                  valueStyle={{ color: '#ff4d4f', fontSize: '18px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ShoppingOutlined className="text-purple-600" />
                <Text strong className="text-base">Chỉ số đơn hàng</Text>
              </Space>
            }
            className="rounded-lg shadow-sm"
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Tổng đơn hàng"
                  value={totalOrders}
                  valueStyle={{ color: '#3f8600', fontSize: '22px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Đơn thành công"
                  value={stats.success_orders_count}
                  valueStyle={{ color: '#52c41a', fontSize: '22px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Đơn bị hủy"
                  value={stats.cancelled_orders_count}
                  valueStyle={{ color: '#ff4d4f', fontSize: '18px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      Tỷ lệ chuyển đổi
                      <Tag color={conversionTag.color} className="font-semibold">
                        {conversionTag.text}
                      </Tag>
                    </Space>
                  }
                  value={`${conversionRate.toFixed(1)}%`}
                  valueStyle={{ color: '#722ed1', fontSize: '18px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Chi tiết dữ liệu */}
      <Card
        className="mt-6 rounded-lg shadow-sm"
        title={
          <Space>
            <CalendarOutlined className="text-gray-600" />
            <Text strong>Chi tiết doanh thu theo ngày</Text>
          </Space>
        }
        extra={
          <Text type="secondary">
            Khoảng thời gian: {dayjs(dateRange[0]).format('DD/MM')} - {dayjs(dateRange[1]).format('DD/MM/YYYY')}
          </Text>
        }
      >
        <Table
          dataSource={stats.daily_revenue?.map((item, index) => ({
            key: index,
            date: item.date, // Giữ nguyên để dễ sort và format
            revenue: item.revenue || 0,
            platform_revenue: item.platform_revenue || 0,
          })) || []}
          columns={[
            {
              title: 'Ngày',
              dataIndex: 'date',
              key: 'date',
              width: 150,
              render: (value) => {
                const day = dayjs(value);
                // Hiển thị ngày và thứ trong tuần rõ ràng hơn
                return (
                  <Space direction="vertical" size={0}>
                    <Text strong>{day.format('DD/MM/YYYY')}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ({day.format('dddd')})
                    </Text>
                  </Space>
                );
              },
              sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
            },
            {
              title: 'Doanh thu tổng',
              dataIndex: 'revenue',
              key: 'revenue',
              align: 'right', // Căn phải cho số
              render: (value) => (
                <Text strong style={{ color: '#2563eb' }}>
                  {intcomma(value)}
                </Text>
              ),
              sorter: (a, b) => a.revenue - b.revenue,
            },
            {
              title: 'Doanh thu sàn (Commission)',
              dataIndex: 'platform_revenue',
              key: 'platform_revenue',
              align: 'right',
              render: (value) => (
                <Text style={{ color: '#c026d3' }}>
                  {intcomma(value)}
                </Text>
              ),
              sorter: (a, b) => a.platform_revenue - b.platform_revenue,
            },
            {
              title: 'Tỷ lệ hoa hồng',
              key: 'commission_rate',
              width: 150,
              render: (_, record) => {
                const rate = record.revenue > 0 ? (record.platform_revenue / record.revenue * 100) : 0;
                const percent = parseFloat(rate.toFixed(1));
                return (
                  <Tooltip title={`${percent}% hoa hồng`}>
                    <Progress
                      percent={percent}
                      size="small"
                      strokeColor="#c026d3"
                      format={(p) => `${p}%`}
                    />
                  </Tooltip>
                );
              },
              sorter: (a, b) => {
                const rateA = a.revenue > 0 ? (a.platform_revenue / a.revenue) : 0;
                const rateB = b.revenue > 0 ? (b.platform_revenue / b.revenue) : 0;
                return rateA - rateB;
              },
            },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            // Thêm total vào cuối bảng
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} ngày`,
          }}
          loading={loading}
          scroll={{ x: 700 }} // Đảm bảo responsive trên màn hình nhỏ
          locale={{ emptyText: 'Không có dữ liệu chi tiết trong khoảng thời gian này' }}
          size="small"
        />
      </Card>
    </AdminPageLayout>
  );
}