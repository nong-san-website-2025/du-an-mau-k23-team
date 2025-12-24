import React, { useState, useEffect } from "react";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection";
import API from "../../../login_register/services/api";

import {
  DatePicker, Select, Card, Table, Tag, Row, Col, Space, Typography, Button, Avatar, Progress, message, Empty, Skeleton, Dropdown
} from "antd";

import {
  ShopOutlined, DollarCircleOutlined, StarOutlined, DownloadOutlined,
  FireOutlined, ReloadOutlined, UserOutlined,
} from "@ant-design/icons";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { intcomma } from "../../../../utils/format";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const COLORS = ["#52c41a", "#faad14", "#1890ff", "#ff4d4f", "#722ed1"];

export default function ReportAgriculturePage() {
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(false);
  const [suppliersData, setSuppliersData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchAgricultureReport();
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

  const calculateServiceQuality = (supplier) => {
    const cancelPenalty = (supplier.cancelRate || 0) * 5;
    const delayPenalty = (supplier.delayRate || 0) * 5;
    return Math.max(0, 100 - cancelPenalty - delayPenalty);
  };

  const fetchAgricultureReport = async () => {
    try {
      setLoading(true);
      const [sellersRes, categoriesRes] = await Promise.all([
        API.get('sellers/report/agriculture/'),
        API.get('sellers/report/categories/')
      ]);

      const rawSellerData = sellersRes.data?.data || [];
      setSuppliersData(rawSellerData);

      const totalSuppliers = rawSellerData.length;
      const totalRevenue = rawSellerData.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const avgRating = totalSuppliers > 0
        ? (rawSellerData.reduce((sum, item) => sum + (item.rating || 0), 0) / totalSuppliers).toFixed(1)
        : 0;
      const avgServiceQuality = totalSuppliers > 0
        ? (rawSellerData.reduce((sum, item) => sum + calculateServiceQuality(item), 0) / totalSuppliers).toFixed(1)
        : 0;

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
      setCategoryData(categoriesRes.data?.data || []);

    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
      message.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (filename, sections) => {
      // (Giữ nguyên logic downloadCSV như cũ)
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
      const base = `BaoCao_CuaHang_${new Date().toISOString().slice(0,10).replace(/-/g, '')}`;
      if (format === 'csv') {
        const rows = (suppliersData || []).map((s) => ({
          'Nhà cung cấp': s.supplier || s.vendor || s.owner || '',
          'Cửa hàng': s.store_name || s.shopName || '',
          'Doanh thu': s.revenue ?? 0,
          'Vận hành': Math.max(0, 100 - (s.cancelRate || 0) * 5 - (s.delayRate || 0) * 5).toFixed(0),
        }));
        const sections = [
          {
            title: 'Chi tiết hiệu quả hoạt động Nhà cung cấp',
            headers: ['Nhà cung cấp','Cửa hàng','Doanh thu','Vận hành'],
            rows,
          },
        ];
        downloadCSV(`${base}.csv`, sections);
        message.success('Đã xuất CSV');
      } else {
        message.info('Sắp ra mắt');
      }
    } catch (e) {
      console.error(e);
      message.error('Xuất báo cáo thất bại');
    }
  };

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
              style={!record.logo && !record.avatar ? { backgroundColor: "#87d068" } : {}}
            />
          )}
          <div>
            <Text strong style={{ display: 'inline-block', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</Text>
          </div>
        </Space>
      )
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      width: 140,
      sorter: (a, b) => a.revenue - b.revenue,
      render: (value) => <Text strong style={{ color: '#1677ff' }}>{intcomma(value)} đ</Text>
    },
    {
      title: "Vận hành",
      key: "operation",
      width: 200,
      render: (_, record) => {
        const score = Math.max(0, 100 - (record.cancelRate * 5) - (record.delayRate * 5));
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>Điểm chất lượng</span>
              <span>{score.toFixed(0)}/100</span>
            </div>
            <Progress percent={score} size="small" status={score < 50 ? "exception" : "active"} />
          </div>
        );
      }
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      width: 120,
      align: 'center',
      render: (value) => <Tag color="gold" icon={<StarOutlined />}>{value}</Tag>
    },
  ];

  return (
    <AdminPageLayout title="THỐNG KÊ CỬA HÀNG">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>

        {/* --- STANDARDIZED TOOLBAR --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={14}>
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
            <Col xs={24} md={10} style={{ textAlign: "right" }}>
              <Space>
                <Button 
                    icon={<ReloadOutlined spin={loading} />} 
                    onClick={fetchAgricultureReport}
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
          <Col xs={24} lg={14}>
            <Card loading={loading} title="Top Nhà cung cấp theo Doanh thu" bordered={false}>
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={suppliersData.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                    <RechartsTooltip formatter={(value) => `${intcomma(value)} đ`} cursor={{ fill: 'transparent' }} />
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

          <Col xs={24} lg={10}>
             <Card title="Phân bố ngành hàng" bordered={false} loading={loading} style={{ height: '100%' }}>
                {categoryData && categoryData.length > 0 ? (
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `${intcomma(value)}`} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Empty description="Chưa có dữ liệu danh mục" style={{ marginTop: 50 }} />
                )}
             </Card>
          </Col>
        </Row>

        <Card title={<Space><ShopOutlined style={{ color: '#52c41a' }} /><span>Chi tiết hiệu quả hoạt động Nhà cung cấp</span></Space>} bordered={false} loading={loading}>
          <Table
            columns={columns}
            dataSource={suppliersData}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size={isMobile ? 'small' : 'middle'}
            scroll={isMobile ? { x: 900 } : { x: 1000 }}
          />
        </Card>

      </Space>
    </AdminPageLayout>
  );
}