import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Table,
  Space,
  Button,
  Tag,
  Avatar,
  Typography,
  Tabs,
  Progress,
  Empty,
  message,
} from "antd";

import {
  UserAddOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  RiseOutlined,
  DownloadOutlined,
  ManOutlined,
  WomanOutlined,
  GlobalOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection"; // Import component bạn đã cung cấp
import { fetchWithAuth } from "../../services/userApi";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL;

// --- MOCK DATA & CONSTANTS ---
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Placeholder cho biểu đồ giới tính (bạn có thể map API vào đây sau)
const demoGenderData = [
  { name: "Nam", value: 450 },
  { name: "Nữ", value: 550 },
  { name: "Khác", value: 50 },
];

export default function ReportCustomersPage() {
  const [filter, setFilter] = useState("day");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState([]); // Dữ liệu cho StatsSection
  const [trendData, setTrendData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [segmentationData, setSegmentationData] = useState([]);
  const [geoData, setGeoData] = useState([]);

  useEffect(() => {
    fetchCustomerStatistics();
  }, [filter]); // Reload khi filter thay đổi

  const fetchCustomerStatistics = async () => {
    try {
      setLoading(true);
      
      // Gọi API thật
      const data = await fetchWithAuth(
        `${API_BASE_URL}/users/statistics/customers/?filter=${filter}`
      );

      // 1. Xử lý dữ liệu cho StatsSection
      const summary = data.summary || { total: 0, newCustomers: 0, returningCustomers: 0, retentionRate: 0 };
      
      // Tính toán trend giả lập (hoặc lấy từ API nếu có field `prevMonthValue`)
      const calculateTrend = () => Math.floor(Math.random() * 20) - 5; // Mock random -5% đến 15%

      const formattedStats = [
        {
          title: "Tổng khách hàng",
          value: summary.total.toLocaleString(),
          icon: <TeamOutlined style={{ fontSize: "24px" }} />,
          color: "#1890ff", // Blue
          trend: calculateTrend(), 
        },
        {
          title: "Khách hàng mới",
          value: summary.newCustomers.toLocaleString(),
          icon: <UserAddOutlined style={{ fontSize: "24px" }} />,
          color: "#52c41a", // Green
          trend: 12, // Ví dụ hardcode trend tăng
        },
        {
          title: "Khách quay lại",
          value: summary.returningCustomers.toLocaleString(),
          icon: <UserSwitchOutlined style={{ fontSize: "24px" }} />,
          color: "#722ed1", // Purple
          trend: -2, // Ví dụ giảm nhẹ
        },
        {
          title: "Tỷ lệ giữ chân",
          value: `${summary.retentionRate}%`,
          icon: <RiseOutlined style={{ fontSize: "24px" }} />,
          color: "#faad14", // Orange (Gold)
          trend: 5,
        },
      ];

      setStatsData(formattedStats);
      setTopCustomers(data.topCustomers || []);
      setSegmentationData(data.segmentationData || []);
      
      // Xử lý dữ liệu địa lý
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
      
      // Mock trend data nếu API chưa trả về list
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

  // Cấu hình cột cho bảng Top Customers chuyên nghiệp hơn
  const columns = [
    {
      title: "Khách hàng",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#f56a00' }}>{text ? text.charAt(0).toUpperCase() : "U"}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text || "Unknown User"}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Hạng thành viên",
      key: "tier",
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
      sorter: (a, b) => a.orders - b.orders,
      align: "center",
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "spent",
      key: "spent",
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
        
        {/* --- Toolbar: Bộ lọc & Hành động --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={16}>
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
            <Col xs={24} md={8} style={{ textAlign: "right" }}>
              <Button type="primary" icon={<DownloadOutlined />}>
                Xuất báo cáo
              </Button>
            </Col>
          </Row>
        </Card>

        {/* --- Stats Section (Reuse Component) --- */}
        <StatsSection items={statsData} loading={loading} />

        {/* --- Charts Row --- */}
        <Row gutter={[24, 24]}>
          {/* Cột trái: Biểu đồ xu hướng (Chiếm 2/3) */}
          <Col xs={24} lg={16}>
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
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} 
                    />
                    <Line type="monotone" dataKey="new" stroke="#52c41a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Khách mới" />
                    <Line type="monotone" dataKey="returning" stroke="#1890ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Khách quay lại" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Cột phải: Phân nhóm/Demographics (Chiếm 1/3) */}
          <Col xs={24} lg={8}>
            <Card loading={loading} title="🎯 Phân nhóm khách hàng" bordered={false} style={{ height: '100%' }}>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: 'Theo phân khúc',
                        children: (
                            <div style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                {/* Nếu có data thật thì render PieChart, ở đây dùng mock */}
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={segmentationData.length > 0 ? segmentationData : [{name: 'Mới', value: 40}, {name: 'Thân thiết', value: 30}, {name: 'Vãng lai', value: 30}]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {segmentationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{textAlign: 'center', marginTop: 10}}>
                                    <Space size="large">
                                        {segmentationData.slice(0, 3).map((item, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                                                <Text type="secondary" style={{fontSize: 12}}>{item.segment || item.name}</Text>
                                            </div>
                                        ))}
                                    </Space>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: '2',
                        label: 'Giới tính (Demo)',
                        children: (
                            <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Row gutter={16} style={{width: '100%', marginBottom: 20}}>
                                    <Col span={12} style={{textAlign: 'center'}}>
                                        <ManOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                                        <div><Text strong>45%</Text></div>
                                        <Text type="secondary">Nam</Text>
                                    </Col>
                                    <Col span={12} style={{textAlign: 'center'}}>
                                        <WomanOutlined style={{ fontSize: 40, color: '#eb2f96' }} />
                                        <div><Text strong>55%</Text></div>
                                        <Text type="secondary">Nữ</Text>
                                    </Col>
                                </Row>
                                <Progress percent={55} strokeColor="#eb2f96" trailColor="#1890ff" showInfo={false} />
                            </div>
                        )
                    }
                ]} />
            </Card>
          </Col>
        </Row>

        {/* --- Bottom Row: Table & Extra Stats --- */}
        <Row gutter={[24, 24]}>
            {/* Top Customers Table */}
            <Col xs={24} xl={16}>
                <Card 
                    title={
                        <Space>
                            <TrophyOutlined style={{ color: '#faad14' }} />
                            <span>Top Khách Hàng Tiêu Biểu</span>
                        </Space>
                    }
                    bordered={false}
                    loading={loading}
                    extra={<Button type="link">Xem tất cả</Button>}
                >
                    <Table
                        columns={columns}
                        dataSource={topCustomers}
                        rowKey="email"
                        pagination={{ pageSize: 5 }}
                    />
                </Card>
            </Col>

            {/* Geographic Distribution (New Placeholder Section) */}
            <Col xs={24} xl={8}>
                <Card 
                    title={
                        <Space>
                            <GlobalOutlined />
                            <span>Khu vực hoạt động</span>
                        </Space>
                    } 
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
                                    strokeColor={index === 0 ? '#faad14' : '#1890ff'} // Top 1 màu vàng
                                />
                            </div>
                        )) : (
                          <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description={<Text type="secondary">Chưa có dữ liệu phân bố khu vực</Text>}
                          />
                        )
                        }
                    </div>
                </Card>
            </Col>
        </Row>
      </Space>
    </AdminPageLayout>
  );
}