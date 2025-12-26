// src/features/admin/pages/Report/ReportCustomersPage.jsx
import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Select, DatePicker, Table, Space, Button, Tag, Avatar, Typography,
  Progress, Empty, message, Dropdown, Modal,
} from "antd";
import {
  UserAddOutlined, UserSwitchOutlined, TeamOutlined, RiseOutlined, DownloadOutlined,
  ReloadOutlined, TrophyOutlined, GlobalOutlined, EyeOutlined,
} from "@ant-design/icons";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection";
import { fetchWithAuth } from "../../services/userApi";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function ReportCustomersPage() {
  // Mặc định chọn '7 ngày qua' (week)
  const [timeFilter, setTimeFilter] = useState("week"); 
  const [dateRange, setDateRange] = useState([dayjs().subtract(6, 'day'), dayjs()]);
  
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllProvinces, setShowAllProvinces] = useState(false);

  // Fetch dữ liệu khi bộ lọc thay đổi
  useEffect(() => {
    fetchCustomerStatistics();
  }, [dateRange, timeFilter]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener ? mql.addEventListener("change", handleChange) : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handleChange) : mql.removeListener(handleChange);
    };
  }, []);

  // --- LOGIC LỌC (3 LOẠI CƠ BẢN) ---
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();
    
    switch (val) {
      case "week": 
        // 7 ngày qua
        setDateRange([today.subtract(6, "day").startOf('day'), today.endOf('day')]); 
        break;
      case "month": 
        // Tháng này
        setDateRange([today.startOf("month"), today.endOf('day')]); 
        break;
      case "year":
        // Năm nay
        setDateRange([today.startOf("year"), today.endOf('day')]);
        break;
      default: break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
      // Khi chọn lịch thủ công -> set timeFilter về null để Dropdown hiển thị trống (hoặc placeholder)
      setTimeFilter(null); 
    }
  };

  // --- DỮ LIỆU GIẢ LẬP ---
  const generateMockTrendData = (filter, start, end) => {
    const data = [];
    let current = dayjs(start);
    const stop = dayjs(end);

    const unit = filter === 'year' ? 'month' : 'day';
    const format = filter === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD';

    while (current.isBefore(stop) || current.isSame(stop, unit)) {
      data.push({
        date: current.format(format),
        new: Math.floor(Math.random() * 50) + 10,
        returning: Math.floor(Math.random() * 40) + 5,
      });
      current = current.add(1, unit);
    }
    return data;
  };

  const fetchCustomerStatistics = async () => {
    try {
      setLoading(true);
      
      // Nếu timeFilter là null (chọn tay), mặc định gửi 'day' để server gom nhóm theo ngày
      const filterToSend = timeFilter || 'day';
      let queryParams = `?filter=${filterToSend}`;
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].format("YYYY-MM-DD");
        const end = dateRange[1].format("YYYY-MM-DD");
        queryParams += `&start_date=${start}&end_date=${end}`;
      }

      const data = await fetchWithAuth(
        `${API_BASE_URL}/users/statistics/customers/${queryParams}`
      );

      const summary = data.summary || { total: 0, newCustomers: 0, returningCustomers: 0, retentionRate: 0 };
      
      setStatsData([
        { title: "Tổng khách hàng", value: summary.total.toLocaleString(), icon: <TeamOutlined style={{ fontSize: "24px" }} />, color: "#1890ff", trend: 5 },
        { title: "Khách hàng mới", value: summary.newCustomers.toLocaleString(), icon: <UserAddOutlined style={{ fontSize: "24px" }} />, color: "#52c41a", trend: 12 },
        { title: "Khách quay lại", value: summary.returningCustomers.toLocaleString(), icon: <UserSwitchOutlined style={{ fontSize: "24px" }} />, color: "#722ed1", trend: -2 },
        { title: "Tỷ lệ giữ chân", value: `${summary.retentionRate}%`, icon: <RiseOutlined style={{ fontSize: "24px" }} />, color: "#faad14", trend: 5 },
      ]);

      setTopCustomers(data.topCustomers || []);
      
      if (data.geoDistribution && data.geoDistribution.length > 0) {
        const totalGeo = data.geoDistribution.reduce((sum, item) => sum + item.count, 0);
        const formattedGeo = data.geoDistribution.map(item => ({
            city: item.city,
            count: item.count,
            percent: totalGeo > 0 ? Math.round((item.count / totalGeo) * 100) : 0,
        })).sort((a, b) => b.percent - a.percent);
        setGeoData(formattedGeo);
      } else {
        setGeoData([]);
      }
      
      if (data.trendData && data.trendData.length > 0) {
        setTrendData(data.trendData);
      } else if (dateRange && dateRange[0]) {
        setTrendData(generateMockTrendData(timeFilter, dateRange[0], dateRange[1]));
      } else {
        setTrendData([]);
      }

    } catch (err) {
      console.error("Error fetching customer statistics:", err);
      if(dateRange) setTrendData(generateMockTrendData(timeFilter, dateRange[0], dateRange[1]));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
      message.info(`Đang xuất báo cáo định dạng ${format.toUpperCase()}... (Tính năng đang phát triển)`);
  };

  // Format trục X
  const formatXAxis = (tickItem) => {
    if (!tickItem) return "";
    const date = dayjs(tickItem);
    if (timeFilter === 'year') {
        return `T${date.month() + 1}`;
    }
    return date.format("DD/MM");
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
            <div style={{ fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{text || "Unknown User"}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Hạng thành viên",
      key: "tier",
      width: 140,
      render: (_, record) => <Tag color={record.tierColor || "default"}>{record.tier || "Thành viên"}</Tag>
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "spent",
      key: "spent",
      width: 160,
      sorter: (a, b) => a.spent - b.spent,
      render: (val) => <Text strong style={{ color: "#1890ff" }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}</Text>,
      align: "right",
    },
  ];

  return (
    <AdminPageLayout title="THỐNG KÊ KHÁCH HÀNG">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        
        {/* --- TOOLBAR --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            {/* --- Phần bên trái: Bộ lọc --- */}
            <Col xs={24} md={16}>
              <Space wrap size="middle" align="center">
                <Text strong style={{ fontSize: 15 }}>Thời gian:</Text>
                
                <Select 
                  value={timeFilter} 
                  onChange={handleTimeChange} 
                  style={{ width: 140 }}
                  size="middle"
                  placeholder="Tùy chọn"
                >
                  <Option value="week">7 ngày qua</Option>
                  <Option value="month">Tháng này</Option>
                  <Option value="year">Năm nay</Option>
                </Select>

                <RangePicker 
                  value={dateRange} 
                  onChange={handleRangePickerChange} 
                  format="DD/MM/YYYY" 
                  allowClear={false}
                  style={{ width: 250 }}
                />
              </Space>
            </Col>

            {/* --- Phần bên phải: Nút hành động (Merged Logic) --- */}
            <Col xs={24} md={8} style={{ display: "flex", justifyContent: "flex-end" }}>
              <Space>
                <Button icon={<ReloadOutlined spin={loading} />} onClick={fetchCustomerStatistics}>
                    Làm mới
                </Button>
                <Dropdown 
                    menu={{ 
                        items: [{ key: 'csv', label: 'Xuất CSV' }, { key: 'xlsx', label: 'Xuất Excel', disabled: true }], 
                        onClick: ({ key }) => handleExport(key) 
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

        {/* --- SECTION THỐNG KÊ --- */}
        <StatsSection items={statsData} loading={loading} />

        {/* --- BIỂU ĐỒ --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={24}>
            <Card 
              loading={loading} 
              title="📈 Xu hướng phát triển khách hàng" 
              bordered={false}
              extra={<Space><Tag color="green">Khách mới</Tag><Tag color="blue">Khách quay lại</Tag></Space>}
            >
              <div style={{ width: "100%", height: 400 }}>
                {trendData.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12}}
                        tickFormatter={formatXAxis} 
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} 
                        labelFormatter={(label) => {
                            const d = dayjs(label);
                            return timeFilter === 'year' ? `Tháng ${d.month() + 1}/${d.year()}` : d.format("DD/MM/YYYY");
                        }}
                      />
                      <Line type="monotone" dataKey="new" stroke="#52c41a" strokeWidth={3} dot={{ r: 4 }} name="Khách mới" />
                      <Line type="monotone" dataKey="returning" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} name="Khách quay lại" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="Chưa có dữ liệu biểu đồ" style={{paddingTop: 100}} />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* --- TOP KHÁCH HÀNG & BẢN ĐỒ --- */}
        <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
                <Card title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><span>Top Khách Hàng Tiêu Biểu</span></Space>} bordered={false} loading={loading}>
                    <Table columns={columns} dataSource={topCustomers} rowKey="email" pagination={{ pageSize: 5 }} size={isMobile ? 'small' : 'middle'} scroll={isMobile ? { x: 700 } : undefined} />
                </Card>
            </Col>
            <Col xs={24} xl={8}>
                <Card 
                    title={
                        <Space>
                            <GlobalOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                            <span style={{ fontSize: 16, fontWeight: 600 }}>Khu vực hoạt động</span>
                        </Space>
                    } 
                    bordered={false} 
                    loading={loading}
                    bodyStyle={{ padding: '20px 24px' }}
                >
                    {geoData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {geoData.slice(0, 5).map((item, index) => {
                                return (
                                    <div 
                                        key={index} 
                                        style={{
                                            background: '#fff',
                                            borderRadius: 8,
                                            padding: '12px 14px',
                                            transition: 'all 0.2s ease',
                                            border: '1px solid #e8e8e8',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#d9d9d9';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e8e8e8';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Space size={8}>
                                                <div style={{ 
                                                    width: 6, 
                                                    height: 6, 
                                                    borderRadius: '50%', 
                                                    background: index === 0 ? '#1890ff' : '#8c8c8c' 
                                                }} />
                                                <Text style={{ fontSize: 14, color: '#262626', fontWeight: index === 0 ? 600 : 400 }}>
                                                    {item.city}
                                                </Text>
                                                {index === 0 && (
                                                    <Tag 
                                                        style={{ 
                                                            fontSize: 11, 
                                                            padding: '0 6px',
                                                            borderRadius: 4,
                                                            background: '#e6f7ff',
                                                            border: '1px solid #91d5ff',
                                                            color: '#1890ff',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        TOP 1
                                                    </Tag>
                                                )}
                                            </Space>
                                            <Space size={12} align="center">
                                                <Text type="secondary" style={{ fontSize: 13 }}>
                                                    {item.count} đơn
                                                </Text>
                                                <Text 
                                                    strong 
                                                    style={{ 
                                                        fontSize: 15, 
                                                        color: '#262626',
                                                        minWidth: 42,
                                                        textAlign: 'right'
                                                    }}
                                                >
                                                    {item.percent}%
                                                </Text>
                                            </Space>
                                        </div>
                                        <Progress 
                                            percent={item.percent} 
                                            showInfo={false} 
                                            strokeWidth={6}
                                            strokeColor="#1890ff"
                                            trailColor="#f0f0f0"
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                );
                            })}
                            
                            {geoData.length > 5 && (
                                <Button 
                                    type="link" 
                                    icon={<EyeOutlined />}
                                    onClick={() => setShowAllProvinces(true)}
                                    style={{ marginTop: 8, padding: 0 }}
                                >
                                    Xem chi tiết {geoData.length - 5} tỉnh/thành khác
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                            description={
                                <span style={{ color: '#8c8c8c' }}>
                                    Chưa có dữ liệu khu vực
                                </span>
                            }
                            style={{ padding: '40px 0' }}
                        />
                    )}
                </Card>
            </Col>
        </Row>

        <Modal
            title={
                <Space>
                    <GlobalOutlined style={{ color: '#1890ff' }} />
                    <span>Tất cả khu vực hoạt động ({geoData.length})</span>
                </Space>
            }
            open={showAllProvinces}
            onCancel={() => setShowAllProvinces(false)}
            footer={null}
            width={700}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                {geoData.map((item, index) => {
                    return (
                        <div 
                            key={index} 
                            style={{
                                background: '#fff',
                                borderRadius: 8,
                                padding: '10px 12px',
                                border: '1px solid #e8e8e8',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Space size={6}>
                                    <Text style={{ 
                                        fontSize: 12, 
                                        color: '#8c8c8c',
                                        minWidth: 20
                                    }}>
                                        #{index + 1}
                                    </Text>
                                    <div style={{ 
                                        width: 5, 
                                        height: 5, 
                                        borderRadius: '50%', 
                                        background: index < 3 ? '#1890ff' : '#d9d9d9' 
                                    }} />
                                    <Text style={{ fontSize: 13, color: '#262626', fontWeight: index < 3 ? 500 : 400 }}>
                                        {item.city}
                                    </Text>
                                </Space>
                                <Text 
                                    strong 
                                    style={{ 
                                        fontSize: 14, 
                                        color: '#262626',
                                        minWidth: 38,
                                        textAlign: 'right'
                                    }}
                                >
                                    {item.percent}%
                                </Text>
                            </div>
                            <Progress 
                                percent={item.percent} 
                                showInfo={false} 
                                strokeWidth={5}
                                strokeColor="#1890ff"
                                trailColor="#f0f0f0"
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                    );
                })}
            </div>
        </Modal>
      </Space>
    </AdminPageLayout>
  );
}