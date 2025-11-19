// src/features/admin/pages/reports/ReportProductsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, Table, Row, Col, Tag, message, Typography, Space, Button, Tooltip, Skeleton, Statistic } from "antd";
import {
  ShoppingOutlined,
  WarningOutlined,
  FrownOutlined,
  TrophyOutlined,
  ReloadOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import api from "../../../login_register/services/api";
import AdminPageLayout from "../../components/AdminPageLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from "recharts";

const { Title, Text } = Typography;

export default function ReportProductsPage() {
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stats, setStats] = useState({ topCount: 0, lowStockCount: 0, complaintRate: 0 });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      const data = Array.isArray(res.data) ? res.data : [];

      const top5 = [...data].sort((a, b) => b.sold - a.sold).slice(0, 5);
      const low = data.filter((p) => (p.stock || 0) <= 10);

      const sold = data.reduce((sum, p) => sum + (p.sold || 0), 0);
      const complaints = data.reduce((sum, p) => sum + (p.complaints || 0), 0);
      const complaintRate = sold > 0 ? ((complaints / sold) * 100).toFixed(2) : 0;

      setTopProducts(top5);
      setLowStock(low);
      setStats({ topCount: top5.length, lowStockCount: low.length, complaintRate });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const barColors = ["#0ea5e9", "#22d3ee", "#38bdf8", "#7dd3fc", "#bae6fd"];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1677ff' }}>{label}</p>
          <p style={{ margin: 0 }}>Đã bán: <strong>{data.sold}</strong></p>
          <p style={{ margin: 0 }}>Tồn kho: <strong>{data.stock}</strong></p>
        </div>
      );
    }
    return null;
  };

  const MetricCard = ({ icon, color, label, value, suffix }) => (
    <Card
      size="small"
      bodyStyle={{ padding: "16px" }}
      className="hover:shadow-md transition-shadow duration-200"
    >
      <Space direction="vertical" size={4}>
        <div className="flex items-center gap-2">
          <Text type="secondary" className="text-sm">
            {label}
          </Text>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <Text strong style={{ fontSize: "20px", color: "#1f2937" }}>
            {value}
          </Text>
          {suffix && <Text type="secondary">{suffix}</Text>}
        </div>
      </Space>
    </Card>
  );

  const topColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <Text strong ellipsis>{text}</Text>,
    },
    {
      title: "Đã bán",
      dataIndex: "sold",
      key: "sold",
      align: "center",
      sorter: (a, b) => a.sold - b.sold,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      sorter: (a, b) => a.stock - b.stock,
      render: (value) => (
        <Tag color={value <= 10 ? "warning" : value === 0 ? "error" : "success"}>
          {value}
        </Tag>
      ),
    },
  ];

  const lowColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong ellipsis>{text}</Text>,
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      sorter: (a, b) => a.stock - b.stock,
      render: (value) => (
        <Tag color={value === 0 ? "error" : "warning"}>{value}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center",
      render: (_, record) => (
        <Tag color={record.stock === 0 ? "error" : "warning"}>
          {record.stock === 0 ? "Hết hàng" : "Sắp hết"}
        </Tag>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title={
        <Space size={12}>
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            BÁO CÁO SẢN PHẨM
          </Title>
        </Space>
      }
      extra={
        <Tooltip title="Làm mới dữ liệu">
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            shape="circle"
            loading={loading}
            className="shadow hover:shadow-md"
          />
        </Tooltip>
      }
    >
      <Skeleton active loading={loading} paragraph={{ rows: 0 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              icon={<TrophyOutlined style={{ color: "#f59e0b" }} />}
              label="Top sản phẩm"
              value={stats.topCount}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              icon={<WarningOutlined style={{ color: "#ef4444" }} />}
              label="Sản phẩm hết hàng"
              value={stats.lowStockCount}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              icon={<AlertOutlined style={{ color: "#dc2626" }} />}
              label="Tỷ lệ khiếu nại"
              value={stats.complaintRate}
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              icon={<ShoppingOutlined style={{ color: "#1677ff" }} />}
              label="Tổng sản phẩm"
              value={topProducts.length + lowStock.length}
            />
          </Col>
        </Row>
      </Skeleton>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Top sản phẩm bán chạy"
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ height: 350, padding: "16px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="sold" name="Đã bán">
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table
              columns={topColumns}
              dataSource={topProducts}
              rowKey="id"
              pagination={false}
              size="small"
              showHeader={false}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Sản phẩm tồn kho thấp">
            <Table
              columns={lowColumns}
              dataSource={lowStock}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </AdminPageLayout>
  );
}