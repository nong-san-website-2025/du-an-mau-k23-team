import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA46BE"];

export default function OrderPieChart({ data = [] }) {
  const isEmpty =
    !data || data.length === 0 || data.every((item) => !item.value || item.value === 0);

  const chartData = isEmpty
    ? [
        { name: "Chờ xác nhận", value: 0 },
        { name: "Đang giao", value: 20 },
        { name: "Hoàn thành", value: 65 },
        { name: "Đã hủy", value: 10 },
        { name: "Hoàn trả", value: 5 },
      ]
    : data;

  console.log("📊 OrderPieChart data:", chartData);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}  // ✅ Donut chart
          outerRadius={100}
          fill="#8884d8"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} đơn`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
