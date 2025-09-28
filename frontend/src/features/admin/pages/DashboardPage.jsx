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
  const [debugOrders, setDebugOrders] = useState([]);

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
        console.log("✅ Dashboard API response:", response.data);
        setData(response.data);
      } catch (err) {
        console.error("❌ Dashboard API error:", err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading data</div>;

  // ✅ KPI cards (dùng fallback nếu backend chưa trả)
  const kpis = [
    {
      title: "Tổng doanh thu",
      value: `${(data.total_revenue || 0).toLocaleString()} ₫ / tháng`,
      color: "blue",
      icon: <FireOutlined style={{ color: "red" }} />,
    },
    {
      title: "Đơn hàng mới",
      value: `${data.new_orders_today || 0} đơn`,
      color: "gold",
      icon: <ShoppingOutlined />,
    },
    {
      title: "Đơn hàng đang xử lý",
      value: `${data.processing_orders || 0} đơn`,
      color: "geekblue",
      icon: <SyncOutlined />,
    },
    {
      title: "Khiếu nại mới",
      value: `${data.new_complaints || 0} khiếu nại`,
      color: "red",
      icon: <WarningOutlined />,
    },
    {
      title: "Người dùng mới",
      value: `${data.new_users_today || 0} người / hôm nay`,
      color: "purple",
      icon: <UserAddOutlined />,
    },
    {
      title: "Tỷ lệ hủy đơn",
      value: `${data.cancel_rate || 0}%`,
      color: "gray",
      icon: <StopOutlined />,
    },
  ];

  // ✅ Chuẩn hóa dữ liệu PieChart
  // ✅ Chuẩn hóa dữ liệu PieChart → [{status, count}]
  let ordersPieData = [];

  if (Array.isArray(data.orders_by_status)) {
    // Backend trả array
    ordersPieData = Array.isArray(data.orders_by_status)
      ? data.orders_by_status
      : [];
  } else if (
    typeof data.orders_by_status === "object" &&
    data.orders_by_status !== null
  ) {
    // Backend trả object
    ordersPieData = Object.entries(data.orders_by_status).map(
      ([key, value]) => ({
        status: key,
        count: value ?? 0,
      })
    );
  } else {
    // fallback an toàn
    ordersPieData = [];
  }

  console.table(ordersPieData); // 🚀 debug xem đầu vào

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2}>{t("Tổng quan")}</Title>
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
          <Card title={t("Biểu đồ doanh thu theo tháng")}>
            <RevenueChart data={data.revenue_by_month || []} />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title={t("Tỷ lệ trạng thái đơn hàng")}>
            <OrderPieChart data={ordersPieData} />
          </Card>
        </Col>
      </Row>

      {/* Top selling products */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <TopSellingProducts />
        </Col>
      </Row>

      {/* Recent orders */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Đơn hàng gần nhất">
            <RecentOrders data={data.recent_orders || []} />
          </Card>
        </Col>
      </Row>

      {/* Recent disputes */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Khiếu nại gần nhất">
            <RecentDisputes data={data.recent_disputes || []} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
