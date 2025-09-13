// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, Typography, Badge } from "antd";
import {
  FireOutlined,
  ShoppingOutlined,
  SyncOutlined,
  WarningOutlined,
  UserAddOutlined,
  StopOutlined,
} from "@ant-design/icons";
import RevenueChart from "../components/Dashboard/RevenueChart";
import OrderPieChart from "../components/Dashboard/OrderPieChart";
import TopSellingProducts from "../components/Dashboard/TopSellingProducts";
import RecentOrders from "../components/Dashboard/RecentOrders";
import RecentDisputes from "../components/Dashboard/RecentDisputes";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(response.data);
      } catch (err) {
        console.error("Dashboard API error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading data</div>;

  const kpis = [
    {
      title: "Tổng doanh thu",
      value: `${data.total_revenue?.toLocaleString()} ₫ / tháng`,
      color: "blue",
      icon: <FireOutlined style={{ color: "red" }} />,
    },
    {
      title: "Đơn hàng mới",
      value: `${data.new_orders_today} đơn`,
      color: "gold",
      icon: <ShoppingOutlined />,
    },
    {
      title: "Đơn hàng đang xử lý",
      value: `${data.processing_orders} đơn`,
      color: "geekblue",
      icon: <SyncOutlined spin />,
    },
    {
      title: "Khiếu nại mới",
      value: `${data.new_complaints} khiếu nại`,
      color: "red",
      icon: <WarningOutlined />,
    },
    {
      title: "Người dùng mới",
      value: `${data.new_users_today} người / hôm nay`,
      color: "purple",
      icon: <UserAddOutlined />,
    },
    {
      title: "Tỷ lệ hủy đơn",
      value: `${data.cancel_rate}%`,
      color: "gray",
      icon: <StopOutlined />,
    },
  ];

  // ✅ Chuẩn hóa data cho PieChart
  const ordersPieData = [
    { name: "Chờ xác nhận", value: data.orders_by_status?.pending || 0 },
    { name: "Đang giao", value: data.orders_by_status?.shipping || 0 },
    { name: "Hoàn thành", value: data.orders_by_status?.completed || 0 },
    { name: "Đã hủy", value: data.orders_by_status?.cancelled || 0 },
    { name: "Hoàn trả", value: data.orders_by_status?.returned || 0 },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2}>{t("Dashboard")}</Title>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        {kpis.map((kpi, idx) => (
          <Col xs={24} sm={12} md={8} key={idx}>
            <Card>
              <Row align="middle" justify="space-between">
                <Col>
                  <Title level={5}>{kpi.title}</Title>
                  <Badge color={kpi.color} text={kpi.value} />
                </Col>
                <Col style={{ fontSize: 32 }}>{kpi.icon}</Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={14}>
          <Card title={t("dashboard.charts.revenue_by_month")}>
            <RevenueChart data={data.revenue_by_month} />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title={t("dashboard.charts.orders_by_status")}>
            <OrderPieChart data={ordersPieData} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <TopSellingProducts />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Đơn hàng gần nhất">
            <RecentOrders />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <RecentDisputes />
        </Col>
      </Row>
    </div>
  );
}
