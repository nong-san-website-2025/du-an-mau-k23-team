import React from "react";
import { Row, Col, Card, Statistic, Progress, Empty, Tag } from "antd";
import {
  AppstoreOutlined,
  RiseOutlined,
  SyncOutlined,
  WarningOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Column, Line } from "@ant-design/charts";

export default function PerformanceStats({ analytics }) {
  if (!analytics) {
    return <Empty description="Chưa có dữ liệu hiệu suất" />;
  }

  const overview = analytics.overview || {};
  const performanceData = analytics.performance || {};
  const topProducts = analytics.top_products || [];

  // Dữ liệu cho biểu đồ doanh thu
  const chartData = performanceData.revenue_trend || [
    { date: "Thứ 2", revenue: 0 },
    { date: "Thứ 3", revenue: 0 },
    { date: "Thứ 4", revenue: 0 },
    { date: "Thứ 5", revenue: 0 },
    { date: "Thứ 6", revenue: 0 },
    { date: "Thứ 7", revenue: 0 },
    { date: "CN", revenue: 0 },
  ];

  const orderChartData = performanceData.order_trend || [
    { date: "Thứ 2", orders: 0 },
    { date: "Thứ 3", orders: 0 },
    { date: "Thứ 4", orders: 0 },
    { date: "Thứ 5", orders: 0 },
    { date: "Thứ 6", orders: 0 },
    { date: "Thứ 7", orders: 0 },
    { date: "CN", orders: 0 },
  ];

  const revenueConfig = {
    data: chartData,
    xField: "date",
    yField: "revenue",
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    color: "#52c41a",
    tooltip: {
      formatter: (datum) => {
        return {
          name: "Doanh thu",
          value: new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(datum.revenue),
        };
      },
    },
  };

  const orderConfig = {
    data: orderChartData,
    xField: "date",
    yField: "orders",
    smooth: true,
    color: "#1890ff",
    lineStyle: {
      lineWidth: 3,
    },
    point: {
      size: 5,
      shape: "circle",
    },
    tooltip: {
      formatter: (datum) => {
        return { name: "Đơn hàng", value: datum.orders };
      },
    },
  };

  // Tính phần trăm tăng trưởng
  const growthRate = performanceData.growth_rate || 0;
  const isGrowth = growthRate >= 0;

  return (
    <div>
      {/* Phần thống kê nhanh */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
            <Statistic
              title="Tổng sản phẩm"
              value={overview.total_products || 0}
              prefix={<AppstoreOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#1f2937",
              }}
              titleStyle={{ fontSize: "14px", color: "#6b7280" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
            <Statistic
              title="Đang bán"
              value={overview.active_products || 0}
              valueStyle={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#10b981",
              }}
              titleStyle={{ fontSize: "14px", color: "#6b7280" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
            <Statistic
              title="Đang ẩn"
              value={overview.hidden_products || 0}
              valueStyle={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#f59e0b",
              }}
              titleStyle={{ fontSize: "14px", color: "#6b7280" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
            <Statistic
              title="Tổng đơn hàng"
              value={overview.total_orders || 0}
              valueStyle={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#8b5cf6",
              }}
              titleStyle={{ fontSize: "14px", color: "#6b7280" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Phần tăng trưởng */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              background:
                isGrowth ?
                  "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                  : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div>
                <RiseOutlined
                  style={{
                    fontSize: "32px",
                    color: isGrowth ? "#10b981" : "#ff4d4f",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Tăng trưởng so với tháng trước
                </div>
                <div style={{ fontSize: "28px", fontWeight: 600 }}>
                  <span style={{ color: isGrowth ? "#10b981" : "#ff4d4f" }}>
                    {isGrowth ? "+" : ""}
                    {growthRate}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ doanh thu */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <BarChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Doanh thu theo ngày (Tuần này)
              </span>
            }
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
          >
            <Column {...revenueConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Top sản phẩm bán chạy */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <TrophyOutlined style={{ marginRight: 8, color: "#f59e0b" }} />
                Top 5 Sản phẩm bán chạy
              </span>
            }
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
          >
            {topProducts && topProducts.length > 0 ? (
              <div>
                {topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                        #{index + 1} - {product.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        Số lượng: {product.quantity} | Doanh thu:{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.revenue)}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        minWidth: "100px",
                      }}
                    >
                      <Progress
                        type="circle"
                        percent={Math.min((product.quantity / 100) * 10, 100)}
                        width={50}
                        format={() => `${product.quantity}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="Chưa có sản phẩm bán chạy" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}