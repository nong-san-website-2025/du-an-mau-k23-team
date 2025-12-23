// src/features/admin/pages/reports/ReportProductsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Table, Row, Col, Tag, message, Typography, Space, Button, Tooltip, Tabs, Empty
} from "antd";
import {
  TrophyOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  FrownOutlined,
  ReloadOutlined,
  EditOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined // Import thêm icon Warning nếu chưa có, hoặc dùng AlertOutlined
} from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from "recharts";

import api from "../../../login_register/services/api";
import { productApi } from "../../services/productApi";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatsSection from "../../components/common/StatsSection";

const { Title, Text } = Typography;

export default function ReportProductsPage() {
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [stats, setStats] = useState({ topCount: 0, lowStockCount: 0, outOfStockCount: 0, complaintRate: 0 });
  const [loading, setLoading] = useState(false);
  const [requestingProductId, setRequestingProductId] = useState(null);

  // --- 1. Tải và Xử lý dữ liệu ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      const data = Array.isArray(res.data) ? res.data : [];

      // Logic xử lý dữ liệu
      const top5 = [...data].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
      const low = data.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
      const out = data.filter((p) => (p.stock || 0) === 0);

      const sold = data.reduce((sum, p) => sum + (p.sold || 0), 0);
      const complaints = data.reduce((sum, p) => sum + (p.complaints || 0), 0);
      const complaintRate = sold > 0 ? ((complaints / sold) * 100).toFixed(2) : 0;

      setTopProducts(top5);
      setLowStock(low);
      setOutOfStock(out);
      setStats({ topCount: top5.length, lowStockCount: low.length, outOfStockCount: out.length, complaintRate });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 1.5. Gửi yêu cầu nhập sản phẩm ---
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 2. Cấu hình dữ liệu cho StatsSection ---
  const statItems = [
    {
      title: "Top Sản Phẩm",
      value: stats.topCount,
      icon: <TrophyOutlined />,
      color: "#faad14", // Vàng
    },
    {
      title: "Sắp Hết Hàng",
      value: stats.lowStockCount,
      icon: <AlertOutlined />,
      color: "#fa8c16", // Cam
    },
    {
      title: "Đã Hết Hàng",
      value: stats.outOfStockCount,
      icon: <ExclamationCircleOutlined />,
      color: "#ff4d4f", // Đỏ
    },
    {
      title: "Tỷ lệ Khiếu Nại",
      value: `${stats.complaintRate}%`,
      icon: <FrownOutlined />,
      color: stats.complaintRate > 5 ? "#ff4d4f" : "#52c41a",
    },
  ];

  // --- 3. Cấu hình Biểu đồ & Bảng ---
  const barColors = ["#1677ff", "#4096ff", "#69b1ff", "#91caff", "#bae0ff"];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1677ff' }}>{label}</p>
          <p style={{ margin: 0 }}>Đã bán: <strong>{data.sold}</strong></p>
          <p style={{ margin: 0 }}>Tồn kho: <strong style={{ color: data.stock <= 10 ? '#faad14' : '#52c41a' }}>{data.stock}</strong></p>
        </div>
      );
    }
    return null;
  };

  const topColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      width: '45%',
      render: (text) => <Text strong ellipsis={{ tooltip: text }}>{text}</Text>,
    },
    {
      title: "Đã bán",
      dataIndex: "sold",
      align: "center",
      sorter: (a, b) => a.sold - b.sold,
      render: (value) => <Text strong type="success">{value}</Text>,
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      align: "center",
      render: (value) => <Tag color={value <= 10 ? "warning" : "success"}>{value}</Tag>,
    },
    // {
    //   title: "Thao tác",
    //   align: "center",
    //   render: (_, record) => (
    //     <Tooltip title="Chỉnh sửa">
    //       <Button type="text" icon={<EditOutlined />} size="small" onClick={() => message.info(`Sửa: ${record.name}`)} />
    //     </Tooltip>
    //   )
    // }
  ];

  const lowStockColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      width: '50%',
      render: (text) => <Text strong ellipsis={{ tooltip: text }}>{text}</Text>,
    },
    {
      title: "Tồn",
      dataIndex: "stock",
      align: "center",
      width: '20%',
      sorter: (a, b) => a.stock - b.stock,
      render: (value) => <Tag color={value === 0 ? "error" : "warning"}>{value}</Tag>,
    },
    {
      title: "Hành động",
      align: "right",
      render: (_, record) => (
        <Tooltip title={record.stock === 0 ? "Nhập khẩn cấp" : "Tạo phiếu nhập"}>
          <Button
            icon={<DollarOutlined />}
            size="small"
            type={record.stock === 0 ? "primary" : "default"}
            danger={record.stock === 0}
            loading={requestingProductId === record.id}
            onClick={() => handleRequestImport(record.id, record.name)}
          >
            Nhập
          </Button>
        </Tooltip>
      ),
    },
  ];

  const lowStockTabs = [
    {
      key: 'low',
      label: <Space>Sắp hết <Tag color="warning" style={{ margin: 0 }}>{stats.lowStockCount}</Tag></Space>,
      children: <Table columns={lowStockColumns} dataSource={lowStock} rowKey="id" pagination={{ pageSize: 5 }} size="small" locale={{ emptyText: <Empty description="Không có sản phẩm sắp hết" /> }} />
    },
    {
      key: 'out',
      label: <Space>Hết hàng <Tag color="error" style={{ margin: 0 }}>{stats.outOfStockCount}</Tag></Space>,
      children: <Table columns={lowStockColumns} dataSource={outOfStock} rowKey="id" pagination={{ pageSize: 5 }} size="small" locale={{ emptyText: <Empty description="Tốt! Không có sản phẩm hết hàng" /> }} />
    },
  ];

  return (
    <AdminPageLayout
      title="THỐNG KÊ SẢN PHẨM" extra={
        <Tooltip title="Làm mới dữ liệu">
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} type="primary" shape="round">
            Làm mới
          </Button>
        </Tooltip>
      }
    >
      {/* --- PHẦN 1: THỐNG KÊ TỔNG QUAN --- */}
      <div style={{ marginBottom: 24 }}>
        <StatsSection items={statItems} loading={loading} />
      </div>

      {/* --- PHẦN 2: BIỂU ĐỒ VÀ BẢNG CHI TIẾT --- */}
      <Row gutter={[24, 24]}>
        {/* Cột trái: Biểu đồ Top Sản Phẩm */}
        <Col xs={24} lg={16}>
          <Card
            title={
              // THAY ĐỔI: Sử dụng Space và TrophyOutlined thay cho emoji 🏆
              <Space align="center">
                <TrophyOutlined style={{ color: "#faad14", fontSize: "20px" }} />
                <Title level={4} style={{ margin: 0 }}>Top Sản Phẩm Bán Chạy</Title>
              </Space>
            }
            bordered={false}
            className="shadow-sm"
            style={{ height: '100%' }}
          >
            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer>
                {topProducts.length > 0 ? (
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} interval={0} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
                    <RechartsTooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="sold" barSize={24} radius={[0, 4, 4, 0]}>
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : <Empty description="Chưa có dữ liệu bán hàng" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 80 }} />}
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 24 }}>
              <Table
                columns={topColumns}
                dataSource={topProducts}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          </Card>
        </Col>

        {/* Cột phải: Quản lý tồn kho */}
        <Col xs={24} lg={8}>
          <Card
            title={
              // THAY ĐỔI: Sử dụng Space và AlertOutlined thay cho emoji ⚠️
              <Space align="center">
                <AlertOutlined style={{ color: "#fa8c16", fontSize: "20px" }} />
                <Title level={4} style={{ margin: 0 }}>Cảnh Báo Tồn Kho</Title>
              </Space>
            }
            bordered={false}
            className="shadow-sm"
            style={{ height: '100%' }}
            extra={<ShoppingCartOutlined style={{ fontSize: 20, color: '#fa8c16' }} />}
          >
            <Tabs defaultActiveKey="low" items={lowStockTabs} size="middle" />
          </Card>
        </Col>
      </Row>
    </AdminPageLayout>
  );
}