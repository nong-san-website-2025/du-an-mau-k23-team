import React from "react";
import axios from "axios";
import { Row, Col, Card, Typography, Badge, Spin } from "antd";
import {
  FireOutlined,
  ShoppingOutlined,
  SyncOutlined,
  WarningOutlined,
  UserAddOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query"; 
import RevenueChart from "../components/Dashboard/RevenueChart";
import OrderPieChart from "../components/Dashboard/OrderPieChart";
import TopSellingProducts from "../components/Dashboard/TopSellingProducts";
import RecentOrders from "../components/Dashboard/RecentOrders";
import RecentDisputes from "../components/Dashboard/RecentDisputes";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function DashboardPage() {
  const { t } = useTranslation();

  // ✅ 1. Logic Fetch dữ liệu từ API
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get("http://127.0.0.1:8000/api/dashboard/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  // ✅ 2. Cấu hình Real-time với React Query
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchData,
    refetchInterval: 10000, // Tự động làm mới mỗi 10 giây
    keepPreviousData: true, // Giúp giao diện không bị giật khi đang tải lại
  });

  // ✅ 3. Trạng thái tải dữ liệu lần đầu (Loading)
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu realtime..." />
      </div>
    );
  }

  // ✅ 4. Trạng thái lỗi kết nối
  if (isError || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Title level={4} type="danger">Lỗi kết nối Server!</Title>
        <p>Vui lòng kiểm tra lại API Backend hoặc Token đăng nhập.</p>
      </div>
    );
  }

  // ✅ 5. Chuẩn hóa dữ liệu cho các thẻ KPI
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

  // ✅ 6. Chuẩn hóa dữ liệu cho biểu đồ tròn (OrderPieChart)
  let ordersPieData = [];
  if (Array.isArray(data.orders_by_status)) {
    ordersPieData = data.orders_by_status;
  } else if (typeof data.orders_by_status === "object" && data.orders_by_status !== null) {
    ordersPieData = Object.entries(data.orders_by_status).map(([key, value]) => ({
      status: key,
      count: value ?? 0,
    }));
  }

  // ✅ 7. Layout JSX (Giữ nguyên cấu trúc Row/Col của bạn)
  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      
      {/* Header: Tiêu đề & Trạng thái cập nhật */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 0 }}>{t("Tổng quan")}</Title>
          <small style={{ color: "gray" }}>
            Cập nhật lần cuối lúc: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </small>
        </Col>
        <Badge status="processing" text="Dữ liệu trực tuyến (10s)" />
      </Row>

      {/* KPI Cards Section */}
      <Row gutter={[16, 16]}>
        {kpis.map((kpi, idx) => (
          <Col xs={24} sm={12} md={8} key={idx}>
            <Card hoverable>
              <Row align="middle" justify="space-between">
                <Col>
                  <Title level={5} style={{ color: "#8c8c8c", fontWeight: 400 }}>
                    {kpi.title}
                  </Title>
                  <Badge color={kpi.color} text={<b style={{ fontSize: 16 }}>{kpi.value}</b>} />
                </Col>
                <Col style={{ fontSize: 32 }}>{kpi.icon}</Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Section: Doanh thu & Trạng thái đơn hàng */}
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

      {/* Top Selling Products Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <TopSellingProducts />
        </Col>
      </Row>

      {/* Recent Orders Section */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Đơn hàng gần nhất">
            <RecentOrders data={data.recent_orders || []} />
          </Card>
        </Col>
      </Row>

      {/* Recent Disputes Section */}
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