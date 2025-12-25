import React, { useState, useEffect } from "react";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection"; // Đảm bảo đường dẫn đúng
import API from "../../../login_register/services/api";

import {
  DatePicker,
  Select,
  Card,
  Table,
  Tag,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Avatar,
  Progress,
  List,
  message,
  Empty,
  Skeleton
} from "antd";

import {
  ShopOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  StarOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { intcomma } from "../../../../utils/format";
import { FireOutlined, ThunderboltOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const COLORS = ["#52c41a", "#faad14", "#1890ff", "#ff4d4f", "#722ed1"];

export default function ReportAgriculturePage() {
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [suppliersData, setSuppliersData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchAgricultureReport();
  }, [filter]);

  useEffect(() => {
    // Detect mobile viewport (iPhone 14 Pro Max ~430px width)
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener ? mql.addEventListener("change", handleChange) : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handleChange) : mql.removeListener(handleChange);
    };
  }, []);


  const calculateServiceQuality = (supplier) => {
    const cancelPenalty = (supplier.cancelRate || 0) * 5;
    const delayPenalty = (supplier.delayRate || 0) * 5;
    return Math.max(0, 100 - cancelPenalty - delayPenalty);
  };

  const fetchAgricultureReport = async () => {
    try {
      setLoading(true);

      // 1. Gọi song song 2 API:
      // - sellersRes: Lấy danh sách nhà cung cấp và chỉ số hoạt động
      // - categoriesRes: Lấy biểu đồ phân bố ngành hàng (API mới bạn vừa thêm ở Backend)
      const [sellersRes, categoriesRes] = await Promise.all([
        API.get('sellers/report/agriculture/'),
        API.get('sellers/report/categories/')
      ]);

      // --- XỬ LÝ DỮ LIỆU NHÀ CUNG CẤP (Table & Stats) ---
      const rawSellerData = sellersRes.data?.data || [];
      setSuppliersData(rawSellerData);

      // Tính toán các chỉ số tổng hợp để hiển thị lên 4 ô thống kê đầu trang
      const totalSuppliers = rawSellerData.length;

      // Tính tổng doanh thu toàn sàn nông sản
      const totalRevenue = rawSellerData.reduce((sum, item) => sum + (item.revenue || 0), 0);

      // Tính đánh giá trung bình
      const avgRating = totalSuppliers > 0
        ? (rawSellerData.reduce((sum, item) => sum + (item.rating || 0), 0) / totalSuppliers).toFixed(1)
        : 0;

      // Tính chất lượng dịch vụ trung bình
      const avgServiceQuality = totalSuppliers > 0
        ? (rawSellerData.reduce((sum, item) => sum + calculateServiceQuality(item), 0) / totalSuppliers).toFixed(1)
        : 0;

      // Cập nhật State cho StatsSection
      const stats = [
        {
          title: "Tổng nhà cung cấp",
          value: totalSuppliers,
          icon: <ShopOutlined style={{ fontSize: "24px" }} />,
          color: "#52c41a",
        },
        {
          title: "Tổng doanh thu",
          value: `${intcomma(totalRevenue)} đ`,
          icon: <DollarCircleOutlined style={{ fontSize: "24px" }} />,
          color: "#1890ff",
        },
        {
          title: "Đánh giá trung bình",
          value: `${avgRating}/5.0`,
          icon: <StarOutlined style={{ fontSize: "24px" }} />,
          color: "#faad14",
        },
        {
          title: "Chất lượng dịch vụ",
          value: `${avgServiceQuality}%`,
          icon: <FireOutlined style={{ fontSize: "24px" }} />,
          color: "#ff7a45",
        },
      ];
      setStatsData(stats);

      // --- XỬ LÝ DỮ LIỆU BIỂU ĐỒ TRÒN (Pie Chart) ---
      // Lấy trực tiếp từ API mới, không cần tính toán thủ công nữa
      const chartData = categoriesRes.data?.data || [];
      setCategoryData(chartData);

    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
      message.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // --- Cấu hình cột Table ---
  const columns = [
    {
      title: "Cửa hàng",
      dataIndex: "name",
      key: "name",
      fixed: isMobile ? undefined : 'left',
      width: isMobile ? 220 : 250,
      render: (text, record) => (
        <Space>
          {loading ? (
            <Skeleton.Avatar active shape="square" size={40} />
          ) : (
            <Avatar
              shape="square"
              size={40}
              src={record.logo || record.avatar || null}
              icon={!record.logo && !record.avatar ? <UserOutlined /> : null}
              style={
                !record.logo && !record.avatar
                  ? { backgroundColor: record.revenue > 100000000 ? "#52c41a" : "#87d068" }
                  : {}
              }
            />
          )}

          <div>
            <Text strong style={{ display: 'inline-block', maxWidth: isMobile ? 150 : 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</Text>
          </div>
        </Space>
      )
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      width: isMobile ? 140 : undefined,
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value) => (
        // SỬ DỤNG intcomma
        <Text strong style={{ color: '#1677ff' }}>
          {intcomma(value)} đ
        </Text>
      )
    },
    {
      title: "Vận hành",
      key: "operation",
      width: isMobile ? 180 : 200,
      render: (_, record) => {
        const score = Math.max(0, 100 - (record.cancelRate * 5) - (record.delayRate * 5));
        let status = "active";
        if (score < 50) status = "exception";

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>Điểm chất lượng</span>
              <span>{score.toFixed(0)}/100</span>
            </div>
            <Progress percent={score} size="small" status={status} strokeColor={score > 80 ? '#52c41a' : undefined} />
          </div>
        );
      }
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      width: isMobile ? 120 : undefined,
      align: 'center',
      render: (value) => <Tag color="gold" icon={<StarOutlined />}>{value}</Tag>
    },
    {
      title: "Sản phẩm",
      dataIndex: "products",
      key: "products",
      width: isMobile ? 120 : undefined,
      align: 'center',
      render: (val) => <Tag>{val} loại</Tag>
    }
  ];

  return (
    <AdminPageLayout title="THỐNG KÊ CỬA HÀNG">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>

        {/* --- Toolbar --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Space wrap>
                <Text strong>Bộ lọc:</Text>
                <RangePicker style={{ width: 250 }} />
                <Select value={filter} onChange={setFilter} style={{ width: 140 }}>
                  <Option value="month">Tháng này</Option>
                  <Option value="quarter">Quý này</Option>
                  <Option value="year">Năm nay</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "right" }}>
              <Button type="primary" icon={<DownloadOutlined />} style={{ backgroundColor: '#fff', borderColor: '#28a645', color: '#28a645'  }}>
                Xuất báo cáo
              </Button>
            </Col>
          </Row>
        </Card>

        {/* --- Stats Section --- */}
        <StatsSection items={statsData} loading={loading} />

        {/* --- Charts Row --- */}
        <Row gutter={[24, 24]}>
          {/* Chart 1: Doanh thu theo nhà cung cấp (Bar Chart) */}
          <Col xs={24} lg={14}>
            <Card
              loading={loading}
              title="Top Nhà cung cấp theo Doanh thu"
              bordered={false}
            >
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={suppliersData.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    {/* YAxis giữ nguyên M format cho gọn biểu đồ, hoặc có thể custom nếu muốn */}
                    <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                    <RechartsTooltip
                      // SỬ DỤNG intcomma
                      formatter={(value) => `${intcomma(value)} đ`}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="revenue" name="Doanh thu" radius={[4, 4, 0, 0]}>
                      {suppliersData.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#52c41a' : '#bae7ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Chart 2: Phân bố danh mục (Pie Chart) & Top Products List */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>

              {/* Phân bố danh mục */}
              <Card title="Phân bố ngành hàng" bordered={false} loading={loading}>
                {categoryData && categoryData.length > 0 ? (
                  <div style={{ width: "100%", height: 220, display: 'flex' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `${intcomma(value)}`} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Empty description="Chưa có dữ liệu danh mục" style={{ marginTop: 50 }} />
                )}
              </Card>
            </Space>
          </Col>
        </Row>

        {/* --- Data Table --- */}
        <Card
          title={
            <Space>
              <ShopOutlined style={{ color: '#52c41a' }} />
              <span>Chi tiết hiệu quả hoạt động Nhà cung cấp</span>
            </Space>
          }
          bordered={false}
          loading={loading}
        >
          <Table
            columns={columns}
            dataSource={suppliersData}
            rowKey="id"
            pagination={{ pageSize: 5, showTotal: (total) => `Tổng ${total} NCC` }}
            size={isMobile ? 'small' : 'middle'}
            tableLayout="fixed"
            scroll={isMobile ? { x: 900 } : { x: 1000 }}
            style={isMobile ? { whiteSpace: 'nowrap' } : undefined}
          />
        </Card>

      </Space>
    </AdminPageLayout>
  );
}