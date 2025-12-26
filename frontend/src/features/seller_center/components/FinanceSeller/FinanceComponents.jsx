// src/components/FinanceSeller/FinanceComponents.jsx
import React, { memo } from "react";
import {
  Card,
  Skeleton,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Alert,
  Empty,
} from "antd";
import {
  ReloadOutlined,
  DownloadOutlined,
  DollarOutlined,
  LineChartOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/plots";
import { THEME, formatCurrency } from "../../utils/financeUtils";

const { Title, Text } = Typography;

// --- 1. STAT CARD (Dùng memo để tránh render lại khi props không đổi) ---
export const StatCard = memo(
  ({ title, value, icon, color, subText, loading }) => (
    <Card
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      bodyStyle={{ padding: 24, height: "100%" }}
    >
      <Skeleton loading={loading} active avatar paragraph={{ rows: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {title}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Title
                level={3}
                style={{ margin: 0, color: color, fontSize: 24 }}
              >
                {value}
              </Title>
            </div>
            {subText && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
                {subText}
              </div>
            )}
          </div>
          <div
            style={{
              backgroundColor: `${color}15`,
              padding: 12,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
              minWidth: 48, // Fix kích thước icon để không bị méo
              minHeight: 48,
            }}
          >
            {icon}
          </div>
        </div>
      </Skeleton>
    </Card>
  )
);

// --- 2. HEADER SECTION ---
export const FinanceHeader = memo(({ onRefresh, onExport, loading }) => (
  <div
    style={{
      background: "#fff",
      padding: "20px 24px",
      borderBottom: "1px solid #f0f0f0",
    }}
  >
    <Row justify="space-between" align="middle" gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Title
          level={3}
          style={{ margin: 0, color: THEME.primary, fontSize: 22 }}
        >
          <DollarOutlined style={{ marginRight: 10 }} />
          Tài chính & Doanh thu
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Quản lý dòng tiền và hiệu quả kinh doanh
        </Text>
      </Col>
      <Col xs={24} md={12} style={{ textAlign: "right" }}>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            style={{ background: THEME.primary, borderColor: THEME.primary }}
            onClick={onExport}
            disabled={loading}
          >
            Xuất báo cáo
          </Button>
        </Space>
      </Col>
    </Row>
  </div>
));

// --- 3. REVENUE CHART (Nặng nhất - Cần xử lý kỹ Skeleton) ---
export const RevenueChart = memo(({ data, loading }) => {
  const chartConfig = {
    data: data,
    xField: "date",
    yField: "value",
    seriesField: "metric",
    color: [THEME.primary, THEME.secondary, THEME.warning],
    smooth: true,
    // Tắt animation nặng khi load lần đầu để render nhanh hơn
    animation: { appear: { animation: "fade-in", duration: 800 } },
    areaStyle: () => ({
      fill: `l(270) 0:#ffffff 0.5:${THEME.primary}10 1:${THEME.primary}30`,
    }),
    legend: { position: "top" },
    yAxis: {
      label: { formatter: (v) => `${Number(v) / 1000}k` },
      grid: { line: { style: { stroke: "#f0f0f0" } } },
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.metric,
        value: formatCurrency(datum.value),
      }),
    },
    // Fix chiều cao cứng cho chart container
    autoFit: true,
    height: 300,
  };

  return (
    <Card
      title={
        <Space>
          <LineChartOutlined style={{ color: THEME.primary }} /> Biểu đồ tăng
          trưởng
        </Space>
      }
      bordered={false}
      style={{ borderRadius: 12, height: "100%" }}
      bodyStyle={{ padding: "0 24px 24px 24px" }}
    >
      {/* Container cố định chiều cao 320px để tránh giật layout khi Skeleton tắt */}
      <div
        style={{
          height: 320,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} title={false} />
        ) : data && data.length > 0 ? (
          <Line {...chartConfig} />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có dữ liệu biểu đồ"
          />
        )}
      </div>
    </Card>
  );
});

// --- 4. CASH FLOW FORECAST ---
export const CashFlowForecast = memo(({ pendingBalance, loading }) => (
  <Card
    title={
      <Space>
        <CalendarOutlined style={{ color: THEME.primary }} /> Dự báo dòng tiền
      </Space>
    }
    bordered={false}
    style={{ borderRadius: 12, height: "100%" }}
    bodyStyle={{ padding: 0 }}
  >
    <div style={{ padding: 24 }}>
      <Alert
        message="Lưu ý đối soát"
        description="Đơn COD được đối soát sau 3 ngày giao thành công."
        type="info"
        showIcon
        style={{ marginBottom: 20, fontSize: 13 }}
      />

      <Text strong>Dự kiến về ví:</Text>

      <div style={{ marginTop: 12 }}>
        {loading ? (
          // Skeleton custom cho list items
          <>
            <Skeleton
              active
              paragraph={{ rows: 0 }}
              style={{ marginBottom: 15 }}
            />
            <Skeleton
              active
              paragraph={{ rows: 0 }}
              style={{ marginBottom: 15 }}
            />
            <Skeleton active paragraph={{ rows: 0 }} />
          </>
        ) : (
          [3, 7, 30].map((days, index) => (
            <div
              key={days}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: index !== 2 ? "1px dashed #f0f0f0" : "none",
              }}
            >
              <Text type="secondary">{days} ngày tới</Text>
              {/* Logic giả lập chia tỉ lệ tiền về */}
              <Text strong style={{ color: THEME.primary, fontSize: 16 }}>
                {formatCurrency(
                  pendingBalance > 0
                    ? pendingBalance * (days === 3 ? 0.3 : days === 7 ? 0.6 : 1)
                    : 0
                )}
              </Text>
            </div>
          ))
        )}
      </div>
    </div>
  </Card>
));
