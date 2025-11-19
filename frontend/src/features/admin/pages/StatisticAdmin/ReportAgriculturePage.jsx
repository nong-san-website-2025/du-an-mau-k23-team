import React, { useState, useEffect } from "react";
import AdminPageLayout from "../../components/AdminPageLayout";
import { 
  DatePicker, 
  Select, 
  Card, 
  Table, 
  Tag, 
  Divider, 
  Row, 
  Col, 
  Space, 
  Statistic,
  Typography,
  Badge,
  Spin,
  message
} from "antd";
import {
  ShopOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  StarOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import API from "../../../login_register/services/api";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

export default function ReportAgriculturePage() {
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [suppliersData, setSuppliersData] = useState([]);

  // Fetch dữ liệu từ API
  useEffect(() => {
    fetchAgricultureReport();
  }, []);

  const fetchAgricultureReport = async () => {
    try {
      setLoading(true);
      const res = await API.get('sellers/report/agriculture/');
      setSuppliersData(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
      message.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAgricultureReport();
  };
  const totalSuppliers = suppliersData.length;
  const totalRevenue = suppliersData.reduce((sum, item) => sum + item.revenue, 0);
  const avgCancelRate = (suppliersData.reduce((sum, item) => sum + item.cancelRate, 0) / totalSuppliers).toFixed(1);
  const avgRating = (suppliersData.reduce((sum, item) => sum + item.rating, 0) / totalSuppliers).toFixed(1);

  // Custom Recharts tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p className="label" style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p className="intro" style={{ margin: 0, color: '#1677ff' }}>
            Doanh thu: {payload[0].value.toLocaleString('vi-VN')}đ
          </p>
        </div>
      );
    }
    return null;
  };

  // ===============================
  // TABLE COLUMNS CONFIGURATION
  // ===============================
  const columns = [
    {
      title: "Nhà cung cấp",
      dataIndex: "name",
      key: "name",
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space>
          <Badge 
            status={record.trend === 'up' ? 'success' : 'error'} 
            text={text}
          />
          {record.trend === 'up' ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
        </Space>
      )
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value) => (
        <Text strong style={{ color: '#1677ff' }}>
          {value.toLocaleString('vi-VN')}đ
        </Text>
      )
    },
    {
      title: "Tỷ lệ hủy",
      dataIndex: "cancelRate",
      key: "cancelRate",
      sorter: (a, b) => a.cancelRate - b.cancelRate,
      render: (value) => (
        <Tag color={value > 3 ? "error" : value > 1 ? "warning" : "success"}>
          {value}%
        </Tag>
      )
    },
    {
      title: "Giao chậm",
      dataIndex: "delayRate",
      key: "delayRate",
      sorter: (a, b) => a.delayRate - b.delayRate,
      render: (value) => (
        <Tag color={value > 4 ? "error" : value > 2 ? "warning" : "processing"}>
          {value}%
        </Tag>
      )
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      sorter: (a, b) => a.rating - b.rating,
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <StarOutlined style={{ color: "#fadb14" }} />
          <Text strong>{value}</Text>
        </div>
      )
    },
    {
      title: "Sản phẩm",
      dataIndex: "products",
      key: "products",
      sorter: (a, b) => a.products - b.products,
      render: (value) => (
        <Tag color="default">{value} sản phẩm</Tag>
      )
    },
    {
      title: "Tổng đơn",
      dataIndex: "totalOrders",
      key: "totalOrders",
      sorter: (a, b) => a.totalOrders - b.totalOrders,
      render: (value) => (
        <Text type="secondary">{value} đơn</Text>
      )
    },
    {
      title: "TB Giao hàng",
      dataIndex: "avgDeliveryTime",
      key: "avgDeliveryTime",
      sorter: (a, b) => a.avgDeliveryTime - b.avgDeliveryTime,
      render: (value) => (
        <Text type="secondary">{value} ngày</Text>
      )
    }
  ];

  // ===============================
  // FILTER HANDLERS
  // ===============================
  const handleFilterChange = (value) => {
    setLoading(true);
    setFilter(value);
    
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setLoading(true);
      // Handle date range filtering logic here
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <AdminPageLayout title="BÁO CÁO NHÀ CUNG CẤP NÔNG SẢN ">
      <Spin spinning={loading} size="large">
        <div style={{ padding: 20 }}>
        {/* Filter Section */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16
        }}>
          <Title level={4} style={{ margin: 0 }}>
            <BarChartOutlined /> Báo cáo tổng quan
          </Title>
          
          <Space>
            <RangePicker 
              onChange={handleDateRangeChange}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
            <Select 
              value={filter} 
              onChange={handleFilterChange} 
              style={{ minWidth: 120 }}
              disabled={loading}
            >
              <Option value="day">Theo ngày</Option>
              <Option value="week">Theo tuần</Option>
              <Option value="month">Theo tháng</Option>
              <Option value="quarter">Theo quý</Option>
              <Option value="year">Theo năm</Option>
            </Select>
            <Card.Meta 
              style={{ cursor: 'pointer', padding: '4px 12px' }}
            >
              <ReloadOutlined 
                onClick={handleRefresh}
                spin={loading}
                style={{ fontSize: '18px', cursor: 'pointer' }}
              />
            </Card.Meta>
          </Space>
        </div>

        {/* Summary Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <ShopOutlined style={{ color: "#52c41a" }} />
                    <Text strong>Nhà cung cấp</Text>
                  </Space>
                }
                value={totalSuppliers}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                prefix={<span style={{ color: '#52c41a', fontSize: '16px' }}>+0</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <DollarCircleOutlined style={{ color: "#1677ff" }} />
                    <Text strong>Tổng doanh thu</Text>
                  </Space>
                }
                value={totalRevenue}
                precision={0}
                valueStyle={{ color: '#1677ff', fontSize: '24px' }}
                formatter={(value) => `${value.toLocaleString('vi-VN')}đ`}
                prefix={<span style={{ color: '#52c41a', fontSize: '16px' }}>+5.2%</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <WarningOutlined style={{ color: "#faad14" }} />
                    <Text strong>Tỷ lệ hủy TB</Text>
                  </Space>
                }
                value={avgCancelRate}
                suffix="%"
                valueStyle={{ color: avgCancelRate > 3 ? '#ff4d4f' : '#52c41a', fontSize: '24px' }}
                prefix={avgCancelRate > 3 ? 
                  <FallOutlined style={{ color: '#ff4d4f' }} /> : 
                  <RiseOutlined style={{ color: '#52c41a' }} />
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <StarOutlined style={{ color: "#fadb14" }} />
                    <Text strong>Đánh giá TB</Text>
                  </Space>
                }
                value={avgRating}
                precision={1}
                valueStyle={{ color: '#fadb14', fontSize: '24px' }}
                prefix={<StarOutlined style={{ color: '#fadb14' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0' }} />

        {/* Revenue Chart */}
        <Card 
          title={
            <Space>
              <BarChartOutlined />
              <Text strong>Biểu đồ doanh thu theo nhà cung cấp</Text>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suppliersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  name="Doanh thu"
                  fill="#1677ff"
                  radius={[4, 4, 0, 0]}
                >
                  {suppliersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#1677ff" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Suppliers Table */}
        <Card 
          title={
            <Space>
              <ShopOutlined />
              <Text strong>Chi tiết nhà cung cấp</Text>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={suppliersData}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Tổng ${total} nhà cung cấp`,
              pageSizeOptions: ['5', '10', '20', '50']
            }}
            size="middle"
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
            }
          />
        </Card>
        </div>
      </Spin>

      <style jsx>{`
        .table-row-even {
          background-color: #fafafa;
        }
        .table-row-odd {
          background-color: #fff;
        }
      `}</style>
    </AdminPageLayout>
  );
}