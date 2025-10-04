import React from "react";
import { Card } from "antd";
import { Bar } from "@ant-design/charts";

export default function FinanceRevenueChart({ data, loading }) {
  const config = {
    data,
    xField: "date",
    yField: "amount",
    seriesField: "type",
    isGroup: true,
    legend: { position: 'top-left' },
    color: ["#3f8600", "#1890ff"],
    loading,
  };
  return (
    <Card bordered={false} style={{ marginBottom: 16 }} title="Doanh thu theo ngày/tháng">
      <Bar {...config} />
    </Card>
  );
}
