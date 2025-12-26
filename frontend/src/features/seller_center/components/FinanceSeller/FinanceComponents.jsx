import React from "react";
import {
  Card,
  Skeleton,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Tag,
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

// --- 1. STAT CARD ---
export const StatCard = ({ title, value, icon, color, subText, loading }) => {
  // --- SỬA: Chỉ loading khi chưa có giá trị ---
  const showLoading = loading && (value === undefined || value === null);

  return (
    <Card
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
      bodyStyle={{ padding: 24 }}
    >
      <Skeleton loading={showLoading} active paragraph={{ rows: 1 }}>
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
              <Title level={3} style={{ margin: 0, color: color }}>
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
            }}
          >
            {icon}
          </div>
        </div>
      </Skeleton>
    </Card>
  );
};

// --- 2. HEADER SECTION ---
export const FinanceHeader = ({ onRefresh, onExport, loading }) => (
  <div
    style={{
      background: "#fff",
      padding: "24px 32px",
      borderBottom: "1px solid #f0f0f0",
    }}
  >
    <Row justify="space-between" align="middle">
      <Col>
        <Title level={3} style={{ margin: 0, color: THEME.primary }}>
          <DollarOutlined style={{ marginRight: 12 }} />
          Tài chính & Doanh thu
        </Title>
        <Text type="secondary">
          Quản lý dòng tiền và hiệu quả kinh doanh của cửa hàng
        </Text>
      </Col>
      <Col>
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
          >
            Xuất báo cáo
          </Button>
        </Space>
      </Col>
    </Row>
  </div>
);

// --- 3. REVENUE CHART ---
export const RevenueChart = ({ data, loading }) => {
  // --- SỬA: Chỉ loading khi mảng data rỗng ---
  const showLoading = loading && (!data || data.length === 0);

  const chartConfig = {
    data: data || [],
    xField: "date",
    yField: "value",
    seriesField: "metric",
    color: [THEME.primary, THEME.secondary, THEME.warning],
    smooth: true,
    animation: { appear: { animation: "path-in", duration: 1000 } },
    areaStyle: () => ({
      fill: `l(270) 0:#ffffff 0.5:${THEME.primary}10 1:${THEME.primary}30`,
    }),
    legend: { position: "top" },
    yAxis: {
      label: { formatter: (v) => `${Number(v) / 1000}k` },
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.metric,
        value: formatCurrency(datum.value),
      }),
    },
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
    >
      {showLoading ? (
        <Skeleton active />
      ) : (
        <div style={{ height: 300 }}>
          {data && data.length > 0 ? (
            <Line {...chartConfig} />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có dữ liệu biểu đồ"
            />
          )}
        </div>
      )}
    </Card>
  );
};

// --- 4. CASH FLOW FORECAST ---
export const CashFlowForecast = ({ pendingBalance }) => (
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
        description="Các đơn hàng COD sẽ được đối soát tự động sau khi giao hàng thành công 3 ngày."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Text strong>Dự kiến về ví:</Text>
      <div style={{ marginTop: 12 }}>
        {[7, 14, 30].map((days) => (
          <div
            key={days}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: "1px dashed #f0f0f0",
            }}
          >
            <Text type="secondary">{days} ngày tới</Text>
            {/* Component này hiện thẳng giá trị, nếu 0 thì hiện 0đ, không cần skeleton */}
            <Text strong style={{ color: THEME.primary }}>
              {formatCurrency(pendingBalance > 0 ? pendingBalance : 0)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  </Card>
);
