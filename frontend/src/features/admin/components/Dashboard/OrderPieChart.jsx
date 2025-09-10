import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function OrderPieChart({ data = [] }) {
  // Nếu backend chưa có data -> fake
  const chartData =
    data && data.length > 0
      ? data
      : [
          { status: "Đang xử lý", value: 20 },
          { status: "Hoàn tất", value: 45 },
          { status: "Đã hủy", value: 10 },
          { status: "Hoàn tiền", value: 5 },
        ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
