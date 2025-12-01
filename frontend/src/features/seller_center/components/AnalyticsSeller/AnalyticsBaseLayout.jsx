import React from "react";
import {
  Row,
  Col,
  Select,
  DatePicker,
  Card,
  Typography,
  Button,
  Space,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AnalyticsBaseLayout({
  title,
  subtitle,
  children,
  period,
  setPeriod,
  dateRange,
  setDateRange,
  onRefresh,
  loading = false,
  lastUpdated,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  periodOptions = [
    { value: "today", label: "Hôm nay" },
    { value: "7days", label: "7 ngày qua" },
    { value: "30days", label: "30 ngày qua" },
    { value: "custom", label: "Tùy chỉnh" },
  ],
}) {
  return (
    <div style={{ padding: 6, background: "#fff", minHeight: "100vh" }}>
      {/* Header với tiêu đề và controls */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ paddingLeft: 24, margin: 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Text
              type="secondary"
              style={{ paddingLeft: 24, display: "block", marginTop: 4 }}
            >
              {subtitle}
            </Text>
          )}
        </Col>
        <Col style={{ paddingRight: 24 }}>
          <Space size={16}>
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 150 }}
              size="large"
            >
              {periodOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
            {period === "custom" && (
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="YYYY-MM-DD"
                size="large"
              />
            )}
          </Space>
        </Col>
      </Row>

      {/* Action buttons */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 24, paddingLeft: 24, paddingRight: 24 }}
      >
        <Col>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cập nhật gần nhất: {lastUpdated.toLocaleString("vi-VN")}
            </Text>
          )}
        </Col>
      </Row>

      {/* Nội dung chính */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>{children}</div>
    </div>
  );
}
