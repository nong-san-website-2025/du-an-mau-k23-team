import React, { useState, useEffect } from "react";
import { Card, Tabs, Row, Col, Statistic, Table, Progress, Tag, Typography, Button, Space } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  ContainerOutlined,
  EyeOutlined,
  PercentageOutlined,
  GiftOutlined,
  BulbOutlined,
  DashboardOutlined,
  RiseOutlined,
  AppstoreOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import AnalyticsBaseLayout from "../components/AnalyticsSeller/AnalyticsBaseLayout";

const { Title, Text } = Typography;

// --- Bảng màu chủ đề "Chợ Nông Sản" ---
const THEME_COLORS = {
  primary: '#2A9D8F',      // Xanh lá cây mòng két (màu chính)
  secondary: '#E9C46A',    // Vàng cam (màu phụ)
  accent: '#F4A261',       // Cam nhạt (màu nhấn)
  danger: '#E76F51',       // Cam đỏ (màu cảnh báo)
  background: '#F9F8F4',  // Màu nền be nhạt (giống giấy)
  text: '#264653'          // Màu chữ xanh đen
};

const PIE_COLORS = [THEME_COLORS.primary, THEME_COLORS.secondary, THEME_COLORS.accent, THEME_COLORS.danger, "#8884d8"];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("30days");
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const API_BASE = "http://localhost:8000/api/sellers";

  // ===================================================================
  // KHU VỰC LOGIC - KHÔNG THAY ĐỔI
  // ===================================================================
  useEffect(() => {
    fetchData();
  }, [activeTab, period, dateRange]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, activeTab, period, dateRange]);

  const fetchData = async (toggleLoading = true) => {
    if (toggleLoading) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No access token found");
        alert("Vui lòng đăng nhập lại");
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { period }
      };

      if (period === "custom" && dateRange) {
        config.params.start_date = dateRange[0].format("YYYY-MM-DD");
        config.params.end_date = dateRange[1].format("YYYY-MM-DD");
      }

      switch (activeTab) {
        case "overview":
          const overviewRes = await axios.get(`${API_BASE}/analytics/overview/`, config);
          setOverviewData(overviewRes.data);
          break;
        case "sales":
          const salesRes = await axios.get(`${API_BASE}/analytics/sales/`, config);
          setSalesData(salesRes.data);
          break;
        case "products":
          const productsRes = await axios.get(`${API_BASE}/analytics/products/`, config);
          setProductsData(productsRes.data);
          break;
        case "traffic":
          const trafficRes = await axios.get(`${API_BASE}/analytics/traffic/`, config);
          setTrafficData(trafficRes.data);
          break;
        default:
          break;
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
      console.error("Error response:", error.response?.data);
      alert(`Lỗi: ${error.response?.data?.detail || error.message}`);
    } finally {
      if (toggleLoading) {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(value);
  };
  // ===================================================================
  // KẾT THÚC KHU VỰC LOGIC
  // ===================================================================

    const renderThemedKPICard = (title, value, growth, icon, color) => {
        const isPositive = growth >= 0;
        return (
            <Card hoverable style={{ 
                borderRadius: '12px', 
                overflow: 'hidden', 
                height: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        width: 50,
                        height: 50,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                    }}>
                        {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>{title}</Text>
                        <Title level={4} style={{ margin: 0, color: THEME_COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {value}
                        </Title>
                        <Text style={{ fontSize: 14, color: isPositive ? "#52c41a" : "#ff4d4f", whiteSpace: 'nowrap' }}>
                            {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            {` ${Math.abs(growth).toFixed(1)}% so với kỳ trước`}
                        </Text>
                    </div>
                </div>
            </Card>
        );
    };

  const renderOverview = () => {
    if (loading) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>⏳ Đang tải dữ liệu...</div>
        </Card>
      );
    }

    if (!overviewData) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>
            ❌ Không có dữ liệu
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Button type="primary" onClick={() => fetchData()}>
                  Thử tải lại
                </Button>
                <Button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
                  {autoRefreshEnabled ? "Tắt tự động làm mới" : "Bật tự động làm mới"}
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      );
    }

    const { kpis, trend_chart, top_products, funnel } = overviewData;
    const funnelData = [
      { stage: "Lượt truy cập", value: funnel?.visits || 0 },
      { stage: "Lượt xem SP", value: funnel?.product_views || 0 },
      { stage: "Đơn hàng", value: funnel?.orders || 0 }
    ];

    return (
      <div>
        {/* KPI Cards - Responsive layout */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            {renderThemedKPICard("Doanh thu", formatCurrency(kpis.revenue.value), kpis.revenue.growth, <DollarOutlined />, THEME_COLORS.primary)}
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            {renderThemedKPICard("Đơn hàng", kpis.orders.value, kpis.orders.growth, <ContainerOutlined />, THEME_COLORS.accent)}
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            {renderThemedKPICard("Lượt truy cập", kpis.visits.value, kpis.visits.growth, <EyeOutlined />, THEME_COLORS.secondary)}
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            {renderThemedKPICard("Tỷ lệ chuyển đổi", `${kpis.conversion_rate.value}%`, kpis.conversion_rate.growth, <PercentageOutlined />, THEME_COLORS.danger)}
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={4}>
            {renderThemedKPICard("Giá trị đơn TB", formatCurrency(kpis.aov.value), kpis.aov.growth, <GiftOutlined />, THEME_COLORS.primary)}
          </Col>
        </Row>

        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <Card title={<Title level={5}>Xu Hướng Tăng Trưởng</Title>} style={{ borderRadius: '12px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend_chart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}Tr`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke={THEME_COLORS.primary} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Doanh thu" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <Card title={<Title level={5}>Nông Sản Bán Chạy Nhất</Title>} style={{ borderRadius: '12px', height: '100%' }}>
                <Table
                  dataSource={top_products}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: "Sản phẩm",
                      dataIndex: "name",
                      key: "name",
                      render: (text, record) => (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {record.image && (
                            <img
                              src={record.image}
                              alt={text}
                              style={{ width: 45, height: 45, marginRight: 12, objectFit: "cover", borderRadius: "8px" }}
                            />
                          )}
                          <span>{text}</span>
                        </div>
                      )
                    },
                    { title: "Đã bán", dataIndex: "units_sold", key: "units_sold" },
                    { title: "Doanh thu", dataIndex: "revenue", key: "revenue", render: (value) => formatCurrency(value) }
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={<Title level={5}>Phễu Bán Hàng</Title>} style={{ borderRadius: '12px', height: '100%' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" width={100} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Số lượng" barSize={35} radius={[0, 8, 8, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    );
  };

  // Các hàm renderSales, renderProducts, renderTraffic không thay đổi...
  const renderSales = () => {
    if (loading) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>⏳ Đang tải dữ liệu...</div>
        </Card>
      );
    }

    if (!salesData) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>
            ❌ Không có dữ liệu
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Button type="primary" onClick={() => fetchData()}>
                  Thử tải lại
                </Button>
                <Button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
                  {autoRefreshEnabled ? "Tắt tự động làm mới" : "Bật tự động làm mới"}
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      );
    }
    const { revenue_by_time, revenue_by_location, operational_metrics } = salesData;

    return (
      <div>
        <Card title={<Title level={5}>{period === "today" ? "Doanh thu theo giờ vàng" : "Doanh thu theo ngày"}</Title>} style={{ marginBottom: 24, borderRadius: '12px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue_by_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill={THEME_COLORS.primary} name="Doanh thu" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card title={<Title level={5}>Doanh thu theo vùng miền (Top 5)</Title>} style={{ borderRadius: '12px', height: '100%' }}>
              <Table dataSource={revenue_by_location?.slice(0, 5)} rowKey="province" pagination={false}
                columns={[
                  { title: "Tỉnh/Thành phố", dataIndex: "province", key: "province" },
                  { title: "Số đơn", dataIndex: "orders", key: "orders" },
                  { title: "Doanh thu", dataIndex: "revenue", key: "revenue", render: (value) => formatCurrency(value) }
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title={<Title level={5}>Chỉ Số Vận Hành</Title>} style={{ borderRadius: '12px', height: '100%' }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><Text>Tỷ lệ thành công</Text><Text strong>{operational_metrics.success_rate}%</Text></div>
                    <Progress percent={operational_metrics.success_rate} showInfo={false} strokeColor={THEME_COLORS.primary} />
                </div>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><Text>Tỷ lệ hủy đơn</Text><Text strong>{operational_metrics.cancel_rate}%</Text></div>
                    <Progress percent={operational_metrics.cancel_rate} showInfo={false} strokeColor={THEME_COLORS.danger} />
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><Text>Tỷ lệ trả hàng</Text><Text strong>{operational_metrics.return_rate}%</Text></div>
                    <Progress percent={operational_metrics.return_rate} showInfo={false} strokeColor={THEME_COLORS.accent} />
                </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };
  
  const renderProducts = () => {
    if (loading) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>⏳ Đang tải dữ liệu...</div>
        </Card>
      );
    }

    if (!productsData) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>
            ❌ Không có dữ liệu
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Button type="primary" onClick={() => fetchData()}>
                  Thử tải lại
                </Button>
                <Button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
                  {autoRefreshEnabled ? "Tắt tự động làm mới" : "Bật tự động làm mới"}
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      );
    }
    const { product_performance, basket_analysis } = productsData;

    return (
      <div>
        <Card title={<Title level={5}>Hiệu suất từng loại nông sản</Title>} style={{ marginBottom: 24, borderRadius: '12px' }}>
          <Table dataSource={product_performance} rowKey="id" scroll={{ x: 1000 }}
            columns={[
              { title: "Sản phẩm", dataIndex: "name", key: "name", fixed: "left", width: 250, 
                render: (text, record) => (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {record.image && <img src={record.image} alt={text} style={{ width: 40, height: 40, marginRight: 12, objectFit: "cover", borderRadius: '8px' }} />}
                    <span>{text}</span>
                  </div>
                )},
              { title: "Lượt xem", dataIndex: "views", key: "views", sorter: (a, b) => a.views - b.views },
              { title: "Thêm giỏ hàng", dataIndex: "cart_adds", key: "cart_adds", sorter: (a, b) => a.cart_adds - b.cart_adds },
              { title: "Đã bán", dataIndex: "units_sold", key: "units_sold", sorter: (a, b) => a.units_sold - b.units_sold },
              { title: "Doanh thu", dataIndex: "revenue", key: "revenue", sorter: (a, b) => a.revenue - b.revenue, render: (value) => formatCurrency(value) },
              { title: "Tỷ lệ chuyển đổi", dataIndex: "conversion_rate", key: "conversion_rate", sorter: (a, b) => a.conversion_rate - b.conversion_rate, 
                render: (value) => {
                  let color = THEME_COLORS.danger;
                  if (value > 5) color = THEME_COLORS.primary;
                  else if (value > 2) color = THEME_COLORS.secondary;
                  return <Tag color={color}>{value.toFixed(2)}%</Tag>;
                }
              }
            ]}
          />
        </Card>
        <Card title={<Title level={5}>Khách thường mua gì cùng nhau?</Title>} style={{ borderRadius: '12px' }}>
          {!basket_analysis || basket_analysis.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, color: THEME_COLORS.text }}>
              <BulbOutlined style={{ fontSize: 48, color: THEME_COLORS.secondary, marginBottom: 16 }} />
              <p>Chưa có đủ dữ liệu để phân tích sản phẩm mua cùng nhau.</p>
              <p style={{ fontSize: 12, color: "#999" }}>Cần ít nhất 2 đơn hàng có nhiều sản phẩm để tạo phân tích.</p>
            </div>
          ) : (
            <Table dataSource={basket_analysis} rowKey={(record) => `${record.product1_id}-${record.product2_id}`} pagination={false}
              columns={[
                { title: "Sản phẩm 1", dataIndex: "product1_name", key: "product1_name" },
                { title: "Sản phẩm 2", dataIndex: "product2_name", key: "product2_name" },
                { title: "Số lần mua cùng", dataIndex: "frequency", key: "frequency", sorter: (a, b) => a.frequency - b.frequency },
                { title: "Gợi ý", key: "suggestion", render: () => (<Tag icon={<BulbOutlined />} color="processing">Tạo combo khuyến mãi</Tag>) }
              ]}
            />
          )}
        </Card>
      </div>
    );
  };
  
  const renderTraffic = () => {
    if (loading) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>⏳ Đang tải dữ liệu...</div>
        </Card>
      );
    }

    if (!trafficData) {
      return (
        <Card>
          <div style={{ textAlign: "center", padding: 50 }}>
            ❌ Không có dữ liệu
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Button type="primary" onClick={() => fetchData()}>
                  Thử tải lại
                </Button>
                <Button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
                  {autoRefreshEnabled ? "Tắt tự động làm mới" : "Bật tự động làm mới"}
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      );
    }

    const { traffic_sources, top_keywords, customer_analysis } = trafficData;
    const trafficPieData = (traffic_sources || []).map(item => ({ name: item.source, value: item.visits }));
    const customerPieData = [
      { name: "Khách mới", value: customer_analysis?.new_customers || 0 },
      { name: "Khách quay lại", value: customer_analysis?.returning_customers || 0 }
    ];

    return (
      <div>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title={<Title level={5}>Khách hàng đến từ đâu?</Title>} style={{ borderRadius: '12px', height: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={trafficPieData} cx="50%" cy="50%" labelLine={false}
                       label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                       outerRadius={100} fill="#8884d8" dataKey="value">
                    {trafficPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Title level={5}>Phân Tích Khách Hàng</Title>} style={{ borderRadius: '12px', height: '100%' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={customerPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                       fill="#8884d8" paddingAngle={5} dataKey="value">
                    {customerPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Statistic title="Tổng khách hàng" value={customer_analysis?.total_customers || 0} />
                <Statistic title="Tỷ lệ quay lại" value={customer_analysis?.retention_rate || 0} suffix="%" valueStyle={{ color: THEME_COLORS.primary }}/>
              </div>
            </Card>
          </Col>
        </Row>

        <Card title={<Title level={5}>Từ Khóa Vàng - Khách tìm gì mua nấy</Title>} style={{ borderRadius: '12px' }}>
          <Table dataSource={top_keywords || []} rowKey="keyword" pagination={false}
            columns={[
              { title: "Từ khóa", dataIndex: "keyword", key: "keyword" },
              { title: "Số lượt tìm", dataIndex: "count", key: "count", sorter: (a, b) => a.count - b.count },
              { title: "Xu hướng", key: "trend", render: (_, record) => {
                  const isHot = record.count > 10;
                  return <Tag color={isHot ? "volcano" : "default"}>{isHot ? "🔥 Tìm nhiều" : "Bình thường"}</Tag>;
                }
              }
            ]}
          />
        </Card>
      </div>
    );
  };
  
  // --- Component chính ---
  return (
    <AnalyticsBaseLayout
      title="THỐNG KÊ"
      period={period}
      setPeriod={setPeriod}
      dateRange={dateRange}
      setDateRange={setDateRange}
      onRefresh={() => fetchData()}
      loading={loading}
      lastUpdated={lastUpdated}
      autoRefreshEnabled={autoRefreshEnabled}
      setAutoRefreshEnabled={setAutoRefreshEnabled}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="large">
        <Tabs.TabPane
          tab={<span><DashboardOutlined /> Tổng quan</span>}
          key="overview"
        >
          {renderOverview()}
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span><RiseOutlined /> Bán hàng</span>}
          key="sales"
        >
          {renderSales()}
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span><AppstoreOutlined /> Sản phẩm</span>}
          key="products"
        >
          {renderProducts()}
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={<span><TeamOutlined /> Khách hàng</span>}
          key="traffic"
        >
          {renderTraffic()}
        </Tabs.TabPane>
      </Tabs>
    </AnalyticsBaseLayout>
  );
}