import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RevenueChart({ data = [] }) {
  // Nếu backend chưa trả dữ liệu -> fake data để test
  const chartData =
    data && data.length > 0
      ? data
      : [
          { month: "Jan", revenue: 1200000 },
          { month: "Feb", revenue: 2100000 },
          { month: "Mar", revenue: 1800000 },
          { month: "Apr", revenue: 2500000 },
          { month: "May", revenue: 3200000 },
          { month: "Jun", revenue: 2800000 },
        ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#1890ff"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
