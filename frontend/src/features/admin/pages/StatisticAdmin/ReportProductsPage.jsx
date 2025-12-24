import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Row, Col, Tag, message, Typography, Space, Button, Tooltip, Tabs, Empty, Dropdown
} from "antd";
import {
  TrophyOutlined, AlertOutlined, ExclamationCircleOutlined, FrownOutlined, ReloadOutlined,
  DollarOutlined, WarningOutlined, DownloadOutlined
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";

import api from "../../../login_register/services/api";
import { productApi } from "../../services/productApi";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection";

const { Title, Text } = Typography;

export default function ReportProductsPage() {
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [stats, setStats] = useState({
    topCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    complaintRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [requestingProductId, setRequestingProductId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      const data = Array.isArray(res.data) ? res.data : [];

      const top5 = [...data].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
      const low = data.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
      const out = data.filter((p) => (p.stock || 0) === 0);

      const sold = data.reduce((sum, p) => sum + (p.sold || 0), 0);
      const complaints = data.reduce((sum, p) => sum + (p.complaints || 0), 0);
      const complaintRate =
        sold > 0 ? ((complaints / sold) * 100).toFixed(2) : 0;

      setTopProducts(top5);
      setLowStock(low);
      setOutOfStock(out);
      setStats({
        topCount: top5.length,
        lowStockCount: low.length,
        outOfStockCount: out.length,
        complaintRate,
      });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestImport = async (productId, productName) => {
    setRequestingProductId(productId);
    try {
      await productApi.requestImport(productId);
      message.success(`Đã gửi yêu cầu nhập cho: ${productName}`);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi gửi yêu cầu nhập");
    } finally {
      setRequestingProductId(null);
    }
  };

  const handleExport = (key) => {
    message.success("Đang xuất báo cáo sản phẩm...");
  };

  const statItems = [
    { title: "Top Sản Phẩm", value: stats.topCount, icon: <TrophyOutlined />, color: "#faad14" },
    { title: "Sắp Hết Hàng", value: stats.lowStockCount, icon: <AlertOutlined />, color: "#fa8c16" },
    { title: "Đã Hết Hàng", value: stats.outOfStockCount, icon: <ExclamationCircleOutlined />, color: "#ff4d4f" },
    { title: "Tỷ lệ Khiếu Nại", value: `${stats.complaintRate}%`, icon: <FrownOutlined />, color: stats.complaintRate > 5 ? "#ff4d4f" : "#52c41a" },
  ];

  const barColors = ["#1677ff", "#4096ff", "#69b1ff", "#91caff", "#bae0ff"];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "12px",
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <p
            style={{
              margin: "0 0 4px 0",
              fontWeight: "bold",
              color: "#1677ff",
            }}
          >
            {label}
          </p>
          <p style={{ margin: 0 }}>
            Đã bán: <strong>{data.sold}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Tồn kho:{" "}
            <strong style={{ color: data.stock <= 10 ? "#faad14" : "#52c41a" }}>
              {data.stock}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const lowStockColumns = [
    { title: "Sản phẩm", dataIndex: "name", width: '50%', render: (text) => <Text strong ellipsis={{ tooltip: text }}>{text}</Text> },
    { title: "Tồn", dataIndex: "stock", align: "center", width: '20%', sorter: (a, b) => a.stock - b.stock, render: (value) => <Tag color={value === 0 ? "error" : "warning"}>{value}</Tag> },
    { title: "Hành động", align: "right", render: (_, record) => (
        <Tooltip title={record.stock === 0 ? "Nhập khẩn cấp" : "Tạo phiếu nhập"}>
          <Button icon={<DollarOutlined />} size="small" type={record.stock === 0 ? "primary" : "default"} danger={record.stock === 0} loading={requestingProductId === record.id} onClick={() => handleRequestImport(record.id, record.name)}>Nhập</Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <AdminPageLayout title="THỐNG KÊ SẢN PHẨM">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        
        {/* --- STANDARDIZED TOOLBAR --- */}
        <Card bordered={false} bodyStyle={{ padding: "16px 24px" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={14}>
               {/* Product Page often just shows Current Status, so no date picker needed usually, 
                   but we keep the space for alignment or add category filter later */}
               <Text strong>Trạng thái: </Text>
               <Tag color="blue">Hiện tại</Tag>
            </Col>
            <Col xs={24} md={10} style={{ textAlign: "right" }}>
              <Space>
                <Button 
                    icon={<ReloadOutlined spin={loading} />} 
                    onClick={loadData}
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

        {/* --- Stats --- */}
        <StatsSection items={statItems} loading={loading} />

        {/* --- Content --- */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><TrophyOutlined style={{ color: "#faad14" }} /><span>Top Sản Phẩm Bán Chạy</span></Space>} bordered={false} style={{ height: '100%' }}>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer>
                  {topProducts.length > 0 ? (
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} interval={0} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="sold" barSize={24} radius={[0, 4, 4, 0]}>
                        {topProducts.map((entry, index) => <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />)}
                      </Bar>
                    </BarChart>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 80 }} />}
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title={<Space><WarningOutlined style={{ color: "#fa8c16" }} /><span>Cảnh Báo Tồn Kho</span></Space>} bordered={false} style={{ height: '100%' }}>
              <Tabs defaultActiveKey="low" items={[
                  { key: 'low', label: <Space>Sắp hết <Tag color="warning" style={{ margin: 0 }}>{stats.lowStockCount}</Tag></Space>, children: <Table columns={lowStockColumns} dataSource={lowStock} rowKey="id" pagination={{ pageSize: 5 }} size="small" /> },
                  { key: 'out', label: <Space>Hết hàng <Tag color="error" style={{ margin: 0 }}>{stats.outOfStockCount}</Tag></Space>, children: <Table columns={lowStockColumns} dataSource={outOfStock} rowKey="id" pagination={{ pageSize: 5 }} size="small" /> },
              ]} />
            </Card>
          </Col>
        </Row>
      </Space>
    </AdminPageLayout>
  );
}
