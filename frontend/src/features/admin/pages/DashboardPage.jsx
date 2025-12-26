import React from "react";
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
import RevenueChart from "../components/DashboardAdmin/RevenueChart";
import OrderPieChart from "../components/DashboardAdmin/OrderPieChart";
import TopSellingProducts from "../components/DashboardAdmin/TopSellingProducts";
import RecentOrders from "../components/DashboardAdmin/RecentOrders";
import RecentDisputes from "../components/DashboardAdmin/RecentDisputes";
import { useTranslation } from "react-i18next";
import adminApi from "../services/adminApi";

const { Title } = Typography;

export default function DashboardPage() {
  const { t } = useTranslation();

  // ✅ Sử dụng React Query với cấu hình tối ưu caching
  const { data, isLoading, isError, dataUpdatedAt, isPlaceholderData } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: adminApi.getDashboardStats,
    staleTime: 1000 * 60 * 5, // Dữ liệu được coi là tươi trong 5 phút
    gcTime: 1000 * 60 * 30,    // Giữ trong cache 30 phút
    placeholderData: (previousData) => previousData, // Giữ dữ liệu cũ khi đang fetch mới (tránh giật lag)
  });

  // ✅ Trạng thái tải dữ liệu lần đầu (Chỉ hiện Spin khi không có dữ liệu cache)
  if (isLoading && !isPlaceholderData) {
    return (
      <Spin
        fullscreen
        size="large"
        tip="Đang tải dữ liệu tổng quan..."
      />
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
  console.log("🔍 Raw orders_by_status from API:", data.orders_by_status);
  
  let ordersPieData = [];
  if (Array.isArray(data.orders_by_status)) {
    ordersPieData = data.orders_by_status;
  } else if (typeof data.orders_by_status === "object" && data.orders_by_status !== null) {
    ordersPieData = Object.entries(data.orders_by_status).map(([key, value]) => ({
      status: key,
      count: value ?? 0,
    }));
  }
  
  console.log("🔍 Processed ordersPieData:", ordersPieData);

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
          <TopSellingProducts data={data.top_products || []} />
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