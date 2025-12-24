import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Select, DatePicker, Table, Space, Button, Tag, Avatar, Typography,
  Progress, Empty, message, Dropdown,
} from "antd";
import {
  UserAddOutlined, UserSwitchOutlined, TeamOutlined, RiseOutlined, DownloadOutlined,
  ReloadOutlined, TrophyOutlined, GlobalOutlined,
} from "@ant-design/icons";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection";
import { fetchWithAuth } from "../../services/userApi";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function ReportCustomersPage() {
  const [filter, setFilter] = useState("day");
  const [loading, setLoading] = useState(false); // Sửa default false để control manual
  const [statsData, setStatsData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchCustomerStatistics();
  }, [filter]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener ? mql.addEventListener("change", handleChange) : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handleChange) : mql.removeListener(handleChange);
    };
  }, []);

  const fetchCustomerStatistics = async () => {
    try {
      setLoading(true);
      // Giả lập delay để thấy hiệu ứng loading
      // await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const data = await fetchWithAuth(
        `${API_BASE_URL}/users/statistics/customers/?filter=${filter}`
      );

      const summary = data.summary || { total: 0, newCustomers: 0, returningCustomers: 0, retentionRate: 0 };
      const calculateTrend = () => Math.floor(Math.random() * 20) - 5;

      const formattedStats = [
        {
          title: "Tổng khách hàng",
          value: summary.total.toLocaleString(),
          icon: <TeamOutlined style={{ fontSize: "24px" }} />,
          color: "#1890ff",
          trend: calculateTrend(),
        },
        {
          title: "Khách hàng mới",
          value: summary.newCustomers.toLocaleString(),
          icon: <UserAddOutlined style={{ fontSize: "24px" }} />,
          color: "#52c41a",
          trend: 12,
        },
        {
          title: "Khách quay lại",
          value: summary.returningCustomers.toLocaleString(),
          icon: <UserSwitchOutlined style={{ fontSize: "24px" }} />,
          color: "#722ed1",
          trend: -2,
        },
        {
          title: "Tỷ lệ giữ chân",
          value: `${summary.retentionRate}%`,
          icon: <RiseOutlined style={{ fontSize: "24px" }} />,
          color: "#faad14",
          trend: 5,
        },
      ];

      setStatsData(formattedStats);
      setTopCustomers(data.topCustomers || []);
      
      if (data.geoDistribution && data.geoDistribution.length > 0) {
        const totalGeo = data.geoDistribution.reduce((sum, item) => sum + item.count, 0);
        const formattedGeo = data.geoDistribution
          .map(item => ({
            city: item.city,
            percent: totalGeo > 0 ? Math.round((item.count / totalGeo) * 100) : 0,
          }))
          .sort((a, b) => b.percent - a.percent);
        setGeoData(formattedGeo);
      } else {
        setGeoData([]);
      }
      
      const chartData = data.trendData || [
        { date: "20/09", new: 12, returning: 8, total: 20 },
        { date: "21/09", new: 20, returning: 15, total: 35 },
        { date: "22/09", new: 18, returning: 12, total: 30 },
        { date: "23/09", new: 25, returning: 19, total: 44 },
        { date: "24/09", new: 30, returning: 20, total: 50 },
        { date: "25/09", new: 28, returning: 25, total: 53 },
        { date: "26/09", new: 35, returning: 22, total: 57 },
      ];
      setTrendData(chartData);

    } catch (err) {
      console.error("Error fetching customer statistics:", err);
      message.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (filename, sections) => {
    const escape = (v) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const lines = [];
    sections.forEach(({ title, rows, headers }) => {
      lines.push(`# ${title}`);
      if (headers && headers.length) lines.push(headers.join(","));
      rows.forEach((row) => {
        const vals = (headers || Object.keys(row)).map((h) => escape(row[h]));
        lines.push(vals.join(","));
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format) => {
    try {
      const base = `BaoCao_KhachHang_${new Date().toISOString().slice(0,10).replace(/-/g, '')}`;
      if (format === 'csv') {
        const rows = (topCustomers || []).map((c) => ({
          'Khách hàng': c.name,
          'Hạng thành viên': c.tier || 'Thành viên',
          'Số đơn hàng': c.orders,
          'Tổng chi tiêu': c.spent,
        }));
        const sections = [
          {
            title: 'Top Khách Hàng Tiêu Biểu',
            headers: ['Khách hàng', 'Hạng thành viên', 'Số đơn hàng', 'Tổng chi tiêu'],
            rows,
          },
        ];
        downloadCSV(`${base}.csv`, sections);
        message.success('Đã xuất CSV (Top khách hàng)');
      } else if (format === 'xlsx') {
        message.info('Xuất Excel đang sắp ra mắt');
      }
    } catch (e) {
      console.error(e);
      message.error('Xuất báo cáo thất bại');
    }
  };

  const columns = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      key: "name",
      width: isMobile ? 220 : 260,
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#f56a00' }}>{text ? text.charAt(0).toUpperCase() : "U"}</Avatar>
          <div>
            <div style={{ fontWeight: 500, maxWidth: isMobile ? 150 : 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text || "Unknown User"}</div>
            <div style={{ fontSize: "12px", color: "#888", maxWidth: isMobile ? 160 : 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Hạng thành viên",
      key: "tier",
      width: isMobile ? 140 : 160,
      render: (_, record) => {
        const tier = record.tier || "Thành viên";
        const tierColor = record.tierColor || "default";
        return <Tag color={tierColor}>{tier}</Tag>;
      }
    },
    {
      title: "Số đơn hàng",
      dataIndex: "orders",
      key: "orders",
      width: isMobile ? 120 : 140,
      sorter: (a, b) => a.orders - b.orders,
      align: "center",
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "spent",
      key: "spent",
      width: isMobile ? 140 : 160,
      sorter: (a, b) => a.spent - b.spent,
      render: (val) => (
        <Text strong style={{ color: "#1890ff" }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
        </Text>
      ),
      align: "right",
    },
  ];

  return (
    <AdminPageLayout title="THỐNG KÊ KHÁCH HÀNG">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        
        {/* --- STANDARDIZED TOOLBAR --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            {/* Filters */}
            <Col xs={24} md={14}>
              <Space wrap>
                <Text strong>Thời gian:</Text>
                <RangePicker style={{ width: 250 }} />
                <Select value={filter} onChange={setFilter} style={{ width: 140 }}>
                  <Option value="day">Theo ngày</Option>
                  <Option value="week">Theo tuần</Option>
                  <Option value="month">Theo tháng</Option>
                  <Option value="year">Theo năm</Option>
                </Select>
              </Space>
            </Col>

            {/* Actions: Refresh & Export */}
            <Col xs={24} md={10} style={{ textAlign: "right" }}>
              <Space>
                <Button 
                    icon={<ReloadOutlined spin={loading} />} 
                    onClick={fetchCustomerStatistics}
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
                    Xuất báo cáo
                  </Button>
                </Dropdown>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* --- Stats Section --- */}
        <StatsSection items={statsData} loading={loading} />

        {/* --- Charts --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={24}>
            <Card 
              loading={loading} 
              title="📈 Xu hướng phát triển khách hàng" 
              bordered={false}
              extra={
                  <Space>
                      <Tag color="green">Khách mới</Tag>
                      <Tag color="blue">Khách quay lại</Tag>
                  </Space>
              }
            >
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                    <Line type="monotone" dataKey="new" stroke="#52c41a" strokeWidth={3} dot={{ r: 4 }} name="Khách mới" />
                    <Line type="monotone" dataKey="returning" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} name="Khách quay lại" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
                <Card 
                  title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><span>Top Khách Hàng Tiêu Biểu</span></Space>}
                  bordered={false}
                  loading={loading}
                >
                    <Table
                      columns={columns}
                      dataSource={topCustomers}
                      rowKey="email"
                      pagination={{ pageSize: 5 }}
                      size={isMobile ? 'small' : 'middle'}
                      scroll={isMobile ? { x: 700 } : undefined}
                    />
                </Card>
            </Col>

            <Col xs={24} xl={8}>
                <Card 
                  title={<Space><GlobalOutlined /><span>Khu vực hoạt động</span></Space>} 
                  bordered={false}
                  loading={loading}
                >
                    <div style={{ padding: '0 10px' }}>
                        {geoData.length > 0 ? geoData.map((item, index) => (
                            <div key={index} style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <Text>{item.city}</Text>
                                    <Text strong>{item.percent}%</Text>
                                </div>
                                <Progress
                                    percent={item.percent}
                                    showInfo={false}
                                    size="small"
                                    strokeColor={index === 0 ? '#faad14' : '#1890ff'}
                                />
                            </div>
                        )) : (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
                        )}
                    </div>
                </Card>
            </Col>
        </Row>
      </Space>
    </AdminPageLayout>
  );
}